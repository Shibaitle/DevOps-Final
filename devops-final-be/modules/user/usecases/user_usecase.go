package usecases

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"mime/multipart"

	"strings"
	"time"

	"github.com/Shibaitle/DevOps-Final/configs"
	audit_constants "github.com/Shibaitle/DevOps-Final/modules/audit_logs/constants"
	audit_repo "github.com/Shibaitle/DevOps-Final/modules/audit_logs/repositories"
	"github.com/Shibaitle/DevOps-Final/modules/entities"
	user_constants "github.com/Shibaitle/DevOps-Final/modules/user/constants"
	"github.com/Shibaitle/DevOps-Final/modules/user/repositories"
	"github.com/Shibaitle/DevOps-Final/pkg/utils"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/text/unicode/norm"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountNotApproved = errors.New("account is pending approval")
	ErrAdminOnly          = errors.New("admin only")
	ErrTargetUserNotFound = errors.New("target user not found")
)

type UserUsecase interface {
	Register(user *entities.User, roleName string, file multipart.File) (*entities.User, error)
	Login(username, email, password string, remember bool) (string, *entities.User, error)
	ResetPassword(userID, oldPassword, newPassword string) error

	GetUserByID(id string) (*entities.User, error)
	GetAllUsers(userID string) ([]*entities.User, error)

	GetUsersByFirstAndLastName(firstName string, lastName string) ([]*entities.User, error)
	UpdateUserByID(id string, user *entities.User, file multipart.File) (*entities.User, error)
	UpdateUserApprovalByID(targetUserID string, isApprove bool, adminUserID string) (*entities.User, error)

	DeleteUserByID(targetUserID string, adminUserID string) error
}

type UserUseCaseImpl struct {
	userrepo     repositories.UserRepository
	auditlogrepo audit_repo.AuditLogRepository
	jwtSecret    string
	supa         configs.Supabase
	mail         configs.Mail
}

func NewUserUseCase(
	userrepo repositories.UserRepository,
	auditlogrepo audit_repo.AuditLogRepository,
	jwt configs.JWT,
	supa configs.Supabase,
	mail configs.Mail) UserUsecase {

	return &UserUseCaseImpl{
		userrepo:     userrepo,
		auditlogrepo: auditlogrepo,
		jwtSecret:    jwt.Secret,
		supa:         supa,
		mail:         mail,
	}
}

func (u *UserUseCaseImpl) Register(user *entities.User, roleName string, file multipart.File) (*entities.User, error) {
	normalizedEmail, err := utils.NormalizeEmail(user.Email)
	if err != nil {
		return nil, errors.New("invalid email format: " + err.Error())
	}

	role, err := u.userrepo.GetRoleByName(roleName)
	if err != nil {
		return nil, errors.New("role not found: " + err.Error())
	}

	user.Email = normalizedEmail
	user.Username = norm.NFC.String(user.Username)

	usernameExists, err := u.userrepo.UsernameExists(user.Username)
	if err != nil {
		return nil, errors.New("failed to check username availability: " + err.Error())
	}
	if usernameExists {
		return nil, errors.New("username already exists")
	}

	emailExists, err := u.userrepo.EmailExists(user.Email)
	if err != nil {
		return nil, errors.New("failed to check email availability: " + err.Error())
	}
	if emailExists {
		return nil, errors.New("email already exists")
	}

	user.ID = uuid.New().String()
	user.RoleID = role.ID
	user.IsApprove = false

	// Upload profile image if provided
	if file != nil {
		fileExtension, err := utils.DetectFileType(file)
		if err != nil {
			return nil, errors.New("invalid file: " + err.Error())
		}

		// Reset file pointer to beginning after DetectFileType
		if _, err = file.Seek(0, io.SeekStart); err != nil {
			return nil, errors.New("failed to reset file pointer: " + err.Error())
		}

		fileName := uuid.New().String() + fileExtension

		profileURL, err := utils.UploadFile2Supa(file, fileName, "profiles/", u.supa)
		if err != nil {
			return nil, errors.New("failed to upload profile image: " + err.Error())
		}

		user.ProfileImage = profileURL
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("failed to hash password: " + err.Error())
	}
	user.Password = string(hashedPassword)
	createdUser, err := u.userrepo.CreateUser(user)
	if err != nil {
		return nil, errors.New("failed to create user: " + err.Error())
	}



	newUserData, _ := json.Marshal(map[string]interface{}{
		"username":   createdUser.Username,
		"email":      createdUser.Email,
		"role_id":    createdUser.RoleID,
		"first_name": createdUser.FirstName,
		"last_name":  createdUser.LastName,
	})

	auditLog := &entities.AuditLogs{
		ID:        uuid.New().String(),
		TableName: "users",
		RecordID:  createdUser.ID,
		UserID:    createdUser.ID,
		Action:    audit_constants.AuditActionInsert,
		OldValue:  "",
		NewValue:  string(newUserData),
	}

	_, err = u.auditlogrepo.CreateAuditLog(auditLog)
	if err != nil {
		log.Printf("[ERROR] Failed to create audit log for new user %s: %v", createdUser.ID, err)
	}

	return createdUser, nil
}

