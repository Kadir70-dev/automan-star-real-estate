package httpapi

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCSRFBlocksForeignOrigin(t *testing.T) {
	a := API{AllowedOrigins: []string{"http://localhost:3000"}}
	for _, tc := range []struct {
		origin string
		code   int
	}{{"https://evil.example", 403}, {"http://localhost:3000", 503}} {
		req := httptest.NewRequest(http.MethodPost, "/api/v1/leads", strings.NewReader("{}"))
		req.Header.Set("Origin", tc.origin)
		w := httptest.NewRecorder()
		a.Handler().ServeHTTP(w, req)
		// Accepted origin reaches business validation; it must not be rejected by CSRF.
		if tc.code == 403 && w.Code != 403 {
			t.Fatalf("foreign origin got %d", w.Code)
		}
		if tc.code != 403 && w.Code == 403 {
			t.Fatalf("trusted origin rejected")
		}
	}
}
func TestFetchMetadataBlocksCrossSite(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/staff/logout", nil)
	req.Header.Set("Sec-Fetch-Site", "cross-site")
	w := httptest.NewRecorder()
	(API{}).Handler().ServeHTTP(w, req)
	if w.Code != 403 {
		t.Fatalf("got %d, wanted 403", w.Code)
	}
}
func TestSecurityHeaders(t *testing.T) {
	w := httptest.NewRecorder()
	(API{}).Handler().ServeHTTP(w, httptest.NewRequest(http.MethodGet, "/health/live", nil))
	if w.Header().Get("X-Content-Type-Options") != "nosniff" {
		t.Fatal("missing nosniff")
	}
}
