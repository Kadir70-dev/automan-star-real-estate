package httpapi

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestLive(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health/live", nil)
	r := httptest.NewRecorder()
	(API{}).Handler().ServeHTTP(r, req)
	if r.Code != 200 || !strings.Contains(r.Body.String(), `"status":"ok"`) {
		t.Fatalf("unexpected %d %s", r.Code, r.Body.String())
	}
}
func TestReadyWithoutDependencies(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health/ready", nil)
	r := httptest.NewRecorder()
	(API{}).Handler().ServeHTTP(r, req)
	if r.Code != 503 || !strings.Contains(r.Body.String(), "not_ready") {
		t.Fatalf("unexpected %d %s", r.Code, r.Body.String())
	}
}
func TestCORSRestriction(t *testing.T) {
	a := API{AllowedOrigins: []string{"http://localhost:3000"}}
	for _, tc := range []struct {
		origin string
		status int
	}{{"https://evil.example", 403}, {"http://localhost:3000", 204}} {
		req := httptest.NewRequest(http.MethodOptions, "/api/v1/status", nil)
		req.Header.Set("Origin", tc.origin)
		r := httptest.NewRecorder()
		a.Handler().ServeHTTP(r, req)
		if r.Code != tc.status {
			t.Fatalf("origin %s: got %d", tc.origin, r.Code)
		}
	}
}
