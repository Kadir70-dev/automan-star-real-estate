import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('business metadata and structured data use CMS overrides',()=>{
 const seo=file('lib/seo.ts'),layout=file('app/layout.tsx');
 assert.match(seo,/siteJsonLd\(overrides:Record<string,string>/);
 assert.match(seo,/business\.name/);
 assert.match(seo,/social\.linkedin/);
 assert.match(layout,/siteJsonLd\(site\.fields\)/);
 assert.match(layout,/export async function generateMetadata/);
});
test('image cropping is opt-in and preserves original by default',()=>{
 const admin=file('components/admin/MediaManager.tsx');
 assert.match(admin,/useState<'original'\|'wide'\|'square'>\('original'\)/);
 assert.match(admin,/canvas\.toBlob/);
 assert.match(admin,/Image upload mode/);
});
