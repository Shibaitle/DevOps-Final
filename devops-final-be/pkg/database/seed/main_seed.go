package seed

import (
	"log"

	"github.com/Shibaitle/DevOps-Final/configs"
	"gorm.io/gorm"
)

// RunAll runs all database seeds
func RunAll(db *gorm.DB, seedAdmin configs.SeedAdmin) {
	log.Println("Starting database seeding...")
	SeedRoles(db)
	SeedAdminUser(db, seedAdmin)
	log.Println("Database seeding completed.")
}
