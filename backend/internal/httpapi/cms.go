package httpapi

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"
)

type cmsSEO struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	OGImage     string `json:"og_image"`
	Canonical   string `json:"canonical"`
	Robots      string `json:"robots"`
}
type cmsDocument struct {
	Fields map[string]string `json:"fields"`
	SEO    cmsSEO            `json:"seo"`
}
type cmsDraftInput struct {
	Document         cmsDocument `json:"document"`
	ExpectedRevision int64       `json:"expected_revision"`
}
type cmsRollbackInput struct {
	Version int64 `json:"version"`
}

var cmsFieldKey = regexp.MustCompile(`^[a-z][a-z0-9_.-]{0,79}$`)
var cmsPages = map[string]bool{"home": true, "about": true, "contact": true, "buy": true, "off-plan": true, "commercial": true, "properties": true, "experience": true, "privacy": true, "site": true}

func cmsPage(slug string) bool { return cmsPages[slug] }
func validCmsURL(value string) bool {
	if value == "" {
		return true
	}
	if strings.ContainsRune(value, 10) || strings.ContainsRune(value, 13) || strings.ContainsRune(value, 92) {
		return false
	}
	if strings.HasPrefix(value, "/") && !strings.HasPrefix(value, "//") {
		return true
	}
	return strings.HasPrefix(value, "https://")
}
func validCmsDocument(d cmsDocument) bool {
	if len(d.Fields) > 120 || len(d.SEO.Title) > 140 || len(d.SEO.Description) > 500 || len(d.SEO.OGImage) > 2048 || len(d.SEO.Canonical) > 512 || len(d.SEO.Robots) > 16 {
		return false
	}
	if !validCmsURL(d.SEO.OGImage) || !validCmsURL(d.SEO.Canonical) || (d.SEO.Robots != "" && d.SEO.Robots != "index" && d.SEO.Robots != "noindex") {
		return false
	}
	for k, v := range d.Fields {
		if !cmsFieldKey.MatchString(k) || len(v) > 5000 {
			return false
		}
		if (strings.HasSuffix(k, ".image") || strings.HasSuffix(k, ".href") || strings.HasSuffix(k, ".src") || strings.HasSuffix(k, ".logo")) && !validCmsURL(v) {
			return false
		}
	}
	return true
}
func cmsDecode(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(v); err != nil {
		respond(w, 400, map[string]string{"error": "invalid CMS JSON"})
		return false
	}
	var extra any
	if err := dec.Decode(&extra); err != io.EOF {
		respond(w, 400, map[string]string{"error": "one JSON object required"})
		return false
	}
	return true
}
func (a API) cmsPublicPage(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if !cmsPage(slug) {
		respond(w, 404, map[string]string{"error": "page not found"})
		return
	}
	if a.DB == nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()
	var body []byte
	err := a.DB.QueryRow(ctx, "SELECT published FROM cms_pages WHERE slug=$1", slug).Scan(&body)
	if err != nil {
		// Missing record means the existing Next.js fallback content is still in use.
		respond(w, 200, map[string]any{"slug": slug, "document": cmsDocument{Fields: map[string]string{}}, "published_revision": 0})
		return
	}
	var doc cmsDocument
	if json.Unmarshal(body, &doc) != nil {
		respond(w, 500, map[string]string{"error": "CMS document unavailable"})
		return
	}
	if doc.Fields == nil {
		doc.Fields = map[string]string{}
	}
	respond(w, 200, map[string]any{"slug": slug, "document": doc})
}
func (a API) cmsAdminPage(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if !cmsPage(slug) {
		respond(w, 404, map[string]string{"error": "page not found"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()
	var draft, published []byte
	var draftRevision, publishedRevision int64
	err := a.DB.QueryRow(ctx, "SELECT draft,published,draft_revision,published_revision FROM cms_pages WHERE slug=$1", slug).Scan(&draft, &published, &draftRevision, &publishedRevision)
	if err != nil {
		empty := cmsDocument{Fields: map[string]string{}}
		respond(w, 200, map[string]any{"slug": slug, "draft": empty, "published": empty, "draft_revision": 0, "published_revision": 0})
		return
	}
	var d, p cmsDocument
	if json.Unmarshal(draft, &d) != nil || json.Unmarshal(published, &p) != nil {
		respond(w, 500, map[string]string{"error": "CMS data unavailable"})
		return
	}
	if d.Fields == nil {
		d.Fields = map[string]string{}
	}
	if p.Fields == nil {
		p.Fields = map[string]string{}
	}
	respond(w, 200, map[string]any{"slug": slug, "draft": d, "published": p, "draft_revision": draftRevision, "published_revision": publishedRevision})
}
func (a API) cmsSaveDraft(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if !cmsPage(slug) {
		respond(w, 404, map[string]string{"error": "page not found"})
		return
	}
	var in cmsDraftInput
	if !cmsDecode(w, r, &in) {
		return
	}
	if in.ExpectedRevision < 0 || !validCmsDocument(in.Document) {
		respond(w, 422, map[string]string{"error": "invalid content or SEO fields"})
		return
	}
	if in.Document.Fields == nil {
		in.Document.Fields = map[string]string{}
	}
	encoded, _ := json.Marshal(in.Document)
	s, _ := a.session(r)
	ctx, cancel := context.WithTimeout(r.Context(), 6*time.Second)
	defer cancel()
	tx, err := a.DB.Begin(ctx)
	if err != nil {
		respond(w, 503, map[string]string{"error": "database unavailable"})
		return
	}
	defer tx.Rollback(ctx)
	_, err = tx.Exec(ctx, "INSERT INTO cms_pages(slug) VALUES($1) ON CONFLICT DO NOTHING", slug)
	if err != nil {
		respond(w, 503, map[string]string{"error": "page unavailable"})
		return
	}
	var revision int64
	err = tx.QueryRow(ctx, "UPDATE cms_pages SET draft=$1,draft_revision=draft_revision+1,updated_by=$2,updated_at=now() WHERE slug=$3 AND draft_revision=$4 RETURNING draft_revision", encoded, s.ID, slug, in.ExpectedRevision).Scan(&revision)
	if err != nil {
		respond(w, 409, map[string]string{"error": "Draft changed elsewhere; reload before saving"})
		return
	}
	if _, err = tx.Exec(ctx, "INSERT INTO audit_events(actor_id,action,subject_type) VALUES ($1,$2,'cms_page')", s.ID, "cms.draft."+slug); err != nil {
		respond(w, 503, map[string]string{"error": "audit unavailable"})
		return
	}
	if err = tx.Commit(ctx); err != nil {
		respond(w, 503, map[string]string{"error": "save failed"})
		return
	}
	respond(w, 200, map[string]any{"status": "draft_saved", "draft_revision": revision})
}
func (a API) cmsPublish(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if !cmsPage(slug) {
		respond(w, 404, map[string]string{"error": "page not found"})
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
	var snapshot []byte
	var version int64
	err = tx.QueryRow(ctx, "UPDATE cms_pages SET published=draft,published_revision=published_revision+1,published_at=now(),updated_by=$2,updated_at=now() WHERE slug=$1 RETURNING published,published_revision", slug, s.ID).Scan(&snapshot, &version)
	if err != nil {
		respond(w, 404, map[string]string{"error": "save a draft before publishing"})
		return
	}
	var doc cmsDocument
	if json.Unmarshal(snapshot, &doc) != nil || !validCmsDocument(doc) {
		respond(w, 422, map[string]string{"error": "invalid published document"})
		return
	}
	_, err = tx.Exec(ctx, "INSERT INTO cms_versions(page_slug,version,snapshot,published_by) VALUES($1,$2,$3,$4)", slug, version, snapshot, s.ID)
	if err != nil {
		respond(w, 503, map[string]string{"error": "version history unavailable"})
		return
	}
	if _, err = tx.Exec(ctx, "INSERT INTO audit_events(actor_id,action,subject_type) VALUES($1,$2,'cms_page')", s.ID, "cms.publish."+slug); err != nil {
		respond(w, 503, map[string]string{"error": "audit unavailable"})
		return
	}
	if err = tx.Commit(ctx); err != nil {
		respond(w, 503, map[string]string{"error": "publish failed"})
		return
	}
	respond(w, 200, map[string]any{"status": "published", "published_revision": version})
}
func (a API) cmsVersions(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if !cmsPage(slug) {
		respond(w, 404, map[string]string{"error": "page not found"})
		return
	}
	ctx, cancel := context.WithTimeout(r.Context(), 4*time.Second)
	defer cancel()
	rows, err := a.DB.Query(ctx, "SELECT version,created_at FROM cms_versions WHERE page_slug=$1 ORDER BY version DESC LIMIT 25", slug)
	if err != nil {
		respond(w, 503, map[string]string{"error": "history unavailable"})
		return
	}
	defer rows.Close()
	type item struct {
		Version   int64     `json:"version"`
		CreatedAt time.Time `json:"created_at"`
	}
	data := []item{}
	for rows.Next() {
		var v item
		if rows.Scan(&v.Version, &v.CreatedAt) != nil {
			respond(w, 500, map[string]string{"error": "history unavailable"})
			return
		}
		data = append(data, v)
	}
	if rows.Err() != nil {
		respond(w, 500, map[string]string{"error": "history unavailable"})
		return
	}
	respond(w, 200, map[string]any{"data": data})
}
func (a API) cmsRollback(w http.ResponseWriter, r *http.Request) {
	slug := r.PathValue("slug")
	if !cmsPage(slug) {
		respond(w, 404, map[string]string{"error": "page not found"})
		return
	}
	var in cmsRollbackInput
	if !cmsDecode(w, r, &in) {
		return
	}
	if in.Version <= 0 {
		respond(w, 422, map[string]string{"error": "invalid version"})
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
	var snapshot []byte
	err = tx.QueryRow(ctx, "SELECT snapshot FROM cms_versions WHERE page_slug=$1 AND version=$2", slug, in.Version).Scan(&snapshot)
	if err != nil {
		respond(w, 404, map[string]string{"error": "version not found"})
		return
	}
	var doc cmsDocument
	if json.Unmarshal(snapshot, &doc) != nil || !validCmsDocument(doc) {
		respond(w, 422, map[string]string{"error": "stored version invalid"})
		return
	}
	var version int64
	err = tx.QueryRow(ctx, "UPDATE cms_pages SET draft=$1,published=$1,draft_revision=draft_revision+1,published_revision=published_revision+1,published_at=now(),updated_by=$3,updated_at=now() WHERE slug=$2 RETURNING published_revision", snapshot, slug, s.ID).Scan(&version)
	if err != nil {
		respond(w, 503, map[string]string{"error": "rollback failed"})
		return
	}
	_, err = tx.Exec(ctx, "INSERT INTO cms_versions(page_slug,version,snapshot,published_by) VALUES($1,$2,$3,$4)", slug, version, snapshot, s.ID)
	if err != nil {
		respond(w, 503, map[string]string{"error": "rollback history unavailable"})
		return
	}
	if _, err = tx.Exec(ctx, "INSERT INTO audit_events(actor_id,action,subject_type) VALUES($1,$2,'cms_page')", s.ID, "cms.rollback."+slug); err != nil {
		respond(w, 503, map[string]string{"error": "audit unavailable"})
		return
	}
	if err = tx.Commit(ctx); err != nil {
		respond(w, 503, map[string]string{"error": "rollback failed"})
		return
	}
	respond(w, 200, map[string]any{"status": "rolled_back", "published_revision": version})
}
