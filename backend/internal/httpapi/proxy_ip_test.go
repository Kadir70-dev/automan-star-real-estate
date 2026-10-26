package httpapi

import (
	"net/http/httptest"
	"strings"
	"testing"
)

func TestClientKeyTrustsRelayOnlyWithSecret(t *testing.T) {
	secret := strings.Repeat("a", 64)
	a := API{ProxySecret: secret}
	req := httptest.NewRequest("POST", "/api/v1/leads", nil)
	req.RemoteAddr = "127.0.0.1:5555"
	req.Header.Set("X-Automan-Client-IP", "203.0.113.9")
	req.Header.Set("X-Forwarded-For", "198.51.100.1")
	if got := a.clientKey(req); got != "peer:127.0.0.1" {
		t.Fatalf("without secret got %q", got)
	}
	req.Header.Set("X-Automan-Proxy-Secret", "wrong")
	if got := a.clientKey(req); got != "peer:127.0.0.1" {
		t.Fatalf("wrong secret got %q", got)
	}
	req.Header.Set("X-Automan-Proxy-Secret", secret)
	if got := a.clientKey(req); got != "relay:203.0.113.9" {
		t.Fatalf("valid secret got %q", got)
	}
	req.Header.Set("X-Automan-Client-IP", "not-an-ip")
	if got := a.clientKey(req); got != "relay:unknown" {
		t.Fatalf("invalid ip got %q", got)
	}
	if got := (API{ProxySecret: "short"}).clientKey(req); got != "peer:127.0.0.1" {
		t.Fatalf("short secret must be ignored, got %q", got)
	}
	req.RemoteAddr = "[2a02:4780::1]:443"
	if got := (API{}).clientKey(req); got != "peer:2a02:4780::1" {
		t.Fatalf("ipv6 peer got %q", got)
	}
}
