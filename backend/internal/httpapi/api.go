package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type API struct {
	DB             *pgxpool.Pool
	Redis          *redis.Client
	AdminKey       string
	AllowedOrigins []string
	// ProxySecret lets the Netlify server relay pass the visitor IP for rate limiting.
	ProxySecret string
}
type dependency struct {
	Status string `json:"status"`
}

func respond(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}
func (a API) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health/live", func(w http.ResponseWriter, r *http.Request) {
		respond(w, 200, map[string]string{"status": "ok", "service": "automan-api"})
	})
	mux.HandleFunc("GET /health/ready", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		pg := dependency{Status: "down"}
		rd := dependency{Status: "down"}
		if a.DB != nil && a.DB.Ping(ctx) == nil {
			pg.Status = "up"
		}
		if a.Redis != nil && a.Redis.Ping(ctx).Err() == nil {
			rd.Status = "up"
		}
		status := "ready"
		code := 200
		if pg.Status != "up" || rd.Status != "up" {
			status = "not_ready"
			code = 503
		}
		respond(w, code, map[string]any{"status": status, "dependencies": map[string]dependency{"postgres": pg, "redis": rd}})
	})
	mux.HandleFunc("GET /api/v1/properties", a.publicPropertyList)
	mux.HandleFunc("GET /api/v1/properties/{slug}", a.publicPropertyDetail)
	// CMS public reads are limited to published, validated page documents.
	mux.HandleFunc("GET /api/v1/cms/public/{slug}", a.cmsPublicPage)
	mux.HandleFunc("GET /api/v1/cms/public/media/{id}", a.cmsServeMedia)
	mux.HandleFunc("GET /api/v1/cms/admin/media", a.requireRole("admin")(a.cmsListMedia))
	mux.HandleFunc("POST /api/v1/cms/admin/media", a.requireRole("admin")(a.cmsUploadMedia))
	mux.HandleFunc("PATCH /api/v1/cms/admin/media/{id}", a.requireRole("admin")(a.cmsUpdateMedia))
	// A browser must be authenticated as an administrator for every CMS mutation.
	mux.HandleFunc("GET /api/v1/cms/admin/pages/{slug}", a.requireRole("admin")(a.cmsAdminPage))
	mux.HandleFunc("PUT /api/v1/cms/admin/pages/{slug}/draft", a.requireRole("admin")(a.cmsSaveDraft))
	mux.HandleFunc("POST /api/v1/cms/admin/pages/{slug}/publish", a.requireRole("admin")(a.cmsPublish))
	mux.HandleFunc("GET /api/v1/cms/admin/pages/{slug}/versions", a.requireRole("admin")(a.cmsVersions))
	mux.HandleFunc("POST /api/v1/cms/admin/pages/{slug}/rollback", a.requireRole("admin")(a.cmsRollback))

	mux.HandleFunc("POST /api/v1/staff/login", a.login)
	mux.HandleFunc("POST /api/v1/staff/logout", a.logout)
	mux.HandleFunc("GET /api/v1/staff/me", a.me)
	mux.HandleFunc("GET /api/v1/admin/properties", a.requireRole("admin", "manager", "agent")(a.propertyAdminList))
	mux.HandleFunc("POST /api/v1/admin/properties", a.requireRole("admin", "manager")(a.createProperty))
	mux.HandleFunc("PUT /api/v1/admin/properties/{id}", a.requireRole("admin", "manager")(a.updateProperty))
	mux.HandleFunc("PATCH /api/v1/admin/properties/{id}/status", a.requireRole("admin", "manager")(a.publishProperty))
	mux.HandleFunc("GET /api/v1/admin/properties/{id}", a.requireRole("admin", "manager", "agent")(a.propertyAdminGet))
	mux.HandleFunc("DELETE /api/v1/admin/properties/{id}", a.requireRole("admin", "manager")(a.archiveProperty))
	mux.HandleFunc("POST /api/v1/admin/properties/{id}/restore", a.requireRole("admin", "manager")(a.restoreProperty))
	mux.HandleFunc("PUT /api/v1/admin/properties/{id}/media/order", a.requireRole("admin", "manager")(a.reorderMedia))
	mux.HandleFunc("PATCH /api/v1/admin/properties/{id}/media/{mediaID}", a.requireRole("admin", "manager")(a.updateMediaAlt))
	mux.HandleFunc("GET /api/v1/admin/properties/{id}/media", a.requireRole("admin", "manager", "agent")(a.listMedia))
	mux.HandleFunc("POST /api/v1/admin/properties/{id}/media", a.requireRole("admin", "manager")(a.uploadMedia))
	mux.HandleFunc("PATCH /api/v1/admin/properties/{id}/media/{mediaID}/cover", a.requireRole("admin", "manager")(a.coverMedia))
	mux.HandleFunc("PATCH /api/v1/admin/properties/{id}/media/{mediaID}/order", a.requireRole("admin", "manager")(a.orderMedia))
	mux.HandleFunc("DELETE /api/v1/admin/properties/{id}/media/{mediaID}", a.requireRole("admin", "manager")(a.deleteMedia))
	mux.HandleFunc("GET /api/v1/media/{id}", a.serveMedia)
	mux.HandleFunc("GET /api/v1/admin/properties/{id}/documents", a.requireRole("admin", "manager", "agent")(a.listDocuments))
	mux.HandleFunc("POST /api/v1/admin/properties/{id}/documents", a.requireRole("admin", "manager")(a.uploadDocument))
	mux.HandleFunc("GET /api/v1/admin/documents/{id}/download", a.requireRole("admin", "manager", "agent")(a.downloadDocument))
	mux.HandleFunc("POST /api/v1/leads", a.createLead)
	mux.HandleFunc("POST /api/v1/visits", a.createVisit)
	mux.HandleFunc("GET /api/v1/admin/leads", a.requireRole("admin", "manager", "agent")(a.listLeads))
	mux.HandleFunc("GET /api/v1/admin/visits", a.requireRole("admin", "manager", "agent")(a.listVisits))
	mux.HandleFunc("PATCH /api/v1/admin/leads/{id}/status", a.requireRole("admin", "manager", "agent")(a.updateLead))
	mux.HandleFunc("PATCH /api/v1/admin/visits/{id}/status", a.requireRole("admin", "manager", "agent")(a.updateVisit))
	mux.HandleFunc("GET /api/v1/status", func(w http.ResponseWriter, r *http.Request) {
		respond(w, 200, map[string]any{"service": "automan-api", "api_version": "v1", "phase": "2f", "note": "Lead submission, viewing requests and protected CRM APIs enabled."})
	})
	return a.securityHeaders(a.csrfGuard(a.cors(mux)))
}
func (a API) cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		for _, allowed := range a.AllowedOrigins {
			if origin != "" && origin == strings.TrimSpace(allowed) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
				break
			}
		}
		if r.Method == http.MethodOptions {
			if w.Header().Get("Access-Control-Allow-Origin") == "" {
				http.Error(w, "origin not allowed", http.StatusForbidden)
				return
			}
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// CSRF protection applies to browser-authenticated mutations. The browser-facing
// Next.js proxy forwards same-origin requests to this API; cross-site browser
// requests are rejected even when the request includes valid session cookies.
func (a API) csrfGuard(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet && r.Method != http.MethodHead && r.Method != http.MethodOptions {
			if strings.EqualFold(r.Header.Get("Sec-Fetch-Site"), "cross-site") {
				respond(w, 403, map[string]string{"error": "cross-site request blocked"})
				return
			}
			origin := r.Header.Get("Origin")
			if origin != "" {
				valid := false
				for _, allowed := range a.AllowedOrigins {
					if origin == strings.TrimSpace(allowed) {
						valid = true
						break
					}
				}
				if !valid {
					respond(w, 403, map[string]string{"error": "origin not allowed"})
					return
				}
			}
		}
		next.ServeHTTP(w, r)
	})
}
func (a API) securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("X-Frame-Options", "DENY")
		next.ServeHTTP(w, r)
	})
}
