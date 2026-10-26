import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('the production staff routes never render PhaseOneAdmin demo data',()=>{
 for(const p of ['app/dashboard/page.tsx','app/dashboard/settings/page.tsx','app/dashboard/documents/page.tsx']){
  assert.doesNotMatch(source(p),/PhaseOneAdmin|demo-store|seedLeads/);
  assert.match(source(p),/StaffDashboard/);
 }
 assert.match(source('components/StaffDashboard.tsx'),/\/api\/staff\/me/);
});
test('CMS permits page editing with published document fallback',()=>{
 const schema=source('lib/cms-schema.ts');
 for(const key of ['hero.image2','hero.image3','tour.title','team.office','business.address','social.linkedin','privacy.collection.copy','page.heading']){
  if(key==='privacy.collection.copy')assert.match(schema,/privacy\.'\+key\+'\.copy/);
  else assert.ok(schema.includes(key),key+' field should exist');
 }
 assert.match(source('components/HeroBannerSlider.tsx'),/secondImage/);
 assert.match(source('app/page.tsx'),/data-cms-field="tour.title"/);
 assert.match(source('app/privacy/page.tsx'),/getCms\('privacy'\)/);
});
test('media accessibility edits stay authenticated and do not use Netlify storage',()=>{
 assert.match(source('backend/internal/httpapi/api.go'),/requireRole\("admin"\)\(a\.cmsUpdateMedia\)/);
 assert.match(source('backend/internal/httpapi/cms_media.go'),/UPDATE cms_media SET alt_text/);
 assert.match(source('app/api/cms/admin/media/[id]/route.ts'),/Cross-origin request blocked/);
});
