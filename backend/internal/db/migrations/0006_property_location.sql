-- Optional exact map pin chosen in the admin wizard (columns exist since 0001):
-- both coordinates are set together or both are empty.
ALTER TABLE properties
 ADD CONSTRAINT properties_location_pair CHECK ((latitude IS NULL) = (longitude IS NULL));
