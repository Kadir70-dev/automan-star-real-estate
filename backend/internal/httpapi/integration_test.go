package httpapi

// Integration tests against real PostgreSQL and Redis. They are skipped unless
// AUTOMAN_IT_DATABASE_URL and AUTOMAN_IT_REDIS_URL point at disposable instances.

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/automanstar/real-estate/backend/internal/cache"
	"github.com/automanstar/real-estate/backend/internal/db"
)

func integrationAPI(t *testing.T) API {
	t.Helper()
	dsn, rurl := os.Getenv("AUTOMAN_IT_DATABASE_URL"), os.Getenv("AUTOMAN_IT_REDIS_URL")
	if dsn == "" || rurl == "" {
		t.Skip("set AUTOMAN_IT_DATABASE_URL and AUTOMAN_IT_REDIS_URL to run integration tests")
	}
	ctx := context.Background()
	pg, err := db.Connect(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	if err = db.Migrate(ctx, pg); err != nil {
		t.Fatal(err)
	}
	rd, err := cache.Connect(ctx, rurl)
	if err != nil {
		t.Fatal(err)
	}
	if err = rd.FlushDB(ctx).Err(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { pg.Close(); rd.Close() })
	return API{DB: pg, Redis: rd, AllowedOrigins: []string{"https://automanstarrealty.com"}}
}

// call issues a request from a distinct peer so per-visitor rate limits do not interfere.
func call(t *testing.T, h http.Handler, method, path, body, cookie, peer string) (int, map[string]any, *http.Response) {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.RemoteAddr = peer + ":4000"
	if cookie != "" {
		req.Header.Set("Cookie", "automan_staff="+cookie)
	}
	w := httptest.NewRecorder()
	h.ServeHTTP(w, req)
	out := map[string]any{}
	_ = json.Unmarshal(w.Body.Bytes(), &out)
	return w.Code, out, w.Result()
}

func count(t *testing.T, a API, sql string, args ...any) int {
	t.Helper()
	var n int
	if err := a.DB.QueryRow(context.Background(), sql, args...).Scan(&n); err != nil {
		t.Fatal(err)
	}
	return n
}

func TestIntegrationDuplicateLeadSuppressed(t *testing.T) {
	a := integrationAPI(t)
	h := a.Handler()
	marker := "QA-TEST dedupe " + time.Now().Format(time.RFC3339Nano)
	body := `{"name":"QA-TEST Visitor","email":"qa-test@example.com","message":"` + marker + `","property":"QA-TEST property"}`
	var wg sync.WaitGroup
	ids := make([]string, 4)
	for i := range ids {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			code, out, _ := call(t, h, "POST", "/api/v1/leads", body, "", "198.51.100."+string(rune('1'+i)))
			if code != 201 {
				t.Errorf("submission %d got %d", i, code)
			}
			ids[i], _ = out["id"].(string)
		}(i)
	}
	wg.Wait()
	for _, id := range ids[1:] {
		if id != ids[0] {
			t.Fatalf("concurrent identical submissions returned different IDs: %v", ids)
		}
	}
	if n := count(t, a, `SELECT count(*) FROM leads WHERE message=$1`, marker); n != 1 {
		t.Fatalf("stored %d copies of one enquiry", n)
	}
	other := strings.Replace(body, marker, marker+" second question", 1)
	if code, out, _ := call(t, h, "POST", "/api/v1/leads", other, "", "198.51.100.9"); code != 201 || out["id"] == ids[0] {
		t.Fatalf("distinct enquiry was merged: %d %v", code, out)
	}
}

func TestIntegrationDuplicateVisitSuppressed(t *testing.T) {
	a := integrationAPI(t)
	h := a.Handler()
	date := time.Now().In(time.FixedZone("GST", 4*3600)).AddDate(0, 0, 7).Format("2006-01-02")
	marker := "QA-TEST visit " + time.Now().Format(time.RFC3339Nano)
	body := `{"name":"QA-TEST Visitor","email":"qa-test@example.com","message":"` + marker + `","date":"` + date + `","time":"11:00"}`
	_, first, _ := call(t, h, "POST", "/api/v1/visits", body, "", "198.51.100.20")
	code, second, _ := call(t, h, "POST", "/api/v1/visits", body, "", "198.51.100.21")
	if code != 201 || first["id"] == nil || first["id"] != second["id"] {
		t.Fatalf("repeat viewing request not deduplicated: %d %v %v", code, first, second)
	}
	if n := count(t, a, `SELECT count(*) FROM site_visits v JOIN leads l ON l.id=v.lead_id WHERE l.message=$1`, marker); n != 1 {
		t.Fatalf("stored %d viewing requests", n)
	}
}

