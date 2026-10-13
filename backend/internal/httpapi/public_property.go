package httpapi

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
)

// Public property details never expose unpublished inventory or private documents.
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
	var id, title, description, emirate, community, category, listingType, construction, price, reference string
	var beds, baths *int
	var area *float64
	err := a.DB.QueryRow(ctx, `SELECT id::text,title,description,emirate,community,category,listing_type,construction_status,price_aed::text,reference_code,bedrooms,bathrooms,area_sqft::float8 FROM properties WHERE slug=$1 AND publish_status='published'`, slug).Scan(&id, &title, &description, &emirate, &community, &category, &listingType, &construction, &price, &reference, &beds, &baths, &area)
	if errors.Is(err, pgx.ErrNoRows) {
		respond(w, http.StatusNotFound, map[string]string{"error": "property not found"})
		return
	}
	if err != nil {
		respond(w, http.StatusServiceUnavailable, map[string]string{"error": "property lookup unavailable"})
		return
	}
	rows, err := a.DB.Query(ctx, `SELECT id::text,COALESCE(alt_text,''),is_cover FROM property_media WHERE property_id=$1 AND media_type='image' ORDER BY is_cover DESC,sort_order,created_at`, id)
	if err != nil {
		respond(w, http.StatusServiceUnavailable, map[string]string{"error": "media lookup unavailable"})
		return
	}
	defer rows.Close()
	media := make([]map[string]any, 0)
	for rows.Next() {
		var mediaID, alt string
		var cover bool
		if rows.Scan(&mediaID, &alt, &cover) != nil {
			respond(w, 500, map[string]string{"error": "media read failure"})
			return
		}
		media = append(media, map[string]any{"id": mediaID, "alt": alt, "is_cover": cover})
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "media read failure"})
		return
	}
	respond(w, 200, map[string]any{"id": id, "slug": slug, "reference_code": reference, "title": title, "description": description, "emirate": emirate, "community": community, "category": category, "listing_type": listingType, "construction_status": construction, "price_aed": price, "bedrooms": beds, "bathrooms": baths, "area_sqft": area, "media": media})
}
