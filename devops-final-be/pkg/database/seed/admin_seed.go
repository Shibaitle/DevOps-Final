package seed

import (
	"log"

	"github.com/Shibaitle/DevOps-Final/configs"
	"github.com/Shibaitle/DevOps-Final/modules/entities"
	user_constants "github.com/Shibaitle/DevOps-Final/modules/user/constants"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SeedAdminUser creates a default admin user if one doesn't exist
func SeedAdminUser(db *gorm.DB, seedAdmin configs.SeedAdmin) {
	log.Println("Seeding Admin User...")

	if seedAdmin.Username == "" || seedAdmin.Email == "" || seedAdmin.Password == "" {
		log.Println("⚠️ Admin credentials not found in env, skipping admin seed.")
		return
	}

	var existingAdmin entities.User
	if err := db.Where("username = ? OR email = ?", seedAdmin.Username, seedAdmin.Email).First(&existingAdmin).Error; err == nil {
		log.Println("⏭️  Admin user already exists. Syncing/updating details...")
		existingAdmin.FirstName = seedAdmin.FirstName
		existingAdmin.LastName = seedAdmin.LastName
		existingAdmin.Nickname = seedAdmin.Nickname
		existingAdmin.ProfileImage = seedAdmin.ProfileImage
		if err := db.Save(&existingAdmin).Error; err != nil {
			log.Printf("❌ Failed to update existing Admin user details: %v", err)
		} else {
			log.Println("✅ Updated/Synced Admin user details successfully!")
		}
		return
	}

	var adminRole entities.Role
	if err := db.Where("name = ?", user_constants.RoleAdmin).First(&adminRole).Error; err != nil {
		log.Printf("❌ Failed to find Admin role: %v. Cannot seed admin.", err)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(seedAdmin.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ Failed to hash admin password: %v", err)
		return
	}

	adminUser := entities.User{
		ID:           uuid.New().String(),
		Username:     seedAdmin.Username,
		Email:        seedAdmin.Email,
		Password:     string(hashedPassword),
		RoleID:       adminRole.ID,
		IsApprove:    true,
		FirstName:    seedAdmin.FirstName,
		LastName:     seedAdmin.LastName,
		Nickname:     seedAdmin.Nickname,
		ProfileImage: seedAdmin.ProfileImage,
	}

	if err := db.Create(&adminUser).Error; err != nil {
		log.Printf("❌ Failed to seed Admin user: %v", err)
	} else {
		log.Printf("✅ Seeded Admin user: %s (Email: %s)", adminUser.Username, adminUser.Email)
	}
}
