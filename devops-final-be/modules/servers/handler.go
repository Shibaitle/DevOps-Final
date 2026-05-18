package servers

import (
	"fmt"
	"log"

	"github.com/Shibaitle/DevOps-Final/configs"
	auditLogController "github.com/Shibaitle/DevOps-Final/modules/audit_logs/controllers"
	auditLogRepository "github.com/Shibaitle/DevOps-Final/modules/audit_logs/repositories"
	auditLogUsecase "github.com/Shibaitle/DevOps-Final/modules/audit_logs/usecases"
	userController "github.com/Shibaitle/DevOps-Final/modules/user/controllers"
	userRepository "github.com/Shibaitle/DevOps-Final/modules/user/repositories"
	userUsecase "github.com/Shibaitle/DevOps-Final/modules/user/usecases"
	warehouseController "github.com/Shibaitle/DevOps-Final/modules/warehouse/controllers"
	warehouseRepository "github.com/Shibaitle/DevOps-Final/modules/warehouse/repositories"
	warehouseUsecase "github.com/Shibaitle/DevOps-Final/modules/warehouse/usecases"

	"github.com/Shibaitle/DevOps-Final/pkg/database"
	"github.com/Shibaitle/DevOps-Final/pkg/middlewares"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/gofiber/swagger"

	"gorm.io/gorm"
)

func SetupServer(server configs.Server, jwt configs.JWT, supa configs.Supabase, mail configs.Mail) *fiber.App {
	app := fiber.New(fiber.Config{
		AppName:               server.AppName,
		BodyLimit:             1024 * 1024 * 1024, // 1GB limit
		DisableStartupMessage: true,
		ReduceMemoryUsage:     true,    // ลดการจองหน่วยความจำ
		Concurrency:           1000000, // ปรับจำนวน concurrent requests สูงสุด

	})

	setupMiddlewares(app, server.CORS)
	setupRoutes(app, server, jwt, supa, mail)

	return app
}

func setupMiddlewares(app *fiber.App, cor configs.CORS) {
	// Recovery middleware - จับ panic และแปลงเป็น 500 error
	app.Use(recover.New())

	// Logger middleware - บันทึก request/response
	app.Use(logger.New())

	app.Use(cors.New(cors.Config{
		AllowOrigins:     cor.AllowOrigins,
		AllowMethods:     cor.AllowMethods,
		AllowHeaders:     cor.AllowHeaders,
		AllowCredentials: cor.AllowCredentials,
	}))
}

func setupRoutes(app *fiber.App, server configs.Server, jwt configs.JWT, supa configs.Supabase, mail configs.Mail) {
	// Initialize database connection
	db := database.GetDB()
	if db == nil {
		log.Fatal("Failed to initialize database")
	}

	// Swagger route
	app.Get("/swagger/*", swagger.HandlerDefault)

	SetupUserRoutes(app, db, jwt, supa, mail)
	SetupWarehouseRoutes(app, db, jwt)
	SetupAuditLogRoutes(app, db, jwt)

	// API group
	api := app.Group("/api")

	api.Get("/hello", func(c *fiber.Ctx) error {
		message := fmt.Sprintf("Test: %s", server.AppName)

		return c.JSON(fiber.Map{
			"message": message,
		})
	})
}

func SetupUserRoutes(app *fiber.App, db *gorm.DB, jwt configs.JWT, supa configs.Supabase, mail configs.Mail) {

	auditLogRepository := auditLogRepository.NewGormAuditLogRepository(db)
	userRepository := userRepository.NewGormUserRepository(db)
	userUsecase := userUsecase.NewUserUseCase(userRepository, auditLogRepository, jwt, supa, mail)
	userController := userController.NewUserController(userUsecase)

	authGroup := app.Group("/api/auth")
	authGroup.Post("/register", userController.RegisterHandler)
	authGroup.Post("/login", userController.LoginHandler)

	authGroup.Patch("/resetpassword", middlewares.JWTMiddleware(jwt), userController.ResetPasswordHandler)
	authGroup.Post("/logout", middlewares.JWTMiddleware(jwt), userController.LogoutHandler)

	userGroup := app.Group("/api/user")
	userGroup.Get("/", middlewares.JWTMiddleware(jwt), userController.GetUserByIDHandler)
	userGroup.Get("/search", middlewares.JWTMiddleware(jwt), userController.GetUsersByFirstAndLastNameHandler)
	userGroup.Patch("/", middlewares.JWTMiddleware(jwt), userController.UpdateUserByIDHandler)


	adminGroup := app.Group("/api/admin")
	adminGroup.Get("/users", middlewares.JWTMiddleware(jwt), userController.GetAllUsersHandler)
	adminGroup.Patch("/users/:user_id/approval", middlewares.JWTMiddleware(jwt), userController.UpdateUserApprovalHandler)

	adminGroup.Delete("/users/:user_id", middlewares.JWTMiddleware(jwt), userController.DeleteUserByIDHandler)
}

