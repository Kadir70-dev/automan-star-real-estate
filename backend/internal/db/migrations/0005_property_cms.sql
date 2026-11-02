-- Website-managed listings: project fields, home-page featuring and a trash bin.
ALTER TABLE properties
 ADD COLUMN developer text NOT NULL DEFAULT '',
 ADD COLUMN price_from boolean NOT NULL DEFAULT false,
 ADD COLUMN community_size text NOT NULL DEFAULT '',
 ADD COLUMN unit_mix jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(unit_mix)='array'),
 ADD COLUMN highlights jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(highlights)='array'),
 ADD COLUMN seo_title text NOT NULL DEFAULT '',
 ADD COLUMN seo_description text NOT NULL DEFAULT '',
 ADD COLUMN featured boolean NOT NULL DEFAULT false,
 ADD COLUMN deleted_at timestamptz;
CREATE INDEX properties_live_idx ON properties(publish_status,created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX property_media_property_idx ON property_media(property_id,sort_order);
