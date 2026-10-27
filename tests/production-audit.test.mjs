// Regression tests for defects found in the 2026-10-27 production audit.
import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {sameSiteSource,withSource} from '../lib/crm-relay.ts';

test('no loading boundary sits above /properties/[slug] (unknown and archived slugs must return HTTP 404)',()=>{
 assert.equal(existsSync('app/properties/loading.tsx'),false);
 assert.ok(existsSync('app/properties/(listing)/page.tsx'));
 assert.equal(existsSync('app/properties/[slug]/loading.tsx'),false);
 assert.match(readFileSync('app/properties/[slug]/page.tsx','utf8'),/notFound\(\)/);
});

test('public-page CMS editor probes the session without a 401',()=>{
 assert.match(readFileSync('components/CmsInlineEditor.tsx','utf8'),/\/api\/staff\/session/);
 const relay=readFileSync('app/api/staff/[...path]/route.ts','utf8');
 assert.match(relay,/path\[0\]==='session'&&req\.method==='GET'/);
 assert.match(relay,/staff:null/);
});

test('property enquiries carry the property ID and reference',()=>{
 assert.match(readFileSync('app/properties/[slug]/page.tsx','utf8'),/propertyId=\{p\.id\}/);
 const form=readFileSync('components/Enquiry.tsx','utf8');
 assert.match(form,/property_id:propertyId/);
 assert.match(form,/if\(sending\.current\)return;sending\.current=true/);
});

test('source page is only recorded for same-site referers, without query strings',()=>{
 const site='https://automanstarrealty.com';
 assert.equal(sameSiteSource(site+'/properties/x?utm=1#top',site),site+'/properties/x');
 assert.equal(sameSiteSource('https://evil.example/',site),null);
 assert.equal(sameSiteSource('not a url',site),null);
 assert.equal(sameSiteSource(null,site),null);
});

test('source note is appended to the message and respects the CRM length limit',()=>{
 const out=JSON.parse(withSource(JSON.stringify({name:'QA',message:'Hello'}),'https://automanstarrealty.com/contact'));
 assert.equal(out.message,'Hello\n\nSource page: https://automanstarrealty.com/contact');
 assert.equal(JSON.parse(withSource('{"name":"QA"}','https://a.b/c')).message,'Source page: https://a.b/c');
 assert.ok(JSON.parse(withSource(JSON.stringify({message:'x'.repeat(5000)}),'https://a.b/c')).message.length<=3000);
 assert.equal(withSource('{"bad"','https://a.b/c'),'{"bad"');
 assert.equal(withSource('{"message":5}','https://a.b/c'),'{"message":5}');
 assert.equal(withSource('{"x":1}',null),'{"x":1}');
});

test('site responses carry baseline security headers',()=>{
 const s=readFileSync('next.config.ts','utf8');
 for(const h of ['X-Frame-Options','Referrer-Policy','Permissions-Policy','Content-Security-Policy'])assert.match(s,new RegExp(h));
 assert.match(s,/frame-ancestors 'self'/);
 assert.doesNotMatch(s,/script-src/,'a script-src policy needs a nonce plan before it can ship');
});
