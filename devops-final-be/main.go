package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/Shibaitle/DevOps-Final/configs"
	"github.com/Shibaitle/DevOps-Final/docs"
	"github.com/Shibaitle/DevOps-Final/modules/servers"
	"github.com/Shibaitle/DevOps-Final/pkg/database"
)

// @title DevOps Demo API
// @description Backend API for the DevOps demo project.
// @BasePath /
// @schemes https http
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and JWT token.
func main() {

	cfg := configs.LoadConfigs()

	if host := os.Getenv("SWAGGER_HOST"); host != "" {
		docs.SwaggerInfo.Host = host
	}
	if schemes := os.Getenv("SWAGGER_SCHEMES"); schemes != "" {
		docs.SwaggerInfo.Schemes = strings.Split(schemes, ",")
	}

	database.InitDB(cfg.PostgreSQL, cfg.SeedAdmin)
	app := servers.SetupServer(cfg.Server, cfg.JWT, cfg.Supabase, cfg.Mail)

	serverAddress := fmt.Sprintf(":%s", cfg.Server.Port)
	log.Printf("Server is starting on %s", serverAddress)

	if err := app.Listen(serverAddress); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

