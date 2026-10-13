package httpapi

import (
	"context"
	"encoding/json"
	"github.com/jackc/pgx/v5"
	"net/http"
	"strings"
	"time"
)

type propertyInput struct {
	Slug               string   `json:"slug"`
	Reference          string   `json:"reference_code"`
	Title              string   `json:"title"`
	Description        string   `json:"description"`
	Emirate            string   `json:"emirate"`
	Community          string   `json:"community"`
	Category           string   `json:"category"`
	ListingType        string   `json:"listing_type"`
	ConstructionStatus string   `json:"construction_status"`
	PriceAED           float64  `json:"price_aed"`
	Bedrooms           *int     `json:"bedrooms"`
	Bathrooms          *int     `json:"bathrooms"`
	AreaSqft           *float64 `json:"area_sqft"`
	PermitNumber       string   `json:"permit_number"`
}

func in(v string, opts ...string) bool {
	for _, o := range opts {
		if v == o {
			return true
		}
	}
	return false
}
func (v *propertyInput) valid() bool {
	v.Slug = strings.TrimSpace(v.Slug)
	v.Reference = strings.TrimSpace(v.Reference)
	v.Title = strings.TrimSpace(v.Title)
	v.Community = strings.TrimSpace(v.Community)
	v.Emirate = strings.TrimSpace(v.Emirate)
	return len(v.Slug) > 2 && len(v.Slug) <= 140 && len(v.Reference) > 2 && len(v.Reference) <= 60 && len(v.Title) > 3 && len(v.Title) <= 220 && len(v.Description) <= 10000 && len(v.Emirate) > 1 && len(v.Emirate) <= 100 && len(v.Community) > 1 && len(v.Community) <= 120 && v.PriceAED >= 0 && v.PriceAED < 1e13 && in(v.Category, "apartment", "villa", "townhouse", "penthouse", "office", "retail", "other") && in(v.ListingType, "sale", "rent", "lease") && in(v.ConstructionStatus, "ready", "off_plan", "under_construction") && (v.Bedrooms == nil || *v.Bedrooms >= 0 && *v.Bedrooms <= 100) && (v.Bathrooms == nil || *v.Bathrooms >= 0 && *v.Bathrooms <= 100) && (v.AreaSqft == nil || *v.AreaSqft > 0 && *v.AreaSqft <= 1e9)
}
func (a API) propertyAdminList(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, err := a.DB.Query(ctx, `SELECT id::text,slug,reference_code,title,description,emirate,community,category,listing_type,construction_status,price_aed::text,publish_status,created_at FROM properties ORDER BY created_at DESC LIMIT 100`)
	if err != nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	defer rows.Close()
	items := []map[string]any{}
	for rows.Next() {
		var id, slug, reference, title, description, emirate, community, category, listingType, construction, price, status string
		var created time.Time
		if rows.Scan(&id, &slug, &reference, &title, &description, &emirate, &community, &category, &listingType, &construction, &price, &status, &created) != nil {
			respond(w, 500, map[string]string{"error": "read failed"})
			return
		}
		items = append(items, map[string]any{"id": id, "slug": slug, "reference_code": reference, "title": title, "description": description, "emirate": emirate, "community": community, "category": category, "listing_type": listingType, "construction_status": construction, "price_aed": price, "publish_status": status, "created_at": created})
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "read failed"})
		return
	}
	respond(w, 200, map[string]any{"data": items})
}
func (a API) createProperty(w http.ResponseWriter, r *http.Request) {
	var v propertyInput
	if !parse(w, r, &v) {
		return
	}
	if !v.valid() {
		respond(w, 422, map[string]string{"error": "invalid property fields"})
		return
	}
	s, _ := a.session(r)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var id string
	err := a.DB.QueryRow(ctx, `INSERT INTO properties(slug,reference_code,title,description,emirate,community,category,listing_type,construction_status,price_aed,bedrooms,bathrooms,area_sqft,permit_number) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id::text`, v.Slug, v.Reference, v.Title, v.Description, v.Emirate, v.Community, v.Category, v.ListingType, v.ConstructionStatus, v.PriceAED, v.Bedrooms, v.Bathrooms, v.AreaSqft, v.PermitNumber).Scan(&id)
	if err != nil {
		respond(w, 409, map[string]string{"error": "property could not be created; check slug and reference uniqueness"})
		return
	}
	a.audit(ctx, s.ID, "property.create", id)
	respond(w, 201, map[string]string{"id": id, "publish_status": "draft"})
}
func (a API) updateProperty(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		respond(w, 400, map[string]string{"error": "invalid id"})
		return
	}
	var v propertyInput
	if !parse(w, r, &v) {
		return
	}
	if !v.valid() {
		respond(w, 422, map[string]string{"error": "invalid property fields"})
		return
	}
	s, _ := a.session(r)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	tag, err := a.DB.Exec(ctx, `UPDATE properties SET slug=$2,reference_code=$3,title=$4,description=$5,emirate=$6,community=$7,category=$8,listing_type=$9,construction_status=$10,price_aed=$11,bedrooms=$12,bathrooms=$13,area_sqft=$14,permit_number=$15,updated_at=now() WHERE id=$1`, id, v.Slug, v.Reference, v.Title, v.Description, v.Emirate, v.Community, v.Category, v.ListingType, v.ConstructionStatus, v.PriceAED, v.Bedrooms, v.Bathrooms, v.AreaSqft, v.PermitNumber)
	if err != nil {
		respond(w, 409, map[string]string{"error": "update failed; check unique identifiers"})
		return
	}
	if tag.RowsAffected() == 0 {
		respond(w, 404, map[string]string{"error": "property not found"})
		return
	}
	a.audit(ctx, s.ID, "property.update", id)
	respond(w, 200, map[string]string{"id": id, "status": "updated"})
}
func (a API) publishProperty(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		respond(w, 400, map[string]string{"error": "invalid id"})
		return
	}
	var v struct {
		Status string `json:"status"`
	}
	if !parse(w, r, &v) {
		return
	}
	if !in(v.Status, "draft", "published", "archived") {
		respond(w, 422, map[string]string{"error": "invalid status"})
		return
	}
	s, _ := a.session(r)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	tag, err := a.DB.Exec(ctx, `UPDATE properties SET publish_status=$2,updated_at=now() WHERE id=$1`, id, v.Status)
	if err != nil {
		respond(w, 500, map[string]string{"error": "update failed"})
		return
	}
	if tag.RowsAffected() == 0 {
		respond(w, 404, map[string]string{"error": "not found"})
		return
	}
	a.audit(ctx, s.ID, "property.status."+v.Status, id)
	respond(w, 200, map[string]string{"id": id, "status": v.Status})
}
func (a API) archiveProperty(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		respond(w, 400, map[string]string{"error": "invalid id"})
		return
	}
	s, _ := a.session(r)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	tag, err := a.DB.Exec(ctx, `UPDATE properties SET publish_status='archived',updated_at=now() WHERE id=$1`, id)
	if err != nil {
		respond(w, 500, map[string]string{"error": "archive failed"})
		return
	}
	if tag.RowsAffected() == 0 {
		respond(w, 404, map[string]string{"error": "not found"})
		return
	}
	a.audit(ctx, s.ID, "property.archive", id)
	respond(w, 200, map[string]string{"status": "archived"})
}
func (a API) audit(ctx context.Context, actor, action, id string) {
	_, _ = a.DB.Exec(ctx, `INSERT INTO audit_events(actor_id,action,subject_type,subject_id) VALUES($1,$2,'property',$3)`, actor, action, id)
}

var _ = json.Valid
var _ = pgx.ErrNoRows
