package httpapi

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

// Minimal valid WebP (RIFF....WEBPVP8 header is all the upload check needs).
var webpBytes = append([]byte("RIFF\x24\x00\x00\x00WEBPVP8 \x18\x00\x00\x00"), make([]byte, 24)...)

func upload(t *testing.T, a API, id, cookie, alt string) string {
	t.Helper()
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	fw, _ := mw.CreateFormFile("file", "photo.webp")
	fw.Write(webpBytes)
	mw.WriteField("alt_text", alt)
	mw.Close()
	req := httptest.NewRequest("POST", "/api/v1/admin/properties/"+id+"/media", &body)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	req.Header.Set("Cookie", "automan_staff="+cookie)
	req.RemoteAddr = "198.51.100.70:4000"
	w := httptest.NewRecorder()
	a.Handler().ServeHTTP(w, req)
	out := map[string]string{}
	_ = json.Unmarshal(w.Body.Bytes(), &out)
	if w.Code != 201 {
		t.Fatalf("upload got %d %s", w.Code, w.Body.String())
	}
	return out["id"]
}

func TestIntegrationPropertyLifecycle(t *testing.T) {
	t.Setenv("MEDIA_DIR", t.TempDir())
	a := integrationAPI(t)
	h := a.Handler()
	manager := staffLogin(t, a, "manager")
	agent := staffLogin(t, a, "agent")
	peer := "198.51.100.71"
	stamp := time.Now().Format("150405000000")
	slug := "qa-test-life-" + stamp
	body := `{"slug":"` + slug + `","reference_code":"QA-L-` + stamp + `","title":"QA-TEST Lifecycle","description":"desc","emirate":"Sharjah","community":"Um Fanain","category":"villa","listing_type":"sale","construction_status":"off_plan","price_aed":2090000,"price_from":true,"developer":"QA Dev","unit_mix":["Villas"," "],"highlights":["Park"],"featured":true}`

	code, out, _ := call(t, h, "POST", "/api/v1/admin/properties", body, manager, peer)
	if code != 201 {
		t.Fatalf("create got %d %v", code, out)
	}
	id := out["id"].(string)
	if code, out, _ = call(t, h, "POST", "/api/v1/admin/properties", body, manager, peer); code != 409 {
		t.Fatalf("duplicate slug got %d %v", code, out)
	}
	if code, out, _ = call(t, h, "PATCH", "/api/v1/admin/properties/"+id+"/status", `{"status":"published"}`, manager, peer); code != 422 {
		t.Fatalf("publish without photos got %d %v", code, out)
	}
	first := upload(t, a, id, manager, "Front")
	second := upload(t, a, id, manager, "Garden")
	if n := count(t, a, `SELECT count(*) FROM property_media WHERE property_id=$1 AND is_cover`, id); n != 1 {
		t.Fatalf("first upload should become the only cover, got %d covers", n)
	}
	if code, _, _ = call(t, h, "PUT", "/api/v1/admin/properties/"+id+"/media/order", `{"ids":["`+second+`","`+first+`"]}`, manager, peer); code != 200 {
		t.Fatalf("reorder got %d", code)
	}
	if code, _, _ = call(t, h, "PATCH", "/api/v1/admin/properties/"+id+"/media/"+second, `{"alt_text":"Garden pool"}`, manager, peer); code != 200 {
		t.Fatalf("alt update got %d", code)
	}
	// Draft is invisible to the public, including its photos.
	if code, _, _ = call(t, h, "GET", "/api/v1/properties/"+slug, "", "", peer); code != 404 {
		t.Fatalf("draft publicly visible: %d", code)
	}
	if code, _, _ = call(t, h, "GET", "/api/v1/media/"+first, "", "", peer); code != 404 {
		t.Fatalf("draft photo publicly visible: %d", code)
	}
	if code, out, _ = call(t, h, "GET", "/api/v1/admin/properties/"+id, "", agent, peer); code != 200 || out["developer"] != "QA Dev" || len(out["unit_mix"].([]any)) != 1 {
		t.Fatalf("admin get got %d %v", code, out)
	}
	if code, _, _ = call(t, h, "PATCH", "/api/v1/admin/properties/"+id+"/status", `{"status":"published"}`, agent, peer); code != 403 {
		t.Fatalf("agent publish got %d", code)
	}
	if code, out, _ = call(t, h, "PATCH", "/api/v1/admin/properties/"+id+"/status", `{"status":"published"}`, manager, peer); code != 200 {
		t.Fatalf("publish got %d %v", code, out)
	}
	code, out, _ = call(t, h, "GET", "/api/v1/properties/"+slug, "", "", peer)
	media, _ := out["media"].([]any)
	if code != 200 || out["price_from"] != true || len(media) != 2 || media[0].(map[string]any)["alt"] != "Front" || media[1].(map[string]any)["alt"] != "Garden pool" {
		t.Fatalf("public detail got %d %v", code, out)
	}
	_, out, _ = call(t, h, "GET", "/api/v1/properties", "", "", peer)
	if !strings.Contains(mustJSON(out), slug) {
		t.Fatal("published listing missing from public list")
	}
	// Unpublish hides it again; trash + restore returns it as a draft.
	call(t, h, "PATCH", "/api/v1/admin/properties/"+id+"/status", `{"status":"draft"}`, manager, peer)
	if code, _, _ = call(t, h, "GET", "/api/v1/properties/"+slug, "", "", peer); code != 404 {
		t.Fatalf("unpublished still visible: %d", code)
	}
	if code, _, _ = call(t, h, "DELETE", "/api/v1/admin/properties/"+id+"?permanent=1", "", manager, peer); code != 409 {
		t.Fatalf("erase outside trash got %d", code)
	}
	if code, _, _ = call(t, h, "DELETE", "/api/v1/admin/properties/"+id, "", manager, peer); code != 200 {
		t.Fatalf("trash got %d", code)
	}
	if code, _, _ = call(t, h, "PATCH", "/api/v1/admin/properties/"+id+"/status", `{"status":"published"}`, manager, peer); code != 409 {
		t.Fatalf("publish from trash got %d", code)
	}
	_, out, _ = call(t, h, "GET", "/api/v1/admin/properties?view=trash", "", manager, peer)
	if !strings.Contains(mustJSON(out), slug) {
		t.Fatal("trashed listing missing from trash view")
	}
	if code, out, _ = call(t, h, "POST", "/api/v1/admin/properties/"+id+"/restore", "", manager, peer); code != 200 || out["status"] != "draft" {
		t.Fatalf("restore got %d %v", code, out)
	}
	call(t, h, "DELETE", "/api/v1/admin/properties/"+id, "", manager, peer)
	if code, _, _ = call(t, h, "DELETE", "/api/v1/admin/properties/"+id+"?permanent=1", "", manager, peer); code != 200 {
		t.Fatalf("erase got %d", code)
	}
	if n := count(t, a, `SELECT count(*) FROM property_media WHERE property_id=$1`, id); n != 0 {
		t.Fatalf("media rows left after erase: %d", n)
	}
}

func mustJSON(v any) string { b, _ := json.Marshal(v); return string(b) }