func (u *UserUseCaseImpl) Login(username, email, password string, remember bool) (string, *entities.User, error) {
	if username != "" && email != "" {
		return "", nil, errors.New("please provide either username or email, not both")
	}

	if username == "" && email == "" {
		return "", nil, errors.New("username or email is required")
	}

	var user *entities.User
	var err error

	if username != "" {
		user, err = u.userrepo.GetUserByUsername(username)
	} else {
		user, err = u.userrepo.GetUserByEmail(email)
	}

	if err != nil {
		return "", nil, ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return "", nil, ErrInvalidCredentials
	}

	if !user.IsApprove {
		return "", nil, ErrAccountNotApproved
	}

	expiryDuration := time.Minute * 30
	if remember {
		expiryDuration = time.Hour * 24 * 2
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"exp":     time.Now().Add(expiryDuration).Unix(),
		"iat":     time.Now().Unix(),   // เวลาที่ออก
		"jti":     uuid.New().String(), // ให้ token นี้ unique
	})

	tokenString, err := token.SignedString([]byte(u.jwtSecret))
	if err != nil {
		return "", nil, errors.New("failed to generate token: " + err.Error())
	}

	return tokenString, user, nil
}

func (u *UserUseCaseImpl) UpdateUserApprovalByID(targetUserID string, isApprove bool, adminUserID string) (*entities.User, error) {
	if err := u.ensureAdmin(adminUserID); err != nil {
		return nil, err
	}

	targetUserID = strings.TrimSpace(targetUserID)
	if targetUserID == "" {
		return nil, errors.New("user id is required")
	}

	user, err := u.userrepo.GetUserByID(targetUserID)
	if err != nil {
		return nil, fmt.Errorf("%w: %v", ErrTargetUserNotFound, err)
	}

	oldUserData, _ := json.Marshal(map[string]interface{}{
		"user_id":    user.ID,
		"username":   user.Username,
		"role_id":    user.RoleID,
		"role_name":  user.Role.Name,
		"is_approve": user.IsApprove,
	})

	if err := u.userrepo.UpdateUserApprovalByID(user.ID, isApprove); err != nil {
		return nil, errors.New("failed to update user approval: " + err.Error())
	}

	updatedUser, err := u.userrepo.GetUserByID(user.ID)
	if err != nil {
		return nil, errors.New("failed to get updated user: " + err.Error())
	}

	newUserData, _ := json.Marshal(map[string]interface{}{
		"user_id":    updatedUser.ID,
		"username":   updatedUser.Username,
		"role_id":    updatedUser.RoleID,
		"role_name":  updatedUser.Role.Name,
		"is_approve": updatedUser.IsApprove,
	})

	auditLog := &entities.AuditLogs{
		ID:        uuid.New().String(),
		TableName: "users",
		RecordID:  updatedUser.ID,
		UserID:    adminUserID,
		Action:    audit_constants.AuditActionUpdate,
		OldValue:  string(oldUserData),
		NewValue:  string(newUserData),
	}

	if _, err := u.auditlogrepo.CreateAuditLog(auditLog); err != nil {
		log.Printf("[ERROR] Failed to create audit log for approval update %s: %v", updatedUser.ID, err)
	}

	return updatedUser, nil
}

