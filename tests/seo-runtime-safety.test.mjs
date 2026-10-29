import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Netlify keeps Next.js SSR and 404 routing under the framework runtime',()=>{
 const netlify=read('netlify.toml');
 assert.match(netlify,/command\s*=\s*"npm run build"/);
 assert.match(netlify,/publish\s*=\s*"\.next"/);
 assert.doesNotMatch(netlify,/from\s*=\s*["']\/\*["']/,'SPA catch-all must not take precedence over SSR and API routing');
 assert.doesNotMatch(netlify,/to\s*=\s*["']\/index\.html["']/,'No SPA index.html rewrite in the Next.js hybrid app');
});

test('sitemap includes only complete, unique, non-rental live listings',()=>{
 const sitemap=read('app/sitemap.ts');
 assert.match(sitemap,/getLiveProperties\(\)/);
 assert.match(sitemap,/p\.title\?\.trim\(\)/);
 assert.match(sitemap,/p\.community\?\.trim\(\)/);
 assert.match(sitemap,/p\.emirate\?\.trim\(\)/);
 assert.match(sitemap,/p\.listing_type\?\.toLowerCase\(\)\s*===\s*'rent'/);
 assert.match(sitemap,/seen\.has\(url\)/);
 assert.match(sitemap,/seen\.add\(url\)/);
 assert.doesNotMatch(sitemap,/lastModified:\s*new Date\(\)/,'Do not invent freshness timestamps');
});
