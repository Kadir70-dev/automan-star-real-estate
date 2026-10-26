CREATE TABLE cms_media (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 object_key text NOT NULL UNIQUE,
 filename text NOT NULL,
 content_type text NOT NULL CHECK(content_type IN ('image/jpeg','image/png','image/webp')),
 alt_text text NOT NULL DEFAULT '',
 byte_size bigint NOT NULL CHECK(byte_size > 0 AND byte_size <= 10485760),
 uploaded_by uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX cms_media_created_idx ON cms_media(created_at DESC);
