package httpapi

import (
	"context"
	"errors"
	"net/http"
	"regexp"
	"strings"
	"time"
	"unicode/utf8"

	"github.com/jackc/pgx/v5"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)

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
	Developer          string   `json:"developer"`
	PriceFrom          bool     `json:"price_from"`
	CommunitySize      string   `json:"community_size"`
	UnitMix            []string `json:"unit_mix"`
	Highlights         []string `json:"highlights"`
	SeoTitle           string   `json:"seo_title"`
	SeoDescription     string   `json:"seo_description"`
	Featured           bool     `json:"featured"`
}

func in(v string, opts ...string) bool {
	for _, o := range opts {
		if v == o {
			return true
		}
	}
	return false
}

// cleanList trims, drops blanks and enforces per-item and item-count limits.
func cleanList(items []string, maxItems, maxLen int) ([]string, bool) {
	out := make([]string, 0, len(items))
	for _, s := range items {
		if s = strings.TrimSpace(s); s != "" {
			if utf8.RuneCountInString(s) > maxLen {
				return nil, false
			}
			out = append(out, s)
		}
	}
	return out, len(out) <= maxItems
}

func runes(s string, min, max int) bool {
	n := utf8.RuneCountInString(s)
	return n >= min && n <= max
}

// validate normalises the input and returns a user-facing problem, or "".
func (v *propertyInput) validate() string {
	for _, p := range []*string{&v.Slug, &v.Reference, &v.Title, &v.Emirate, &v.Community, &v.Developer, &v.CommunitySize, &v.SeoTitle, &v.SeoDescription, &v.PermitNumber} {
		*p = strings.TrimSpace(*p)
	}
	var ok bool
	switch {
	case !runes(v.Title, 4, 220):
		return "Title must be 4–220 characters."
	case !slugPattern.MatchString(v.Slug) || len(v.Slug) < 3 || len(v.Slug) > 140:
		return "Web address must be 3–140 lowercase letters, numbers and dashes."
	case !runes(v.Reference, 3, 60):
		return "Reference code must be 3–60 characters."
	case !runes(v.Emirate, 2, 100):
		return "Choose an emirate."
	case !runes(v.Community, 2, 120):
		return "Community / area is required."
	case utf8.RuneCountInString(v.Description) > 10000:
		return "Description is too long (max 10,000 characters)."
	case !(v.PriceAED >= 0 && v.PriceAED < 1e13):
		return "Price must be a positive number."
	case !in(v.Category, "apartment", "villa", "townhouse", "penthouse", "office", "retail", "other"):
		return "Choose a property type."
	case !in(v.ListingType, "sale", "rent", "lease"):
		return "Choose sale, rent or lease."
	case !in(v.ConstructionStatus, "ready", "off_plan", "under_construction"):
		return "Choose ready, off-plan or under construction."
	case v.Bedrooms != nil && (*v.Bedrooms < 0 || *v.Bedrooms > 100), v.Bathrooms != nil && (*v.Bathrooms < 0 || *v.Bathrooms > 100):
		return "Bedrooms and bathrooms must be 0–100."
	case v.AreaSqft != nil && (*v.AreaSqft <= 0 || *v.AreaSqft > 1e9):
		return "Area must be greater than 0."
	case !runes(v.Developer, 0, 160), !runes(v.CommunitySize, 0, 60), !runes(v.PermitNumber, 0, 80):
		return "Developer, community size or permit number is too long."
	case !runes(v.SeoTitle, 0, 120), !runes(v.SeoDescription, 0, 300):
		return "Search title max 120 and search description max 300 characters."
	}
	if v.UnitMix, ok = cleanList(v.UnitMix, 20, 120); !ok {
		return "Up to 20 property types, 120 characters each."
	}
	if v.Highlights, ok = cleanList(v.Highlights, 30, 160); !ok {
		return "Up to 30 highlights, 160 characters each."
	}
	return ""
}

const adminPropertyColumns = `p.id::text,p.slug,p.reference_code,p.title,p.description,p.emirate,p.community,p.category,p.listing_type,p.construction_status,p.price_aed::float8,p.bedrooms,p.bathrooms,p.area_sqft::float8,COALESCE(p.permit_number,''),p.developer,p.price_from,p.community_size,p.unit_mix,p.highlights,p.seo_title,p.seo_description,p.featured,p.publish_status,p.deleted_at,p.created_at,p.updated_at,
 (SELECT m.id::text FROM property_media m WHERE m.property_id=p.id AND m.media_type='image' ORDER BY m.is_cover DESC,m.sort_order,m.created_at LIMIT 1),
 (SELECT count(*) FROM property_media m WHERE m.property_id=p.id AND m.media_type='image')`

