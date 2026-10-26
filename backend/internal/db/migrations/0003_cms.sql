-- CMS v1: immutable publication snapshots, page-scoped SEO, and reusable media.
CREATE TABLE cms_pages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 page_key text NOT NULL UNIQUE CHECK (page_key ~ '^[a-z0-9][a-z0-9_-]{0,79}$'),
 path text NOT NULL UNIQUE CHECK (left(path,1)='/'),
 title text NOT NULL DEFAULT '',
 draft jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(draft)='object'),
 draft_revision integer NOT NULL DEFAULT 1,
 published_revision integer,
 published jsonb CHECK (published IS NULL OR jsonb_typeof(published)='object'),
 updated_by uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now(),
 published_at timestamptz
);
CREATE TABLE cms_page_versions (
 id bigserial PRIMARY KEY,
 page_id uuid NOT NULL REFERENCES cms_pages(id) ON DELETE CASCADE,
 revision integer NOT NULL,
 snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot)='object'),
 action text NOT NULL CHECK (action IN ('publish','rollback')),
 actor_id uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(page_id,revision)
);
CREATE INDEX cms_versions_page_created ON cms_page_versions(page_id,created_at DESC);
CREATE TABLE cms_media (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 object_key text NOT NULL UNIQUE,
 mime_type text NOT NULL,
 alt_text text NOT NULL DEFAULT '',
 filename text NOT NULL,
 byte_size bigint NOT NULL CHECK (byte_size > 0 AND byte_size <= 10485760),
 uploaded_by uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE cms_site_settings (
 key text PRIMARY KEY CHECK (key ~ '^[a-z][a-z0-9_]{0,79}$'),
 draft jsonb NOT NULL CHECK (jsonb_typeof(draft)='object'),
 published jsonb CHECK (published IS NULL OR jsonb_typeof(published)='object'),
 updated_by uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 updated_at timestamptz NOT NULL DEFAULT now()
);