func (u *UserUseCaseImpl) ResetPassword(userID, oldPassword, newPassword string) error {
	user, err := u.userrepo.GetUserByID(userID)
	if err != nil {
		return errors.New("user invalid: " + err.Error())
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(oldPassword)); err != nil {
		return errors.New("old password invalid")
	}

	// ตรวจสอบว่ารหัสผ่านใหม่ไม่ซ้ำกับรหัสผ่านเดิม
	if oldPassword == newPassword {
		return errors.New("new password cannot be the same as current password")
	}

	hashedNewPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("failed to hash new password: " + err.Error())
	}
	user.Password = string(hashedNewPassword)

	if err := u.userrepo.UpdateUserByID(user); err != nil {
		return errors.New("failed to update password: " + err.Error())
	}

	auditLog := &entities.AuditLogs{
		ID:        uuid.New().String(),
		TableName: "users",
		RecordID:  user.ID,
		UserID:    userID,
		Action:    audit_constants.AuditActionUpdate,
		OldValue:  audit_constants.AuditOldNewValuePassword,
		NewValue:  audit_constants.AuditOldNewValuePassword,
	}

	_, err = u.auditlogrepo.CreateAuditLog(auditLog)
	if err != nil {
		log.Printf("[ERROR] Failed to create audit log for password reset %s: %v", userID, err)
	}

	return nil
}

func (u *UserUseCaseImpl) GetUserByID(id string) (*entities.User, error) {
	user, err := u.userrepo.GetUserByID(id)
	if err != nil {
		return nil, errors.New("user not found: " + err.Error())
	}
	return user, nil
}

func (u *UserUseCaseImpl) GetAllUsers(userID string) ([]*entities.User, error) {
	if err := u.ensureAdmin(userID); err != nil {
		return nil, err
	}

	users, err := u.userrepo.GetAllUsers()
	if err != nil {
		return nil, errors.New("failed to retrieve all users: " + err.Error())
	}
	return users, nil
}

func (u *UserUseCaseImpl) GetUsersByFirstAndLastName(firstName string, lastName string) ([]*entities.User, error) {
	users, err := u.userrepo.GetUsersByFirstAndLastName(firstName, lastName)
	if err != nil {
		return nil, errors.New("failed to get users by first and last name: " + err.Error())
	}
	return users, nil
}

func (u *UserUseCaseImpl) DeleteUserByID(targetUserID string, adminUserID string) error {
	if err := u.ensureAdmin(adminUserID); err != nil {
		return err
	}

	targetUserID = strings.TrimSpace(targetUserID)
	if targetUserID == "" {
		return errors.New("user id is required")
	}

	user, err := u.userrepo.GetUserByID(targetUserID)
	if err != nil {
		return errors.New("user not found: " + err.Error())
	}

	oldUserData, _ := json.Marshal(user)
	if err := u.userrepo.DeleteUserByID(targetUserID); err != nil {
		return errors.New("failed to delete user: " + err.Error())
	}

	auditLog := &entities.AuditLogs{
		ID:        uuid.New().String(),
		TableName: "users",
		RecordID:  user.ID,
		UserID:    adminUserID,
		Action:    audit_constants.AuditActionDelete,
		OldValue:  string(oldUserData),
		NewValue:  "",
	}

	if _, err := u.auditlogrepo.CreateAuditLog(auditLog); err != nil {
		log.Printf("[ERROR] Failed to create audit log for user deletion %s: %v", targetUserID, err)
	}

	return nil
}

