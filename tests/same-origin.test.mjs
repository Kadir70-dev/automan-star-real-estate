import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Every state-changing relay must use the shared guard, which accounts for Netlify's
// permalink req.url (a direct new URL(req.url).origin comparison blocked the live domain).
const routes=['app/api/staff/[...path]/route.ts','app/api/cms/[...path]/route.ts','app/api/cms/admin/media/route.ts','app/api/cms/admin/media/[id]/route.ts','app/api/leads/consultation/route.ts','app/api/crm/leads/route.ts','app/api/crm/visits/route.ts'];
test('relay routes use the shared same-origin guard',()=>{
 for(const r of routes){const s=readFileSync(r,'utf8');assert.match(s,/isSameOrigin\(/,r);assert.doesNotMatch(s,/origin!==new URL\((req|request)\.url\)\.origin/,r);}
});
test('guard compares Origin with the forwarded public host',()=>{
 const s=readFileSync('lib/same-origin.ts','utf8');
 assert.match(s,/x-forwarded-host/);assert.match(s,/sec-fetch-site/);
});
