-- Concept listings can generate enquiries without pretending to be DB properties.
ALTER TABLE leads ADD COLUMN property_label text NOT NULL DEFAULT '';
ALTER TABLE site_visits ALTER COLUMN property_id DROP NOT NULL;
ALTER TABLE site_visits ADD COLUMN property_label text NOT NULL DEFAULT '';
ALTER TABLE site_visits ADD COLUMN requested_local_date date;
ALTER TABLE site_visits ADD COLUMN requested_local_time time;
CREATE INDEX site_visits_created_idx ON site_visits(created_at DESC);
