package repositories

import (
	"github.com/Shibaitle/DevOps-Final/modules/entities"

	"gorm.io/gorm"
)



type GormUserRepository struct {
	db *gorm.DB
}

func NewGormUserRepository(db *gorm.DB) *GormUserRepository {
	return &GormUserRepository{
		db: db,
	}
}

type UserRepository interface {
	CreateUser(user *entities.User) (*entities.User, error)


	GetUserByEmail(email string) (*entities.User, error)
	GetUserByID(id string) (*entities.User, error)
	GetUsersByFirstAndLastName(firstName string, lastName string) ([]*entities.User, error)

	GetUserByUsername(username string) (*entities.User, error)
	GetRoleByName(roleName string) (*entities.Role, error)
	GetRoleByID(roleID string) (*entities.Role, error)
	UsernameExists(username string) (bool, error)
	EmailExists(email string) (bool, error)
	GetAllUsers() ([]*entities.User, error)

	UpdateUserByID(user *entities.User) error
	UpdateUserApprovalByID(userID string, isApprove bool) error
	DeleteUserByID(userID string) error
}

func (r *GormUserRepository) CreateUser(user *entities.User) (*entities.User, error) {
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return r.GetUserByID(user.ID)
}



func (r *GormUserRepository) GetUserByEmail(email string) (*entities.User, error) {
	var user entities.User
	err := r.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *GormUserRepository) GetUserByID(id string) (*entities.User, error) {
	var user entities.User
	if err := r.db.Preload("Role").First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *GormUserRepository) GetUsersByFirstAndLastName(firstName string, lastName string) ([]*entities.User, error) {
	var users []*entities.User
	if err := r.db.
		Preload("Role").
		Where("LOWER(TRIM(first_name)) = LOWER(TRIM(?))", firstName).
		Where("LOWER(TRIM(last_name)) = LOWER(TRIM(?))", lastName).
		Find(&users).Error; err != nil {
		return nil, err
	}

	return users, nil
}



func (r *GormUserRepository) GetUserByUsername(username string) (*entities.User, error) {
	var user entities.User
	if err := r.db.First(&user, "username = ?", username).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *GormUserRepository) GetRoleByName(roleName string) (*entities.Role, error) {
	var role entities.Role
	if err := r.db.First(&role, "name = ?", roleName).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *GormUserRepository) GetRoleByID(roleID string) (*entities.Role, error) {
	var role entities.Role
	if err := r.db.First(&role, "id = ?", roleID).Error; err != nil {
		return nil, err
	}
	return &role, nil
}

func (r *GormUserRepository) UsernameExists(username string) (bool, error) {
	var count int64
	err := r.db.Model(&entities.User{}).Where("username = ?", username).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *GormUserRepository) EmailExists(email string) (bool, error) {
	var count int64
	err := r.db.Model(&entities.User{}).Where("email = ?", email).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *GormUserRepository) GetAllUsers() ([]*entities.User, error) {
	var users []*entities.User
	if err := r.db.Preload("Role").Find(&users).Error; err != nil {
		return nil, err
	}
	return users, nil
}



func (r *GormUserRepository) UpdateUserByID(user *entities.User) error {
	return r.db.Save(user).Error
}

func (r *GormUserRepository) UpdateUserApprovalByID(userID string, isApprove bool) error {
	return r.db.Model(&entities.User{}).Where("id = ?", userID).Update("is_approve", isApprove).Error
}



func (r *GormUserRepository) DeleteUserByID(userID string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec("DELETE FROM support_tickets WHERE created_by_user_id = ?", userID).Error; err != nil {
			return err
		}

		if err := tx.Exec("DELETE FROM audit_logs WHERE user_id = ?", userID).Error; err != nil {
			return err
		}
		if err := tx.Delete(&entities.User{}, "id = ?", userID).Error; err != nil {
			return err
		}

		return nil
	})
}




