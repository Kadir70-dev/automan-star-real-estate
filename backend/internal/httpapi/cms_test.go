package httpapi

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestCMSKeys(t *testing.T) {
	for _, s := range []string{"home", "off-plan", "about_us"} {
		if !validCMSKey(s) {
			t.Fatalf("valid key %q rejected", s)
		}
	}
	for _, s := range []string{"", "/api/v1", "BadKey", "..", "a b", "_x"} {
		if validCMSKey(s) {
			t.Fatalf("invalid key %q accepted", s)
		}
	}
}
func TestCMSAdminRequiresSession(t *testing.T) {
	a := API{}
	for _, tc := range []struct{ method, path string }{
		{"GET", "/api/v1/cms/admin/pages"},
		{"GET", "/api/v1/cms/admin/pages/home"},
		{"PUT", "/api/v1/cms/admin/pages/home/draft"},
		{"POST", "/api/v1/cms/admin/pages/home/publish"},
	} {
		r := httptest.NewRequest(tc.method, tc.path, strings.NewReader("{}"))
		w := httptest.NewRecorder()
		a.Handler().ServeHTTP(w, r)
		if w.Code != http.StatusUnauthorized {
			t.Fatalf("%s %s returned %d", tc.method, tc.path, w.Code)
		}
	}
}
