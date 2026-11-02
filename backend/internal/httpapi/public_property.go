package httpapi

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
)

// Public reads never expose drafts, trashed listings or private documents.

type publicProperty struct {
	ID                 string   `json:"id"`
	Slug               string   `json:"slug"`
	Reference          string   `json:"reference_code"`
	Title              string   `json:"title"`
	Description        string   `json:"description,omitempty"`
	Emirate            string   `json:"emirate"`
	Community          string   `json:"community"`
	Category           string   `json:"category"`
	ListingType        string   `json:"listing_type"`
	ConstructionStatus string   `json:"construction_status"`
	PriceAED           string   `json:"price_aed"`
	Bedrooms           *int     `json:"bedrooms"`
	Bathrooms          *int     `json:"bathrooms"`
	AreaSqft           *float64 `json:"area_sqft"`
	Developer          string   `json:"developer"`
	PriceFrom          bool     `json:"price_from"`
	CommunitySize      string   `json:"community_size"`
	Latitude           *float64 `json:"latitude"`
	Longitude          *float64 `json:"longitude"`
	UnitMix            []string `json:"unit_mix"`
	Highlights         []string `json:"highlights"`
	SeoTitle           string   `json:"seo_title"`
	SeoDescription     string   `json:"seo_description"`
	Featured           bool     `json:"featured"`
	CoverID            *string  `json:"cover_id"`
	CoverAlt           string   `json:"cover_alt"`
	UpdatedAt          string   `json:"updated_at"`
	Media              []media  `json:"media,omitempty"`
}
type media struct {
	ID    string `json:"id"`
	Alt   string `json:"alt"`
	Cover bool   `json:"is_cover"`
}

const publicColumns = `p.id::text,p.slug,p.reference_code,p.title,p.description,p.emirate,p.community,p.category,p.listing_type,p.construction_status,p.price_aed::text,p.bedrooms,p.bathrooms,p.area_sqft::float8,p.developer,p.price_from,p.community_size,p.latitude::float8,p.longitude::float8,p.unit_mix,p.highlights,p.seo_title,p.seo_description,p.featured,to_char(p.updated_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS"Z"'),c.id::text,COALESCE(c.alt_text,'')`
const coverJoin = ` LEFT JOIN LATERAL (SELECT m.id,m.alt_text FROM property_media m WHERE m.property_id=p.id AND m.media_type='image' ORDER BY m.is_cover DESC,m.sort_order,m.created_at LIMIT 1) c ON true`

func scanPublic(row pgx.Row) (publicProperty, error) {
	var p publicProperty
	err := row.Scan(&p.ID, &p.Slug, &p.Reference, &p.Title, &p.Description, &p.Emirate, &p.Community, &p.Category, &p.ListingType, &p.ConstructionStatus, &p.PriceAED, &p.Bedrooms, &p.Bathrooms, &p.AreaSqft, &p.Developer, &p.PriceFrom, &p.CommunitySize, &p.Latitude, &p.Longitude, &p.UnitMix, &p.Highlights, &p.SeoTitle, &p.SeoDescription, &p.Featured, &p.UpdatedAt, &p.CoverID, &p.CoverAlt)
	return p, err
}

func (a API) publicPropertyList(w http.ResponseWriter, r *http.Request) {
	if a.DB == nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	rows, err := a.DB.Query(ctx, `SELECT `+publicColumns+` FROM properties p`+coverJoin+` WHERE p.publish_status='published' AND p.deleted_at IS NULL ORDER BY p.featured DESC,p.created_at DESC LIMIT 200`)
	if err != nil {
		respond(w, 503, map[string]string{"error": "property lookup unavailable"})
		return
	}
	defer rows.Close()
	items := make([]publicProperty, 0)
	for rows.Next() {
		p, err := scanPublic(rows)
		if err != nil {
			respond(w, 500, map[string]string{"error": "property read failure"})
			return
		}
		p.Description = ""
		items = append(items, p)
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "property read failure"})
		return
	}
	respond(w, 200, map[string]any{"data": items, "count": len(items)})
}

func (a API) publicPropertyDetail(w http.ResponseWriter, r *http.Request) {
	if a.DB == nil {
		respond(w, http.StatusServiceUnavailable, map[string]string{"error": "database unavailable"})
		return
	}
	slug := r.PathValue("slug")
	if len(slug) < 3 || len(slug) > 140 {
		respond(w, http.StatusBadRequest, map[string]string{"error": "invalid property slug"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
	defer cancel()
	p, err := scanPublic(a.DB.QueryRow(ctx, `SELECT `+publicColumns+` FROM properties p`+coverJoin+` WHERE p.slug=$1 AND p.publish_status='published' AND p.deleted_at IS NULL`, slug))
	if errors.Is(err, pgx.ErrNoRows) {
		respond(w, http.StatusNotFound, map[string]string{"error": "property not found"})
		return
	}
	if err != nil {
		respond(w, http.StatusServiceUnavailable, map[string]string{"error": "property lookup unavailable"})
		return
	}
	if p.Media, err = a.propertyImages(ctx, p.ID); err != nil {
		respond(w, http.StatusServiceUnavailable, map[string]string{"error": "media lookup unavailable"})
		return
	}
	respond(w, 200, p)
}

// Cover first, then the editor's display order.
func (a API) propertyImages(ctx context.Context, id string) ([]media, error) {
	rows, err := a.DB.Query(ctx, `SELECT id::text,COALESCE(alt_text,''),is_cover FROM property_media WHERE property_id=$1 AND media_type='image' ORDER BY is_cover DESC,sort_order,created_at`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := make([]media, 0)
	for rows.Next() {
		var m media
		if err := rows.Scan(&m.ID, &m.Alt, &m.Cover); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}
