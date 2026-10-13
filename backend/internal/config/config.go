package config

import (
	"os"
	"strings"
	"time"
)

type Config struct {
	Port             string
	AdminKey         string
	DatabaseURL      string
	RedisURL         string
	AllowedOrigins   []string
	ReadinessTimeout time.Duration
}

func Load() Config {
	return Config{
		Port:             env("PORT", "8080"),
		AdminKey:         os.Getenv("ADMIN_API_KEY"),
		DatabaseURL:      env("DATABASE_URL", "postgres://automan:automan_dev_password@localhost:5432/automan?sslmode=disable"),
		RedisURL:         env("REDIS_URL", "redis://localhost:6379/0"),
		AllowedOrigins:   strings.Split(env("ALLOWED_ORIGINS", "http://localhost:3000"), ","),
		ReadinessTimeout: 2 * time.Second,
	}
}
func env(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
