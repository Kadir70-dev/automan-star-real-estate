package httpapi

import (
	"context"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

func (a API) cmsMediaList(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()
	rows, err := a.DB.Query(ctx, `SELECT id::text,filename,mime_type,alt_text,byte_size,created_at FROM cms_media ORDER BY created_at DESC LIMIT 100`)
	if err != nil {
		respond(w, 503, map[string]string{"error": "media unavailable"})
		return
	}
	defer rows.Close()
	list := make([]map[string]any, 0)
	for rows.Next() {
		var id, name, mime, alt string
		var size int64
		var created time.Time
		if rows.Scan(&id, &name, &mime, &alt, &size, &created) != nil {
			respond(w, 500, map[string]string{"error": "media read failure"})
			return
		}
		list = append(list, map[string]any{"id": id, "filename": name, "mime_type": mime, "alt_text": alt, "byte_size": size, "created_at": created, "url": "/api/cms/public/media/" + id})
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "media read failure"})
		return
	}
	respond(w, 200, map[string]any{"data": list})
}
func (a API) cmsMediaUpload(w http.ResponseWriter, r *http.Request) {
	key, filename, mime, err := fileFromForm(w, r, map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"})
	if err != nil {
		respond(w, 400, map[string]string{"error": "unsupported image or upload (maximum 10MB)"})
		return
	}
	stat, err := os.Stat(filepath.Join(mediaRoot(), "objects", key))
	if err != nil {
		discard(key)
		respond(w, 503, map[string]string{"error": "media persistence failed"})
		return
	}
	session, _ := a.session(r)
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()
	var id string
	err = a.DB.QueryRow(ctx, `INSERT INTO cms_media(object_key,mime_type,filename,byte_size,uploaded_by) VALUES($1,$2,$3,$4,$5) RETURNING id::text`, key, mime, filename, stat.Size(), session.ID).Scan(&id)
	if err != nil {
		discard(key)
		respond(w, 503, map[string]string{"error": "media database write failed"})
		return
	}
	respond(w, 201, map[string]any{"id": id, "url": "/api/cms/public/media/" + id, "filename": filename})
}
func (a API) cmsMediaAlt(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !safeId(id) {
		respond(w, 400, map[string]string{"error": "invalid media id"})
		return
	}
	var v struct {
		Alt string `json:"alt_text"`
	}
	if !parse(w, r, &v) || len(v.Alt) > 320 {
		respond(w, 400, map[string]string{"error": "invalid alt text"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()
	tag, err := a.DB.Exec(ctx, "UPDATE cms_media SET alt_text=$2 WHERE id=$1", id, v.Alt)
	if err != nil {
		respond(w, 503, map[string]string{"error": "update failed"})
		return
	}
	if tag.RowsAffected() == 0 {
		respond(w, 404, map[string]string{"error": "image not found"})
		return
	}
	respond(w, 200, map[string]bool{"updated": true})
}
func (a API) cmsMediaServe(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !safeId(id) {
		http.NotFound(w, r)
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()
	var key, mime string
	if err := a.DB.QueryRow(ctx, "SELECT object_key,mime_type FROM cms_media WHERE id=$1", id).Scan(&key, &mime); err != nil {
		http.NotFound(w, r)
		return
	}
	if filepath.Base(key) != key || (!strings.HasPrefix(mime, "image/")) {
		http.NotFound(w, r)
		return
	}
	file, err := os.Open(filepath.Join(mediaRoot(), "objects", key))
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
	w.Header().Set("Content-Length", strconv.FormatInt(stat.Size(), 10))
	http.ServeContent(w, r, id, stat.ModTime(), file)
}
