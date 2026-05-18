package entities

import "time"

type User struct {
	ID           string    `json:"user_id" gorm:"primaryKey" `
	RoleID       string    `json:"role_id" gorm:"not null"`
	Username     string    `json:"username" gorm:"unique;not null"`
	Email        string    `json:"email" gorm:"unique;not null"`
	Password     string    `json:"-"`
	IsApprove    bool      `json:"is_approve" gorm:"not null;default:false"`
	FirstName    string    `json:"first_name" gorm:"default:null"`
	LastName     string    `json:"last_name" gorm:"default:null"`
	Nickname     string    `json:"nickname" gorm:"default:null"`
	Gender       string    `json:"gender" gorm:"default:null"`
	Phone        string    `json:"phone" gorm:"default:null"`
	ProfileImage string    `json:"profile_image" gorm:"default:https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=256"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`

	Role Role `json:"role" gorm:"foreignKey:RoleID;references:ID"`
}
