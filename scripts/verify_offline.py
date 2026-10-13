#!/usr/bin/env python3
"""Offline structural regressions, not a substitute for running builds or integration tests."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
class Structure(unittest.TestCase):
 def test_migrations_exist(self):
  files=sorted((ROOT/'backend/internal/db/migrations').glob('*.sql'))
  self.assertGreaterEqual(len(files),2)
  initial=files[0].read_text().lower()
  for table in ('staff_users','properties','property_media','leads','lead_activity','site_visits','private_documents','audit_events'):
   with self.subTest(table=table):self.assertIn('create table',initial);self.assertIn(table,initial)
 def test_auth_guards_on_admin_routes(self):
  routes=(ROOT/'backend/internal/httpapi/api.go').read_text()
  for path in ('/api/v1/admin/leads','/api/v1/admin/visits','/api/v1/admin/properties','/api/v1/admin/documents/{id}/download'):
   self.assertTrue(any('requireRole(' in line for line in routes.splitlines() if path in line),path)
 def test_public_writes_rate_limited(self):
  crm=(ROOT/'backend/internal/httpapi/crm.go').read_text()
  self.assertGreaterEqual(crm.count('a.limit(w, r)'),2)
 def test_no_legacy_admin_header_in_cors(self):
  self.assertNotIn('X-Admin-Key',(ROOT/'backend/internal/httpapi/api.go').read_text())
 def test_media_kept_outside_public_directory(self):
  compose=(ROOT/'docker-compose.yml').read_text()
  self.assertIn('private_media:/app/media',compose)
  self.assertIn('read_only: true',compose)
 def test_public_site_not_fake_production_storage(self):
  self.assertTrue((ROOT/'frontend/lib/demo-store.ts').exists())
if __name__=='__main__':unittest.main(verbosity=2)
