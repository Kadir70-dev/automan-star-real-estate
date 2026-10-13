package main

import (
	"context"
	"fmt"
	"github.com/automanstar/real-estate/backend/internal/config"
	"github.com/automanstar/real-estate/backend/internal/db"
	"github.com/automanstar/real-estate/backend/internal/httpapi"
	"log"
	"os"
	"strings"
	"time"
)

func main() {
	email := strings.ToLower(strings.TrimSpace(os.Getenv("BOOTSTRAP_ADMIN_EMAIL")))
	pass := os.Getenv("BOOTSTRAP_ADMIN_PASSWORD")
	if email == "" || len(pass) < 14 {
		log.Fatal("set BOOTSTRAP_ADMIN_EMAIL and a password of at least 14 characters")
	}
	hash, err := httpapi.PasswordHash(pass)
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	pool, err := db.Connect(ctx, config.Load().DatabaseURL)
	if err != nil {
		log.Fatal(err)
	}
	defer pool.Close()
	tag, err := pool.Exec(ctx, `INSERT INTO staff_users(email,name,password_hash,role) VALUES($1,'Administrator',$2,'admin') ON CONFLICT(email) DO NOTHING`, email, hash)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Printf("bootstrap inserted %d admin account(s)\n", tag.RowsAffected())
}
