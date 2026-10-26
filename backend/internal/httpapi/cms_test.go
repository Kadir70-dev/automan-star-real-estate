package httpapi

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCMSDocumentValidation(t *testing.T) {
	valid := cmsDocument{Fields: map[string]string{"hero.title": "Buy well in Dubai", "hero.image": "/api/cms/media/abcdef"}}
	if !validCmsDocument(valid) {
		t.Fatal("valid CMS document rejected")
	}
	for _, input := range []cmsDocument{
		{Fields: map[string]string{"hero.image": "javascript:alert(1)"}},
		{Fields: map[string]string{"bad key": "text"}},
		{Fields: map[string]string{"hero.title": "ok"}, SEO: cmsSEO{Robots: "follow-all"}},
		{Fields: map[string]string{"hero.image": "//evil.example/test"}},
		{Fields: map[string]string{"social.instagram": "javascript:alert(1)"}},
		{Fields: map[string]string{"footer.email": "not an email"}},
		{Fields: map[string]string{"hero.image": "https://"}},
		{SEO: cmsSEO{Canonical: "https://malicious.example/"}} ,
	} {
		if validCmsDocument(input) {
			t.Fatalf("unsafe CMS document accepted: %+v", input)
		}
	}
}

func TestCMSAdminEndpointsRequireLogin(t *testing.T) {
	handler := (API{}).Handler()
	for _, test := range []struct {
		method string
		path   string
	}{
		{"GET", "/api/v1/cms/admin/pages/home"},
		{"PUT", "/api/v1/cms/admin/pages/home/draft"},
		{"POST", "/api/v1/cms/admin/pages/home/publish"},
		{"GET", "/api/v1/cms/admin/pages/home/versions"},
		{"POST", "/api/v1/cms/admin/pages/home/rollback"},
		{"GET", "/api/v1/cms/admin/media"},
		{"POST", "/api/v1/cms/admin/media"},
		{"PATCH", "/api/v1/cms/admin/media/00000000-0000-0000-0000-000000000001"},
	} {
		r := httptest.NewRequest(test.method, test.path, nil)
		w := httptest.NewRecorder()
		handler.ServeHTTP(w, r)
		if w.Code != http.StatusUnauthorized {
			t.Errorf("%s %s returned %d; want 401", test.method, test.path, w.Code)
		}
	}
}
