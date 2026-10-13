package httpapi

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"time"

	"github.com/jackc/pgx/v5"
)

const maxFileBytes int64 = 10 << 20

func mediaRoot() string {
	if x := os.Getenv("MEDIA_DIR"); x != "" {
		return x
	}
	return "./private-uploads"
}
func safeId(s string) bool {
	if len(s) != 36 {
		return false
	}
	for i, c := range s {
		if i == 8 || i == 13 || i == 18 || i == 23 {
			if c != '-' {
				return false
			}
		} else if !strings.ContainsRune("0123456789abcdefABCDEF", c) {
			return false
		}
	}
	return true
}
func randKey(ext string) (string, error) {
	var b [20]byte
	if _, err := rand.Read(b[:]); err != nil {
		return "", err
	}
	return hex.EncodeToString(b[:]) + ext, nil
}
func (a API) propertyExists(ctx context.Context, id string) bool {
	var x bool
	return a.DB.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM properties WHERE id=$1)", id).Scan(&x) == nil && x
}
func fileFromForm(w http.ResponseWriter, r *http.Request, allowed map[string]string) (key, original, mime string, err error) {
	r.Body = http.MaxBytesReader(w, r.Body, maxFileBytes+(1<<20))
	if err = r.ParseMultipartForm(maxFileBytes); err != nil {
		return
	}
	part, h, e := r.FormFile("file")
	if e != nil {
		err = e
		return
	}
	defer part.Close()
	if h.Size > maxFileBytes || h.Size < 1 {
		err = errors.New("file size must be 1–10 MB")
		return
	}
	var head [512]byte
	n, e := part.Read(head[:])
	if e != nil && e != io.EOF {
		err = e
		return
	}
	mime = http.DetectContentType(head[:n])
	ext, ok := allowed[mime]
	if !ok {
		err = errors.New("unsupported file type")
		return
	}
	if strings.HasPrefix(mime, "image/") {
		// Reject malformed JPEG/PNG contents rather than trusting content-type sniffing.
		// WebP has a RIFF container; complete decode requires an external decoder.
		if mime == "image/jpeg" || mime == "image/png" {
			if _, _, e = image.DecodeConfig(io.NewSectionReader(part, 0, h.Size)); e != nil {
				err = errors.New("invalid image data")
				return
			}
		} else if mime == "image/webp" && (n < 16 || !bytes.Equal(head[:4], []byte("RIFF")) || !bytes.Equal(head[8:12], []byte("WEBP"))) {
			err = errors.New("invalid WebP header")
			return
		}
	}
	if _, e = part.Seek(0, 0); e != nil {
		err = e
		return
	}
	key, e = randKey(ext)
	if e != nil {
		err = e
		return
	}
	dir := filepath.Join(mediaRoot(), "objects")
	if e = os.MkdirAll(dir, 0700); e != nil {
		err = e
		return
	}
	out, e := os.OpenFile(filepath.Join(dir, key), os.O_WRONLY|os.O_CREATE|os.O_EXCL, 0600)
	if e != nil {
		err = e
		return
	}
	size, e := io.Copy(out, io.LimitReader(part, maxFileBytes+1))
	closeErr := out.Close()
	if e != nil || closeErr != nil || size > maxFileBytes {
		os.Remove(filepath.Join(dir, key))
		err = errors.New("unable to save file")
		return
	}
	original = filepath.Base(h.Filename)
	if len(original) > 200 {
		original = original[:200]
	}
	return
}
func discard(key string) {
	if len(key) > 0 && filepath.Base(key) == key {
		_ = os.Remove(filepath.Join(mediaRoot(), "objects", key))
	}
}
func (a API) uploadMedia(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if a.DB == nil || !safeId(id) {
		respond(w, 400, map[string]string{"error": "invalid property"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 8*time.Second)
	defer cancel()
	if !a.propertyExists(ctx, id) {
		respond(w, 404, map[string]string{"error": "property not found"})
		return
	}
	key, _, mime, err := fileFromForm(w, r, map[string]string{"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"})
	if err != nil {
		respond(w, 400, map[string]string{"error": err.Error()})
		return
	}
	var mid string
	err = a.DB.QueryRow(ctx, `INSERT INTO property_media(property_id,object_key,media_type,alt_text,sort_order) VALUES($1,$2,'image',$3,COALESCE((SELECT max(sort_order)+1 FROM property_media WHERE property_id=$1),0)) RETURNING id::text`, id, key, strings.TrimSpace(r.FormValue("alt_text"))).Scan(&mid)
	if err != nil {
		discard(key)
		respond(w, 503, map[string]string{"error": "media save failed"})
		return
	}
	_ = mime
	respond(w, 201, map[string]string{"id": mid, "url": "/api/v1/media/" + mid})
}
func (a API) listMedia(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if a.DB == nil || !safeId(id) {
		respond(w, 400, map[string]string{"error": "invalid property"})
		return
	}
	ctx, c := context.WithTimeout(r.Context(), 4*time.Second)
	defer c()
	rows, err := a.DB.Query(ctx, `SELECT id::text,alt_text,sort_order,is_cover FROM property_media WHERE property_id=$1 ORDER BY sort_order,created_at`, id)
	if err != nil {
		respond(w, 503, map[string]string{"error": "media unavailable"})
		return
	}
	defer rows.Close()
	type item struct {
		ID    string `json:"id"`
		Alt   string `json:"alt_text"`
		Order int    `json:"sort_order"`
		Cover bool   `json:"is_cover"`
		URL   string `json:"url"`
	}
	data := []item{}
	for rows.Next() {
		var x item
		if rows.Scan(&x.ID, &x.Alt, &x.Order, &x.Cover) != nil {
			respond(w, 500, map[string]string{"error": "read failure"})
			return
		}
		x.URL = "/api/v1/media/" + x.ID
		data = append(data, x)
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "read failure"})
		return
	}
	respond(w, 200, map[string]any{"data": data})
}
func (a API) coverMedia(w http.ResponseWriter, r *http.Request) { a.modifyMedia(w, r, true) }
func (a API) orderMedia(w http.ResponseWriter, r *http.Request) { a.modifyMedia(w, r, false) }
func (a API) modifyMedia(w http.ResponseWriter, r *http.Request, cover bool) {
	id, mid := r.PathValue("id"), r.PathValue("mediaID")
	if !safeId(id) || !safeId(mid) {
		respond(w, 400, map[string]string{"error": "invalid id"})
		return
	}
	ctx, c := context.WithTimeout(r.Context(), 5*time.Second)
	defer c()
	if cover {
		tx, err := a.DB.Begin(ctx)
		if err != nil {
			respond(w, 503, map[string]string{"error": "database unavailable"})
			return
		}
		defer tx.Rollback(ctx)
		var exists bool
		if err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM property_media WHERE id=$1 AND property_id=$2 AND media_type='image')`, mid, id).Scan(&exists); err != nil || !exists {
			respond(w, 404, map[string]string{"error": "media not found"})
			return
		}
		if _, err = tx.Exec(ctx, `UPDATE property_media SET is_cover=false WHERE property_id=$1`, id); err == nil {
			_, err = tx.Exec(ctx, `UPDATE property_media SET is_cover=true WHERE id=$1 AND property_id=$2`, mid, id)
		}
		if err == nil {
			err = tx.Commit(ctx)
		}
		if err != nil {
			respond(w, 503, map[string]string{"error": "cover update failed"})
			return
		}
	} else {
		var v struct {
			Order int `json:"sort_order"`
		}
		if !parse(w, r, &v) {
			return
		}
		if v.Order < 0 || v.Order > 100000 {
			respond(w, 400, map[string]string{"error": "invalid order"})
			return
		}
		tag, err := a.DB.Exec(ctx, `UPDATE property_media SET sort_order=$3 WHERE id=$1 AND property_id=$2`, mid, id, v.Order)
		if err != nil {
			respond(w, 503, map[string]string{"error": "update failed"})
			return
		}
		if tag.RowsAffected() == 0 {
			respond(w, 404, map[string]string{"error": "media not found"})
			return
		}
	}
	respond(w, 200, map[string]bool{"updated": true})
}
func (a API) deleteMedia(w http.ResponseWriter, r *http.Request) {
	id, mid := r.PathValue("id"), r.PathValue("mediaID")
	if !safeId(id) || !safeId(mid) {
		respond(w, 400, map[string]string{"error": "invalid id"})
		return
	}
	ctx, c := context.WithTimeout(r.Context(), 5*time.Second)
	defer c()
	var key string
	err := a.DB.QueryRow(ctx, `DELETE FROM property_media WHERE id=$1 AND property_id=$2 RETURNING object_key`, mid, id).Scan(&key)
	if errors.Is(err, pgx.ErrNoRows) {
		respond(w, 404, map[string]string{"error": "not found"})
		return
	}
	if err != nil {
		respond(w, 503, map[string]string{"error": "delete failed"})
		return
	}
	discard(key)
	respond(w, 200, map[string]bool{"deleted": true})
}
func (a API) serveMedia(w http.ResponseWriter, r *http.Request) {
	mid := r.PathValue("id")
	if !safeId(mid) {
		http.NotFound(w, r)
		return
	}
	ctx, c := context.WithTimeout(r.Context(), 4*time.Second)
	defer c()
	var key, stat string
	err := a.DB.QueryRow(ctx, `SELECT m.object_key,p.publish_status FROM property_media m JOIN properties p ON p.id=m.property_id WHERE m.id=$1`, mid).Scan(&key, &stat)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	if stat != "published" {
		if _, ok := a.session(r); !ok {
			http.NotFound(w, r)
			return
		}
	}
	if filepath.Base(key) != key {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if stat == "published" {
		w.Header().Set("Cache-Control", "public, max-age=60")
	} else {
		w.Header().Set("Cache-Control", "private, no-store")
	}
	http.ServeFile(w, r, filepath.Join(mediaRoot(), "objects", key))
}
func (a API) uploadDocument(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !safeId(id) {
		respond(w, 400, map[string]string{"error": "invalid property"})
		return
	}
	ctx, c := context.WithTimeout(r.Context(), 8*time.Second)
	defer c()
	if !a.propertyExists(ctx, id) {
		respond(w, 404, map[string]string{"error": "property not found"})
		return
	}
	s, ok := a.session(r)
	if !ok {
		respond(w, 401, map[string]string{"error": "login required"})
		return
	}
	key, name, mime, err := fileFromForm(w, r, map[string]string{"application/pdf": ".pdf", "image/jpeg": ".jpg", "image/png": ".png"})
	if err != nil {
		respond(w, 400, map[string]string{"error": err.Error()})
		return
	}
	var did string
	err = a.DB.QueryRow(ctx, `INSERT INTO private_documents(property_id,object_key,filename,content_type,uploaded_by) VALUES($1,$2,$3,$4,$5) RETURNING id::text`, id, key, name, mime, s.ID).Scan(&did)
	if err != nil {
		discard(key)
		respond(w, 503, map[string]string{"error": "document storage failed"})
		return
	}
	respond(w, 201, map[string]string{"id": did})
}
func (a API) listDocuments(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !safeId(id) {
		respond(w, 400, map[string]string{"error": "invalid property"})
		return
	}
	ctx, c := context.WithTimeout(r.Context(), 4*time.Second)
	defer c()
	rows, err := a.DB.Query(ctx, `SELECT id::text,filename,content_type,created_at FROM private_documents WHERE property_id=$1 ORDER BY created_at DESC`, id)
	if err != nil {
		respond(w, 503, map[string]string{"error": "documents unavailable"})
		return
	}
	defer rows.Close()
	data := []map[string]any{}
	for rows.Next() {
		var id, name, mime string
		var at time.Time
		if rows.Scan(&id, &name, &mime, &at) != nil {
			respond(w, 500, map[string]string{"error": "read failed"})
			return
		}
		data = append(data, map[string]any{"id": id, "filename": name, "content_type": mime, "created_at": at})
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "read failed"})
		return
	}
	respond(w, 200, map[string]any{"data": data})
}
func (a API) downloadDocument(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if !safeId(id) {
		http.NotFound(w, r)
		return
	}
	ctx, c := context.WithTimeout(r.Context(), 4*time.Second)
	defer c()
	var key, name, mime string
	if a.DB.QueryRow(ctx, `SELECT object_key,filename,content_type FROM private_documents WHERE id=$1`, id).Scan(&key, &name, &mime) != nil || filepath.Base(key) != key {
		http.NotFound(w, r)
		return
	}
	f, err := os.Open(filepath.Join(mediaRoot(), "objects", key))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	defer f.Close()
	w.Header().Set("Content-Type", mime)
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", strings.Map(func(r rune) rune {
		if r == '"' || r == '\r' || r == '\n' || r == '\\' {
			return '_'
		}
		return r
	}, name)))
	io.Copy(w, f)
}
