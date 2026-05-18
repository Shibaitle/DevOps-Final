//go:build ignore

package main

import (
	"fmt"
	"io"
	"os"

	"ariga.io/atlas-provider-gorm/gormschema"
	"github.com/Shibaitle/DevOps-Final/modules/entities"
)

func main() {
	stmts, err := gormschema.New("postgres").Load(
		&entities.Role{},
		&entities.User{},
		&entities.AuditLogs{},
		&entities.WarehouseItem{},
		&entities.WarehouseTransaction{},
	)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load gorm schema: %v\n", err)
		os.Exit(1)
	}
	io.WriteString(os.Stdout, stmts)
}