type adminProperty struct {
	ID         string     `json:"id"`
	Status     string     `json:"publish_status"`
	DeletedAt  *time.Time `json:"deleted_at"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
	CoverID    *string    `json:"cover_id"`
	MediaCount int        `json:"media_count"`
	propertyInput
}

func scanAdminProperty(row pgx.Row) (adminProperty, error) {
	var p adminProperty
	err := row.Scan(&p.ID, &p.Slug, &p.Reference, &p.Title, &p.Description, &p.Emirate, &p.Community, &p.Category, &p.ListingType, &p.ConstructionStatus, &p.PriceAED, &p.Bedrooms, &p.Bathrooms, &p.AreaSqft, &p.PermitNumber, &p.Developer, &p.PriceFrom, &p.CommunitySize, &p.UnitMix, &p.Highlights, &p.SeoTitle, &p.SeoDescription, &p.Featured, &p.Status, &p.DeletedAt, &p.CreatedAt, &p.UpdatedAt, &p.CoverID, &p.MediaCount)
	return p, err
}

// GET /admin/properties?view=trash lists the trash; default lists active listings.
func (a API) propertyAdminList(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	where := "p.deleted_at IS NULL"
	if r.URL.Query().Get("view") == "trash" {
		where = "p.deleted_at IS NOT NULL"
	}
	rows, err := a.DB.Query(ctx, `SELECT `+adminPropertyColumns+` FROM properties p WHERE `+where+` ORDER BY p.updated_at DESC LIMIT 500`)
	if err != nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	defer rows.Close()
	items := []adminProperty{}
	for rows.Next() {
		p, err := scanAdminProperty(rows)
		if err != nil {
			respond(w, 500, map[string]string{"error": "read failed"})
			return
		}
		items = append(items, p)
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "read failed"})
		return
	}
	respond(w, 200, map[string]any{"data": items})
}

func (a API) propertyAdminGet(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		respond(w, 400, map[string]string{"error": "invalid id"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	p, err := scanAdminProperty(a.DB.QueryRow(ctx, `SELECT `+adminPropertyColumns+` FROM properties p WHERE p.id=$1`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		respond(w, 404, map[string]string{"error": "property not found"})
		return
	}
	if err != nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	respond(w, 200, p)
}

func (a API) saveProperty(w http.ResponseWriter, r *http.Request, id string) {
	var v propertyInput
	if !parse(w, r, &v) {
		return
	}
	if msg := v.validate(); msg != "" {
		respond(w, 422, map[string]string{"error": msg})
		return
	}
	s, _ := a.session(r)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	args := []any{v.Slug, v.Reference, v.Title, v.Description, v.Emirate, v.Community, v.Category, v.ListingType, v.ConstructionStatus, v.PriceAED, v.Bedrooms, v.Bathrooms, v.AreaSqft, v.PermitNumber, v.Developer, v.PriceFrom, v.CommunitySize, v.UnitMix, v.Highlights, v.SeoTitle, v.SeoDescription, v.Featured}
	var err error
	if id == "" {
		err = a.DB.QueryRow(ctx, `INSERT INTO properties(slug,reference_code,title,description,emirate,community,category,listing_type,construction_status,price_aed,bedrooms,bathrooms,area_sqft,permit_number,developer,price_from,community_size,unit_mix,highlights,seo_title,seo_description,featured) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id::text`, args...).Scan(&id)
	} else {
		var tag interface{ RowsAffected() int64 }
		tag, err = a.DB.Exec(ctx, `UPDATE properties SET slug=$2,reference_code=$3,title=$4,description=$5,emirate=$6,community=$7,category=$8,listing_type=$9,construction_status=$10,price_aed=$11,bedrooms=$12,bathrooms=$13,area_sqft=$14,permit_number=$15,developer=$16,price_from=$17,community_size=$18,unit_mix=$19,highlights=$20,seo_title=$21,seo_description=$22,featured=$23,updated_at=now() WHERE id=$1`, append([]any{id}, args...)...)
		if err == nil && tag.RowsAffected() == 0 {
			respond(w, 404, map[string]string{"error": "property not found"})
			return
		}
	}
	if err != nil {
		respond(w, 409, map[string]string{"error": "Another listing already uses this web address or reference code."})
		return
	}
	if r.Method == http.MethodPost {
		a.audit(ctx, s.ID, "property.create", id)
		respond(w, 201, map[string]string{"id": id, "publish_status": "draft"})
		return
	}
	a.audit(ctx, s.ID, "property.update", id)
	respond(w, 200, map[string]string{"id": id, "status": "updated"})
}
func (a API) createProperty(w http.ResponseWriter, r *http.Request) { a.saveProperty(w, r, "") }
func (a API) updateProperty(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		respond(w, 400, map[string]string{"error": "invalid id"})
		return
	}
	a.saveProperty(w, r, id)
}

// PATCH /status: draft (unpublished), published or archived. Publishing
// requires at least one photo and a listing that is not in the trash.
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
	var trashed bool
	var photos int
	err := a.DB.QueryRow(ctx, `SELECT deleted_at IS NOT NULL,(SELECT count(*) FROM property_media WHERE property_id=$1 AND media_type='image') FROM properties WHERE id=$1`, id).Scan(&trashed, &photos)
	if errors.Is(err, pgx.ErrNoRows) {
		respond(w, 404, map[string]string{"error": "not found"})
		return
	}
	if err != nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	if trashed {
		respond(w, 409, map[string]string{"error": "Restore this listing from the trash first."})
		return
	}
	if v.Status == "published" && photos == 0 {
		respond(w, 422, map[string]string{"error": "Add at least one photo before publishing."})
		return
	}
	if _, err = a.DB.Exec(ctx, `UPDATE properties SET publish_status=$2,updated_at=now() WHERE id=$1`, id, v.Status); err != nil {
		respond(w, 500, map[string]string{"error": "update failed"})
		return
	}
	a.audit(ctx, s.ID, "property.status."+v.Status, id)
	respond(w, 200, map[string]string{"id": id, "status": v.Status})
}

// DELETE moves a listing to the trash (hidden from the website). With
// ?permanent=1 a listing already in the trash is erased with its photos.
func (a API) archiveProperty(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		respond(w, 400, map[string]string{"error": "invalid id"})
		return
	}
	s, _ := a.session(r)
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	if r.URL.Query().Get("permanent") == "1" {
		a.erasePropertyNow(w, ctx, s.ID, id)
		return
	}
	tag, err := a.DB.Exec(ctx, `UPDATE properties SET deleted_at=now(),updated_at=now() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		respond(w, 500, map[string]string{"error": "delete failed"})
		return
	}
	if tag.RowsAffected() == 0 {
		respond(w, 404, map[string]string{"error": "not found"})
		return
	}
	a.audit(ctx, s.ID, "property.trash", id)
	respond(w, 200, map[string]string{"status": "trashed"})
}