func staffLogin(t *testing.T, a API, role string) string {
	t.Helper()
	email := "qa-test-" + role + "-" + time.Now().Format("150405.000000") + "@example.com"
	password := "QA-test-password-" + role + "-long"
	hash, err := PasswordHash(password)
	if err != nil {
		t.Fatal(err)
	}
	if _, err = a.DB.Exec(context.Background(), `INSERT INTO staff_users(email,name,password_hash,role) VALUES($1,$2,$3,$4)`, email, "QA-TEST "+role, hash, role); err != nil {
		t.Fatal(err)
	}
	code, _, res := call(t, a.Handler(), "POST", "/api/v1/staff/login", `{"email":"`+email+`","password":"`+password+`"}`, "", "198.51.100.40")
	if code != 200 {
		t.Fatalf("%s login got %d", role, code)
	}
	for _, c := range res.Cookies() {
		if c.Name == "automan_staff" {
			if !c.HttpOnly || c.SameSite != http.SameSiteStrictMode {
				t.Fatal("session cookie must be HttpOnly and SameSite=Strict")
			}
			return c.Value
		}
	}
	t.Fatal("no session cookie")
	return ""
}

func TestIntegrationRoleSeparation(t *testing.T) {
	a := integrationAPI(t)
	h := a.Handler()
	agent := staffLogin(t, a, "agent")
	manager := staffLogin(t, a, "manager")
	admin := staffLogin(t, a, "admin")
	draft := `{"document":{"fields":{},"seo":{"title":"","description":"","og_image":"","canonical":"","robots":""}},"expected_revision":0}`
	property := `{"slug":"qa-test-role-` + time.Now().Format("150405000000") + `","reference_code":"QA-` + time.Now().Format("150405000000") + `","title":"QA-TEST","description":"","emirate":"Dubai","community":"QA","category":"apartment","listing_type":"sale","construction_status":"ready","price_aed":1}`
	for _, tc := range []struct {
		who, cookie, method, path, body string
		want                             int
	}{
		{"agent", agent, "GET", "/api/v1/admin/leads", "", 200},
		{"agent", agent, "GET", "/api/v1/cms/admin/pages/home", "", 403},
		{"agent", agent, "PUT", "/api/v1/cms/admin/pages/home/draft", draft, 403},
		{"agent", agent, "GET", "/api/v1/cms/admin/media", "", 403},
		{"agent", agent, "POST", "/api/v1/admin/properties", property, 403},
		{"manager", manager, "GET", "/api/v1/cms/admin/pages/home", "", 403},
		{"manager", manager, "GET", "/api/v1/admin/visits", "", 200},
		{"admin", admin, "GET", "/api/v1/cms/admin/pages/home", "", 200},
	} {
		if code, _, _ := call(t, h, tc.method, tc.path, tc.body, tc.cookie, "198.51.100.50"); code != tc.want {
			t.Errorf("%s %s %s got %d, want %d", tc.who, tc.method, tc.path, code, tc.want)
		}
	}
	// Logout revokes the server-side session; a deactivated account loses access immediately.
	call(t, h, "POST", "/api/v1/staff/logout", "", agent, "198.51.100.50")
	if code, _, _ := call(t, h, "GET", "/api/v1/admin/leads", "", agent, "198.51.100.50"); code != 401 {
		t.Errorf("session still valid after logout: %d", code)
	}
	if _, err := a.DB.Exec(context.Background(), `UPDATE staff_users SET active=false WHERE name='QA-TEST manager'`); err != nil {
		t.Fatal(err)
	}
	if code, _, _ := call(t, h, "GET", "/api/v1/admin/leads", "", manager, "198.51.100.50"); code != 401 {
		t.Errorf("deactivated staff kept access: %d", code)
	}
}

func TestIntegrationArchivedPropertyHidden(t *testing.T) {
	a := integrationAPI(t)
	h := a.Handler()
	slug := "qa-test-archived-" + time.Now().Format("150405000000")
	var id string
	if err := a.DB.QueryRow(context.Background(), `INSERT INTO properties(slug,reference_code,title,emirate,community,category,listing_type,price_aed,publish_status) VALUES($1,$1,'QA-TEST','Dubai','QA','apartment','sale',1,'published') RETURNING id::text`, slug).Scan(&id); err != nil {
		t.Fatal(err)
	}
	if code, _, _ := call(t, h, "GET", "/api/v1/properties/"+slug, "", "", "198.51.100.60"); code != 200 {
		t.Fatalf("published property got %d", code)
	}
	admin := staffLogin(t, a, "admin")
	if code, _, _ := call(t, h, "DELETE", "/api/v1/admin/properties/"+id, "", admin, "198.51.100.60"); code != 200 {
		t.Fatalf("archive got %d", code)
	}
	if code, _, _ := call(t, h, "GET", "/api/v1/properties/"+slug, "", "", "198.51.100.60"); code != 404 {
		t.Fatalf("archived property publicly visible: %d", code)
	}
}
