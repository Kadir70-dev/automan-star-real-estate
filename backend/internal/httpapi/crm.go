package httpapi

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

var emailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
var uuidPattern = regexp.MustCompile(`^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$`)

type leadInput struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Message    string `json:"message"`
	Property   string `json:"property"`
	PropertyID string `json:"property_id"`
}
type visitInput struct {
	leadInput
	Date string `json:"date"`
	Time string `json:"time"`
}
type statusInput struct {
	Status string `json:"status"`
}

func parse(w http.ResponseWriter, r *http.Request, target any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 8192)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(target); err != nil {
		respond(w, 400, map[string]string{"error": "invalid JSON payload"})
		return false
	}
	var extra any
	if err := dec.Decode(&extra); err == nil {
		respond(w, 400, map[string]string{"error": "one JSON object required"})
		return false
	}
	return true
}
func validLead(v *leadInput) bool {
	v.Name = strings.TrimSpace(v.Name)
	v.Email = strings.ToLower(strings.TrimSpace(v.Email))
	v.Phone = strings.TrimSpace(v.Phone)
	v.Message = strings.TrimSpace(v.Message)
	v.Property = strings.TrimSpace(v.Property)
	return utf8.RuneCountInString(v.Name) >= 2 && utf8.RuneCountInString(v.Name) <= 120 && len(v.Email) <= 254 && (v.Email == "" || emailPattern.MatchString(v.Email)) && len(v.Phone) <= 40 && (v.Email != "" || v.Phone != "") && utf8.RuneCountInString(v.Message) <= 3000 && utf8.RuneCountInString(v.Property) <= 240 && (v.PropertyID == "" || uuidPattern.MatchString(v.PropertyID))
}
func (a API) limit(w http.ResponseWriter, r *http.Request) bool {
	if a.Redis == nil {
		respond(w, 503, map[string]string{"error": "service temporarily unavailable"})
		return false
	}
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()
	ip := r.RemoteAddr // only use socket peer, not spoofable X-Forwarded-For
	if i := strings.LastIndex(ip, ":"); i >= 0 {
		ip = ip[:i]
	}
	key := "automan:crm:limit:" + ip + ":" + time.Now().UTC().Format("200601021504")
	n, err := a.Redis.Incr(ctx, key).Result()
	if err != nil {
		respond(w, 503, map[string]string{"error": "service temporarily unavailable"})
		return false
	}
	if n == 1 {
		a.Redis.Expire(ctx, key, 70*time.Second)
	}
	if n > 6 {
		w.Header().Set("Retry-After", "60")
		respond(w, 429, map[string]string{"error": "too many requests; retry shortly"})
		return false
	}
	return true
}
func (a API) createLead(w http.ResponseWriter, r *http.Request) {
	if a.DB == nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	var v leadInput
	if !parse(w, r, &v) {
		return
	}
	if !validLead(&v) {
		respond(w, 422, map[string]string{"error": "enter a valid name and email or phone; check field lengths"})
		return
	}
	if !a.limit(w, r) {
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()
	var id string
	err := a.DB.QueryRow(ctx, `INSERT INTO leads(full_name,email,phone,message,property_label,property_id,source) VALUES ($1,NULLIF($2,''),NULLIF($3,''),$4,$5,NULLIF($6,'')::uuid,'website') RETURNING id::text`, v.Name, v.Email, v.Phone, v.Message, v.Property, v.PropertyID).Scan(&id)
	if err != nil {
		respond(w, 503, map[string]string{"error": "unable to save enquiry"})
		return
	}
	respond(w, 201, map[string]string{"id": id, "status": "new", "message": "Your enquiry has been received."})
}
func (a API) createVisit(w http.ResponseWriter, r *http.Request) {
	if a.DB == nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	var v visitInput
	if !parse(w, r, &v) {
		return
	}
	if !validLead(&v) {
		respond(w, 422, map[string]string{"error": "invalid contact details"})
		return
	}
	d, err := time.Parse("2006-01-02", v.Date)
	if err != nil || v.Date < time.Now().In(time.FixedZone("GST", 4*3600)).Format("2006-01-02") {
		respond(w, 422, map[string]string{"error": "choose a valid future date"})
		return
	}
	tm, err := time.Parse("15:04", v.Time)
	if err != nil || tm.Hour() < 8 || tm.Hour() > 20 {
		respond(w, 422, map[string]string{"error": "invalid viewing time"})
		return
	}
	if !a.limit(w, r) {
		return
	}
	requested := time.Date(d.Year(), d.Month(), d.Day(), tm.Hour(), tm.Minute(), 0, 0, time.FixedZone("GST", 4*3600))
	if !requested.After(time.Now()) {
		respond(w, 422, map[string]string{"error": "choose a future time"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	tx, err := a.DB.Begin(ctx)
	if err != nil {
		respond(w, 503, map[string]string{"error": "service unavailable"})
		return
	}
	defer tx.Rollback(ctx)
	var leadID, visitID string
	err = tx.QueryRow(ctx, `INSERT INTO leads(full_name,email,phone,message,property_label,property_id,source) VALUES ($1,NULLIF($2,''),NULLIF($3,''),$4,$5,NULLIF($6,'')::uuid,'site_visit') RETURNING id::text`, v.Name, v.Email, v.Phone, v.Message, v.Property, v.PropertyID).Scan(&leadID)
	if err == nil {
		err = tx.QueryRow(ctx, `INSERT INTO site_visits(lead_id,property_id,property_label,requested_at,requested_local_date,requested_local_time,status) VALUES ($1,NULLIF($2,'')::uuid,$3,$4,$5,$6,'requested') RETURNING id::text`, leadID, v.PropertyID, v.Property, requested, v.Date, v.Time).Scan(&visitID)
	}
	if err == nil {
		err = tx.Commit(ctx)
	}
	if err != nil {
		respond(w, 503, map[string]string{"error": "could not save viewing request"})
		return
	}
	respond(w, 201, map[string]string{"id": visitID, "lead_id": leadID, "status": "requested", "message": "Your viewing request has been received, but is not yet confirmed."})
}
func (a API) listLeads(w http.ResponseWriter, r *http.Request) {
	if a.DB == nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, err := a.DB.Query(ctx, `SELECT id::text,full_name,COALESCE(email,''),COALESCE(phone,''),message,property_label,status,source,created_at FROM leads ORDER BY created_at DESC LIMIT 100`)
	if err != nil {
		respond(w, 503, map[string]string{"error": "CRM unavailable"})
		return
	}
	defer rows.Close()
	type entry struct {
		ID        string    `json:"id"`
		Name      string    `json:"name"`
		Email     string    `json:"email"`
		Phone     string    `json:"phone"`
		Message   string    `json:"message"`
		Property  string    `json:"property"`
		Status    string    `json:"status"`
		Source    string    `json:"source"`
		CreatedAt time.Time `json:"created_at"`
	}
	data := make([]entry, 0)
	for rows.Next() {
		var x entry
		if err := rows.Scan(&x.ID, &x.Name, &x.Email, &x.Phone, &x.Message, &x.Property, &x.Status, &x.Source, &x.CreatedAt); err != nil {
			respond(w, 500, map[string]string{"error": "read error"})
			return
		}
		data = append(data, x)
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "read error"})
		return
	}
	respond(w, 200, map[string]any{"data": data})
}
func (a API) listVisits(w http.ResponseWriter, r *http.Request) {
	if a.DB == nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, err := a.DB.Query(ctx, `SELECT v.id::text,l.full_name,COALESCE(l.email,''),v.property_label,v.requested_at,v.status FROM site_visits v JOIN leads l ON l.id=v.lead_id ORDER BY v.created_at DESC LIMIT 100`)
	if err != nil {
		respond(w, 503, map[string]string{"error": "visits unavailable"})
		return
	}
	defer rows.Close()
	type entry struct {
		ID          string    `json:"id"`
		Name        string    `json:"name"`
		Email       string    `json:"email"`
		Property    string    `json:"property"`
		RequestedAt time.Time `json:"requested_at"`
		Status      string    `json:"status"`
	}
	data := make([]entry, 0)
	for rows.Next() {
		var x entry
		if err := rows.Scan(&x.ID, &x.Name, &x.Email, &x.Property, &x.RequestedAt, &x.Status); err != nil {
			respond(w, 500, map[string]string{"error": "read error"})
			return
		}
		data = append(data, x)
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "read error"})
		return
	}
	respond(w, 200, map[string]any{"data": data})
}
func (a API) updateLead(w http.ResponseWriter, r *http.Request) {
	a.changeStatus(w, r, "leads", []string{"new", "contacted", "interested", "not_interested", "closed"})
}
func (a API) updateVisit(w http.ResponseWriter, r *http.Request) {
	a.changeStatus(w, r, "site_visits", []string{"requested", "confirmed", "completed", "cancelled"})
}
func (a API) changeStatus(w http.ResponseWriter, r *http.Request, table string, allowed []string) {
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		respond(w, 400, map[string]string{"error": "invalid ID"})
		return
	}
	var v statusInput
	if !parse(w, r, &v) {
		return
	}
	ok := false
	for _, status := range allowed {
		if v.Status == status {
			ok = true
		}
	}
	if !ok {
		respond(w, 422, map[string]string{"error": "invalid status"})
		return
	}
	if a.DB == nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()
	sql := fmt.Sprintf("UPDATE %s SET status=$1 WHERE id=$2 RETURNING id", table)
	if table == "leads" {
		sql = "UPDATE leads SET status=$1,updated_at=now() WHERE id=$2 RETURNING id"
	}
	var returned string
	err := a.DB.QueryRow(ctx, sql, v.Status, id).Scan(&returned)
	if errors.Is(err, pgx.ErrNoRows) {
		respond(w, 404, map[string]string{"error": "not found"})
		return
	}
	if err != nil {
		respond(w, 503, map[string]string{"error": "update failed"})
		return
	}
	respond(w, 200, map[string]string{"id": id, "status": v.Status})
}
