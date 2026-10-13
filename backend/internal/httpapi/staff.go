package httpapi

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/json"
	"errors"
	"github.com/jackc/pgx/v5"
	"net/http"
	"strings"
	"time"
)

// PBKDF2-HMAC-SHA256 password hashes (standard-library implementation) to avoid an
// unaudited homegrown KDF construction. A future migration to Argon2id is recommended.
func derive(password string, salt []byte, iterations int) []byte {
	input := append(append([]byte{}, salt...), 0, 0, 0, 1)
	mac := hmac.New(sha256.New, []byte(password))
	mac.Write(input)
	u := mac.Sum(nil)
	out := append([]byte(nil), u...)
	for i := 1; i < iterations; i++ {
		mac = hmac.New(sha256.New, []byte(password))
		mac.Write(u)
		u = mac.Sum(nil)
		for j := range out {
			out[j] ^= u[j]
		}
	}
	return out
}
func PasswordHash(password string) (string, error) {
	if len(password) < 14 {
		return "", errors.New("password must be at least 14 characters")
	}
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	return "pbkdf2-sha256$210000$" + base64.RawStdEncoding.EncodeToString(salt) + "$" + base64.RawStdEncoding.EncodeToString(derive(password, salt, 210000)), nil
}
func passwordOK(password, hash string) bool {
	parts := strings.Split(hash, "$")
	if len(parts) != 4 || parts[0] != "pbkdf2-sha256" || parts[1] != "210000" {
		return false
	}
	salt, e1 := base64.RawStdEncoding.DecodeString(parts[2])
	expected, e2 := base64.RawStdEncoding.DecodeString(parts[3])
	if e1 != nil || e2 != nil || len(salt) != 16 || len(expected) != 32 {
		return false
	}
	actual := derive(password, salt, 210000)
	return subtle.ConstantTimeCompare(actual, expected) == 1
}

type staffSession struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Role string `json:"role"`
}

func (a API) login(w http.ResponseWriter, r *http.Request) {
	if a.DB == nil || a.Redis == nil {
		respond(w, 503, map[string]string{"error": "service unavailable"})
		return
	}
	if !a.limit(w, r) {
		return
	}
	var v struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if !parse(w, r, &v) {
		return
	}
	if len(v.Password) > 1024 || len(v.Email) > 254 {
		respond(w, 400, map[string]string{"error": "invalid credentials"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var s staffSession
	var hash string
	var active bool
	err := a.DB.QueryRow(ctx, `SELECT id::text,name,role,password_hash,active FROM staff_users WHERE email=$1`, strings.ToLower(strings.TrimSpace(v.Email))).Scan(&s.ID, &s.Name, &s.Role, &hash, &active)
	if err != nil || !active || !passwordOK(v.Password, hash) {
		respond(w, 401, map[string]string{"error": "invalid credentials"})
		return
	}
	token := make([]byte, 32)
	if _, err = rand.Read(token); err != nil {
		respond(w, 503, map[string]string{"error": "session creation unavailable"})
		return
	}
	raw := base64.RawURLEncoding.EncodeToString(token)
	digest := sha256.Sum256([]byte(raw))
	key := "automan:staff:session:" + base64.RawURLEncoding.EncodeToString(digest[:])
	value, _ := json.Marshal(s)
	if err = a.Redis.Set(ctx, key, value, 12*time.Hour).Err(); err != nil {
		respond(w, 503, map[string]string{"error": "session creation unavailable"})
		return
	}
	http.SetCookie(w, &http.Cookie{Name: "automan_staff", Value: raw, Path: "/", HttpOnly: true, Secure: r.TLS != nil || strings.EqualFold(r.Header.Get("X-Forwarded-Proto"), "https"), SameSite: http.SameSiteStrictMode, MaxAge: 43200})
	respond(w, 200, map[string]any{"staff": s})
}
func (a API) session(r *http.Request) (staffSession, bool) {
	var s staffSession
	if a.Redis == nil || a.DB == nil {
		return s, false
	}
	cookie, err := r.Cookie("automan_staff")
	if err != nil || len(cookie.Value) < 40 || len(cookie.Value) > 100 {
		return s, false
	}
	digest := sha256.Sum256([]byte(cookie.Value))
	key := "automan:staff:session:" + base64.RawURLEncoding.EncodeToString(digest[:])
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	value, err := a.Redis.Get(ctx, key).Bytes()
	if err != nil || json.Unmarshal(value, &s) != nil {
		return s, false
	}
	var role string
	var active bool
	if err := a.DB.QueryRow(ctx, `SELECT role,active FROM staff_users WHERE id=$1`, s.ID).Scan(&role, &active); err != nil || !active {
		return staffSession{}, false
	}
	s.Role = role
	return s, true
}
func (a API) requireRole(roles ...string) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			s, ok := a.session(r)
			if !ok {
				respond(w, 401, map[string]string{"error": "staff login required"})
				return
			}
			for _, role := range roles {
				if s.Role == role {
					next(w, r)
					return
				}
			}
			respond(w, 403, map[string]string{"error": "insufficient role"})
		}
	}
}
func (a API) me(w http.ResponseWriter, r *http.Request) {
	s, ok := a.session(r)
	if !ok {
		respond(w, 401, map[string]string{"error": "not signed in"})
		return
	}
	respond(w, 200, map[string]any{"staff": s})
}
func (a API) logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie("automan_staff"); err == nil && a.Redis != nil {
		digest := sha256.Sum256([]byte(c.Value))
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		a.Redis.Del(ctx, "automan:staff:session:"+base64.RawURLEncoding.EncodeToString(digest[:]))
	}
	http.SetCookie(w, &http.Cookie{Name: "automan_staff", Value: "", Path: "/", MaxAge: -1, HttpOnly: true, SameSite: http.SameSiteStrictMode})
	respond(w, 200, map[string]bool{"signed_out": true})
}

var _ = pgx.ErrNoRows
