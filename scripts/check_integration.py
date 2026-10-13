from pathlib import Path
import unittest
R=Path(__file__).resolve().parents[1]
class IntegrationSourceTests(unittest.TestCase):
 def test_published_property_api_only(self):
  src=(R/'backend/internal/httpapi/public_property.go').read_text()
  self.assertIn("publish_status='published'",src)
  self.assertIn('pgx.ErrNoRows',src)
 def test_public_inventory_uses_postgres(self):
  src=(R/'frontend/app/properties/page.tsx').read_text()
  self.assertIn('getLiveProperties',src)
  self.assertNotIn("@/lib/data",src)
 def test_demo_routes_separate(self):
  self.assertTrue((R/'frontend/app/demo-properties/[slug]/page.tsx').exists())
  self.assertIn('demo-properties', (R/'frontend/components/PropertyCard.tsx').read_text())
 def test_live_detail_is_api_only(self):
  src=(R/'frontend/app/properties/[slug]/page.tsx').read_text()
  self.assertIn('/api/v1/properties/',src)
  self.assertNotIn('lib/data',src)
 def test_media_is_not_public_static(self):
  self.assertIn('/api/media/',(R/'frontend/components/LivePropertyGallery.tsx').read_text())
if __name__=='__main__':unittest.main()
