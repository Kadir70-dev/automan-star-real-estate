package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/automanstar/real-estate/backend/internal/cache"
	"github.com/automanstar/real-estate/backend/internal/config"
	"github.com/automanstar/real-estate/backend/internal/db"
	"github.com/automanstar/real-estate/backend/internal/httpapi"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	cfg := config.Load()
	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()
	pg, err := db.Connect(ctx, cfg.DatabaseURL)
	if err != nil {
		logger.Error("postgres setup", "error", err)
		os.Exit(1)
	}
	defer pg.Close()
	startupCtx, startupCancel := context.WithTimeout(ctx, 30*time.Second)
	defer startupCancel()
	if err = pg.Ping(startupCtx); err != nil {
		logger.Error("postgres unavailable", "error", err)
		os.Exit(1)
	}
	if err = db.Migrate(startupCtx, pg); err != nil {
		logger.Error("migration failed", "error", err)
		os.Exit(1)
	}
	rd, err := cache.Connect(ctx, cfg.RedisURL)
	if err != nil {
		logger.Error("redis setup", "error", err)
		os.Exit(1)
	}
	defer rd.Close()
	if err = rd.Ping(startupCtx).Err(); err != nil {
		logger.Error("redis unavailable", "error", err)
		os.Exit(1)
	}
	server := &http.Server{Addr: ":" + cfg.Port, Handler: (httpapi.API{DB: pg, Redis: rd, AdminKey: cfg.AdminKey, AllowedOrigins: cfg.AllowedOrigins, ProxySecret: cfg.ProxySecret}).Handler(), ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 60 * time.Second, WriteTimeout: 15 * time.Second}
	go func() {
		logger.Info("api listening", "port", cfg.Port)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server failed", "error", err)
			cancel()
		}
	}()
	<-ctx.Done()
	shutdownCtx, stop := context.WithTimeout(context.Background(), 10*time.Second)
	defer stop()
	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Error("shutdown error", "error", err)
	}
}
