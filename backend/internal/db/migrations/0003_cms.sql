-- Additive CMS migration: preserve CRM, properties and staff data.
-- Pages are whitelisted by the API and store only validated structured content.
CREATE TABLE cms_pages (
 slug text PRIMARY KEY,
 draft jsonb NOT NULL DEFAULT '{"fields":{},"seo":{}}'::jsonb,
 published jsonb NOT NULL DEFAULT '{"fields":{},"seo":{}}'::jsonb,
 draft_revision bigint NOT NULL DEFAULT 0,
 published_revision bigint NOT NULL DEFAULT 0,
 updated_by uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz
);
CREATE TABLE cms_versions (
 id bigserial PRIMARY KEY,
 page_slug text NOT NULL REFERENCES cms_pages(slug) ON DELETE CASCADE,
 version bigint NOT NULL,
 snapshot jsonb NOT NULL,
 published_by uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(page_slug,version)
);
CREATE INDEX cms_versions_page_created_idx ON cms_versions(page_slug, created_at DESC);
