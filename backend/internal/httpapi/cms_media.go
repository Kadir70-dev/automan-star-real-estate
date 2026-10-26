package httpapi

import (
	"context"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func (a API) cmsUploadMedia(w http.ResponseWriter, r *http.Request) {
	if a.DB == nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	key, filename, mime, err := fileFromForm(w, r, map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"})
	if err != nil {
		respond(w, 400, map[string]string{"error": "upload an image (JPEG, PNG or WebP, max 10 MB)"})
		return
	}
	s, _ := a.session(r)
	info, e := os.Stat(filepath.Join(mediaRoot(), "objects", key))
	if e != nil {
		discard(key)
		respond(w, 503, map[string]string{"error": "upload unavailable"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var id string
	err = a.DB.QueryRow(ctx, "INSERT INTO cms_media(object_key,filename,content_type,byte_size,uploaded_by) VALUES($1,$2,$3,$4,$5) RETURNING id::text", key, filename, mime, info.Size(), s.ID).Scan(&id)
	if err != nil {
		discard(key)
		respond(w, 503, map[string]string{"error": "media storage unavailable"})
		return
	}
	respond(w, 201, map[string]any{"id": id, "url": "/api/cms/media/" + id, "filename": filename, "content_type": mime})
}
func (a API) cmsListMedia(w http.ResponseWriter, r *http.Request) {
	if a.DB == nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	rows, err := a.DB.Query(ctx, "SELECT id::text,filename,content_type,alt_text,byte_size,created_at FROM cms_media ORDER BY created_at DESC LIMIT 100")
	if err != nil {
		respond(w, 503, map[string]string{"error": "media unavailable"})
		return
	}
	defer rows.Close()
	type item struct {
		ID          string    `json:"id"`
		URL         string    `json:"url"`
		Filename    string    `json:"filename"`
		ContentType string    `json:"content_type"`
		Alt         string    `json:"alt_text"`
		Bytes       int64     `json:"bytes"`
		CreatedAt   time.Time `json:"created_at"`
	}
	data := []item{}
	for rows.Next() {
		var it item
		if rows.Scan(&it.ID, &it.Filename, &it.ContentType, &it.Alt, &it.Bytes, &it.CreatedAt) != nil {
			respond(w, 500, map[string]string{"error": "media read failed"})
			return
		}
		it.URL = "/api/cms/media/" + it.ID
		data = append(data, it)
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "media read failed"})
		return
	}
	respond(w, 200, map[string]any{"data": data})
}
func (a API) cmsServeMedia(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !safeId(id) || a.DB == nil {
		http.NotFound(w, r)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()
	var key, mime string
	if a.DB.QueryRow(ctx, "SELECT object_key,content_type FROM cms_media WHERE id=$1", id).Scan(&key, &mime) != nil {
		http.NotFound(w, r)
		return
	}
	if filepath.Base(key) != key {
		http.NotFound(w, r)
		return
	}
	switch mime {
	case "image/jpeg", "image/png", "image/webp":
	default:
		http.NotFound(w, r)
		return
	}
	name := filepath.Join(mediaRoot(), "objects", key)
	file, err := os.Open(name)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer file.Close()
	stat, err := file.Stat()
	if err != nil || !stat.Mode().IsRegular() {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", mime)
	w.Header().Set("Cache-Control", "public, max-age=300")
	w.Header().Set("Content-Disposition", "inline")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	_, _ = io.Copy(w, file)
}


// Update an existing image's accessibility metadata without replacing the file.
// This endpoint is admin-only and records an audit event transactionally.
func (a API) cmsUpdateMedia(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !safeId(id) || a.DB == nil {
		respond(w, 400, map[string]string{"error": "invalid media ID"})
		return
	}
	var input struct {
		AltText string `json:"alt_text"`
	}
	if !cmsDecode(w, r, &input) {
		return
	}
	input.AltText = strings.TrimSpace(input.AltText)
	if len(input.AltText) > 300 || strings.ContainsRune(input.AltText, 0) {
		respond(w, 422, map[string]string{"error": "alt text must be at most 300 characters"})
		return
	}
	s, _ := a.session(r)
	ctx, cancel := context.WithTimeout(r.Context(), 6*time.Second)
	defer cancel()
	tx, err := a.DB.Begin(ctx)
	if err != nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	defer tx.Rollback(ctx)
	tag, err := tx.Exec(ctx, "UPDATE cms_media SET alt_text=$1 WHERE id=$2", input.AltText, id)
	if err != nil {
		respond(w, 503, map[string]string{"error": "media update failed"})
		return
	}
	if tag.RowsAffected() == 0 {
		respond(w, 404, map[string]string{"error": "media not found"})
		return
	}
	if _, err = tx.Exec(ctx, "INSERT INTO audit_events(actor_id,action,subject_type) VALUES($1,$2,'cms_media')", s.ID, "cms.media.alt"); err != nil {
		respond(w, 503, map[string]string{"error": "audit unavailable"})
		return
	}
	if err = tx.Commit(ctx); err != nil {
		respond(w, 503, map[string]string{"error": "media update failed"})
		return
	}
	respond(w, 200, map[string]any{"updated": true, "alt_text": input.AltText})
}