func (a API) erasePropertyNow(w http.ResponseWriter, ctx context.Context, actor, id string) {
	tx, err := a.DB.Begin(ctx)
	if err != nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	defer tx.Rollback(ctx)
	var trashed bool
	if err = tx.QueryRow(ctx, `SELECT deleted_at IS NOT NULL FROM properties WHERE id=$1 FOR UPDATE`, id).Scan(&trashed); err != nil {
		respond(w, 404, map[string]string{"error": "not found"})
		return
	}
	if !trashed {
		respond(w, 409, map[string]string{"error": "Move the listing to the trash before deleting it forever."})
		return
	}
	keys := []string{}
	rows, err := tx.Query(ctx, `SELECT object_key FROM property_media WHERE property_id=$1 UNION ALL SELECT object_key FROM private_documents WHERE property_id=$1`, id)
	if err == nil {
		for rows.Next() {
			var k string
			if rows.Scan(&k) == nil {
				keys = append(keys, k)
			}
		}
		rows.Close()
		err = rows.Err()
	}
	if err == nil {
		_, err = tx.Exec(ctx, `DELETE FROM properties WHERE id=$1`, id)
	}
	if err == nil {
		err = tx.Commit(ctx)
	}
	if err != nil {
		respond(w, 503, map[string]string{"error": "delete failed"})
		return
	}
	for _, k := range keys {
		discard(k)
	}
	a.audit(ctx, actor, "property.erase", id)
	respond(w, 200, map[string]string{"status": "deleted"})
}

// POST /restore brings a listing back from the trash as an unpublished draft.
func (a API) restoreProperty(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !uuidPattern.MatchString(id) {
		respond(w, 400, map[string]string{"error": "invalid id"})
		return
	}
	s, _ := a.session(r)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	tag, err := a.DB.Exec(ctx, `UPDATE properties SET deleted_at=NULL,publish_status='draft',updated_at=now() WHERE id=$1 AND deleted_at IS NOT NULL`, id)
	if err != nil {
		respond(w, 500, map[string]string{"error": "restore failed"})
		return
	}
	if tag.RowsAffected() == 0 {
		respond(w, 404, map[string]string{"error": "not in trash"})
		return
	}
	a.audit(ctx, s.ID, "property.restore", id)
	respond(w, 200, map[string]string{"status": "draft"})
}

func (a API) audit(ctx context.Context, actor, action, id string) {
	_, _ = a.DB.Exec(ctx, `INSERT INTO audit_events(actor_id,action,subject_type,subject_id) VALUES($1,$2,'property',$3)`, actor, action, id)
}
