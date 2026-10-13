CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE staff_users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL UNIQUE,
 name text NOT NULL,
 password_hash text NOT NULL,
 role text NOT NULL CHECK (role IN ('admin','manager','agent')),
 active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE properties (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE,
 reference_code text NOT NULL UNIQUE,
 title text NOT NULL,
 description text NOT NULL DEFAULT '',
 emirate text NOT NULL,
 community text NOT NULL,
 building text,
 category text NOT NULL CHECK (category IN ('apartment','villa','townhouse','penthouse','office','retail','other')),
 listing_type text NOT NULL CHECK (listing_type IN ('sale','rent','lease')),
 construction_status text NOT NULL DEFAULT 'ready' CHECK (construction_status IN ('ready','off_plan','under_construction')),
 price_aed numeric(16,2) NOT NULL CHECK (price_aed >= 0),
 bedrooms integer CHECK (bedrooms >= 0),
 bathrooms integer CHECK (bathrooms >= 0),
 area_sqft numeric(12,2) CHECK (area_sqft > 0),
 publish_status text NOT NULL DEFAULT 'draft' CHECK (publish_status IN ('draft','published','archived')),
 agent_id uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 latitude numeric(10,7),
 longitude numeric(10,7),
 permit_number text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX properties_public_filter_idx ON properties(publish_status,listing_type,emirate,community);
CREATE INDEX properties_price_idx ON properties(price_aed);
CREATE TABLE property_media (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
 object_key text NOT NULL,
 media_type text NOT NULL CHECK(media_type IN ('image','video','floorplan','brochure','tour')),
 alt_text text,
 sort_order integer NOT NULL DEFAULT 0,
 is_cover boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
 full_name text NOT NULL,
 email text,
 phone text,
 message text NOT NULL DEFAULT '',
 source text NOT NULL DEFAULT 'website',
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','interested','not_interested','closed')),
 assigned_to uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT lead_has_contact CHECK (email IS NOT NULL OR phone IS NOT NULL)
);
CREATE INDEX leads_status_created_idx ON leads(status,created_at DESC);
CREATE TABLE lead_activity (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
 actor_id uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 action text NOT NULL,
 notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE site_visits (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
 property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
 requested_at timestamptz NOT NULL,
 status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','confirmed','completed','cancelled')),
 notes text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE private_documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
 object_key text NOT NULL,
 filename text NOT NULL,
 content_type text NOT NULL,
 uploaded_by uuid NOT NULL REFERENCES staff_users(id),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE audit_events (
 id bigserial PRIMARY KEY,
 actor_id uuid REFERENCES staff_users(id) ON DELETE SET NULL,
 action text NOT NULL,
 subject_type text NOT NULL,
 subject_id uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);