func SetupWarehouseRoutes(app *fiber.App, db *gorm.DB, jwt configs.JWT) {
	auditLogRepository := auditLogRepository.NewGormAuditLogRepository(db)
	userRepository := userRepository.NewGormUserRepository(db)
	warehouseRepository := warehouseRepository.NewGormWarehouseRepository(db)
	warehouseUsecase := warehouseUsecase.NewWarehouseUseCase(warehouseRepository, auditLogRepository, userRepository)
	warehouseController := warehouseController.NewWarehouseController(warehouseUsecase)

	warehouseItemGroup := app.Group("/api/warehouse/items")
	warehouseItemGroup.Get("/", middlewares.JWTMiddleware(jwt), warehouseController.GetWarehouseItemsHandler)
	warehouseItemGroup.Post("/", middlewares.JWTMiddleware(jwt), warehouseController.CreateWarehouseItemHandler)
	warehouseItemGroup.Patch("/:id", middlewares.JWTMiddleware(jwt), warehouseController.UpdateWarehouseItemByIDHandler)
	warehouseItemGroup.Delete("/:id", middlewares.JWTMiddleware(jwt), warehouseController.DeleteWarehouseItemByIDHandler)
	warehouseItemGroup.Post("/:id/adjust", middlewares.JWTMiddleware(jwt), warehouseController.AdjustWarehouseItemByIDHandler)

	warehouseTransactionGroup := app.Group("/api/warehouse/transactions")
	warehouseTransactionGroup.Get("/", middlewares.JWTMiddleware(jwt), warehouseController.GetWarehouseTransactionsHandler)
	warehouseTransactionGroup.Get("/:id", middlewares.JWTMiddleware(jwt), warehouseController.GetWarehouseTransactionByIDHandler)
	warehouseTransactionGroup.Patch("/approve", middlewares.JWTMiddleware(jwt), warehouseController.ApproveTransactionsHandler)
	warehouseTransactionGroup.Patch("/reject", middlewares.JWTMiddleware(jwt), warehouseController.RejectTransactionsHandler)

	warehouseDashboardGroup := app.Group("/api/warehouse/dashboard")
	warehouseDashboardGroup.Get("/summary", middlewares.JWTMiddleware(jwt), warehouseController.GetWarehouseDashboardSummaryHandler)
}

func SetupAuditLogRoutes(app *fiber.App, db *gorm.DB, jwt configs.JWT) {
	userRepository := userRepository.NewGormUserRepository(db)
	auditLogRepository := auditLogRepository.NewGormAuditLogRepository(db)
	auditLogUsecaseInstance := auditLogUsecase.NewAuditLogUseCase(auditLogRepository, userRepository)
	auditLogControllerInstance := auditLogController.NewAuditLogController(auditLogUsecaseInstance)

	auditLogGroup := app.Group("/api/admin/audit-logs")
	auditLogGroup.Get("/", middlewares.JWTMiddleware(jwt), auditLogControllerInstance.GetAuditLogsHandler)
	auditLogGroup.Get("/search", middlewares.JWTMiddleware(jwt), auditLogControllerInstance.SearchAuditLogsHandler)
	auditLogGroup.Get("/:id", middlewares.JWTMiddleware(jwt), auditLogControllerInstance.GetAuditLogByIDHandler)
}
