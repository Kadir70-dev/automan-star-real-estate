#!/usr/bin/env python3
"""Offline source regressions; these are NOT a substitute for compiling or browser tests."""
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parent.parent
class SourceRegressions(unittest.TestCase):
    def test_filter_dependencies(self):
        src=(ROOT/'frontend/components/PropertiesClient.tsx').read_text()
        self.assertIn('[purpose,location,type,max,sort,keyword,minBeds]',src)
    def test_staff_proxy_blocks_cross_site_mutations(self):
        src=(ROOT/'frontend/app/api/staff/[...path]/route.ts').read_text()
        self.assertIn("req.headers.get('sec-fetch-site')==='cross-site'",src)
        self.assertIn('origin!==new URL(req.url).origin',src)
    def test_demo_listing_disclosure(self):
        src=(ROOT/'frontend/components/PropertiesClient.tsx').read_text()
        self.assertIn('Demo data only',src)
    def test_public_property_query_only_published(self):
        src=(ROOT/'backend/internal/httpapi/api.go').read_text()
        self.assertIn("WHERE publish_status='published'",src)
if __name__=='__main__': unittest.main(verbosity=2)