func (u *UserUseCaseImpl) ensureAdmin(userID string) error {
	userID = strings.TrimSpace(userID)
	if userID == "" {
		return errors.New("user id is required")
	}

	user, err := u.userrepo.GetUserByID(userID)
	if err != nil {
		return errors.New("failed to get user: " + err.Error())
	}

	if user.Role.Name != user_constants.RoleAdmin && user.Role.Name != user_constants.RoleSuperUser {
		return ErrAdminOnly
	}

	return nil
}

func (u *UserUseCaseImpl) UpdateUserByID(id string, user *entities.User, file multipart.File) (*entities.User, error) {
	existingUser, err := u.userrepo.GetUserByID(id)
	if err != nil {
		return nil, errors.New("user not found: " + err.Error())
	}

	oldUserData, _ := json.Marshal(map[string]interface{}{
		"username":      existingUser.Username,
		"first_name":    existingUser.FirstName,
		"last_name":     existingUser.LastName,
		"nickname":      existingUser.Nickname,
		"gender":        existingUser.Gender,
		"phone":         existingUser.Phone,
		"profile_image": existingUser.ProfileImage,
	})

	// อัพเดต เท่าที่ อนุญาตให้อัพเดต
	// อัพเดต username เฉพาะเมื่อมีการส่งมา (ไม่ใช่ค่าว่าง)
	if user.Username != "" {
		if existingUser.Username != user.Username {

			usernameExists, err := u.userrepo.UsernameExists(user.Username)
			if err != nil {
				return nil, errors.New("failed to check username availability: " + err.Error())
			}
			if usernameExists {
				return nil, errors.New("username already taken")
			}
			existingUser.Username = user.Username
		}
	}

	if user.FirstName != "" {
		existingUser.FirstName = user.FirstName
	}

	if user.LastName != "" {
		existingUser.LastName = user.LastName
	}

	if user.Nickname != "" {
		existingUser.Nickname = user.Nickname
	}

	if user.Phone != "" {
		existingUser.Phone = user.Phone
	}

	if user.Gender != "" {
		existingUser.Gender = user.Gender
	}

	if file != nil {
		fileExtension, err := utils.DetectFileType(file)
		if err != nil {
			return nil, errors.New("invalid file: " + err.Error())
		}

		// Reset file pointer to beginning after DetectFileType
		if _, err = file.Seek(0, io.SeekStart); err != nil {
			return nil, errors.New("failed to reset file pointer: " + err.Error())
		}

		fileName := uuid.New().String() + fileExtension

		profileURL, err := utils.UploadFile2Supa(file, fileName, "profiles/", u.supa)
		if err != nil {
			return nil, errors.New("failed to upload profile image: " + err.Error())
		}

		existingUser.ProfileImage = profileURL
	}

	if err := u.userrepo.UpdateUserByID(existingUser); err != nil {
		return nil, errors.New("failed to update user: " + err.Error())
	}

	newUserData, _ := json.Marshal(map[string]interface{}{
		"username":      existingUser.Username,
		"first_name":    existingUser.FirstName,
		"last_name":     existingUser.LastName,
		"nickname":      existingUser.Nickname,
		"gender":        existingUser.Gender,
		"phone":         existingUser.Phone,
		"profile_image": existingUser.ProfileImage,
	})

	auditLog := &entities.AuditLogs{
		ID:        uuid.New().String(),
		TableName: "users",
		RecordID:  existingUser.ID,
		UserID:    id,
		Action:    audit_constants.AuditActionUpdate,
		OldValue:  string(oldUserData),
		NewValue:  string(newUserData),
	}

	// สร้าง audit log (ไม่ return error เพื่อไม่ให้กระทบกับการอัปเดต user)
	_, err = u.auditlogrepo.CreateAuditLog(auditLog)
	if err != nil {
		log.Printf("[ERROR] Failed to create audit log for user %s: %v", id, err)
	}

	return existingUser, nil
}




