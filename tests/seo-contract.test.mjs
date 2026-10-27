// Lightweight source-level SEO regression checks for the actual deployed
// root Next.js app. These complement, but do not replace, HTTP crawl tests.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('all SEO URLs use the canonical production domain',()=>{
 const seo=source('lib/seo.ts');
 const layout=source('app/layout.tsx');
 assert.match(seo,/SITE_URL\s*=\s*['"]https:\/\/automanstarrealty\.com['"]/);
 assert.match(seo,/OG_IMAGE\s*=\s*\{url:\s*['"]\/og-image\.jpg['"]/);
 assert.match(layout,/metadataBase:\s*new URL\(SITE_URL\)/);
 assert.match(layout,/GOOGLE_SITE_VERIFICATION/);
});

test('sitemap contains public routes but excludes internal and sample content',()=>{
 const sitemap=source('app/sitemap.ts');
 const paths=[...sitemap.matchAll(/\[['"](\/[^'"]*)['"],\s*(?:0\.\d+|1)\]/g)].map(match=>match[1]);
 const publicPaths=['/','/buy','/off-plan','/commercial','/properties','/about','/contact','/experience','/privacy'];
 for(const path of publicPaths) assert.ok(paths.includes(path),`Public route missing in sitemap: ${path}`);
 for(const path of ['/dashboard','/demo-properties','/saved','/compare','/live-properties'])
  assert.ok(!paths.includes(path),`Private or concept route unexpectedly indexed: ${path}`);
 assert.match(sitemap,/getLiveProperties\(\)/);
});

test('robots.txt leaves noindex-marked routes crawlable',()=>{
 const robots=source('app/robots.ts');
 assert.match(robots,/disallow:\s*\[\s*['"]\/api\/['"]\s*\]/);
 assert.match(robots,/sitemap:\s*`\$\{SITE_URL\}\/sitemap\.xml`/);
 for(const path of ['dashboard','demo-properties','saved','compare','live-properties'])
  assert.ok(!robots.includes(`/${path}/`)&&!robots.includes(`'/${path}'`),`robots policy blocks ${path}`);
});

test('demo, account-related and internal pages remain noindex',()=>{
 const noindex=source('lib/seo.ts');
 assert.match(noindex,/NOINDEX:[^\n]*=\s*\{index:false,follow:true\}/);
 for(const page of [
  'app/demo-properties/page.tsx',
  'app/demo-properties/[slug]/page.tsx',
  'app/saved/page.tsx',
  'app/compare/page.tsx',
  'app/live-properties/page.tsx',
 ]){
  assert.match(source(page),/robots:\s*NOINDEX/,`${page} must stay noindex`);
 }
 assert.match(source('app/dashboard/layout.tsx'),/robots:\s*\{index:false/);
 assert.match(source('app/properties/[slug]/page.tsx'),/index:false/);
});

test('public service pages provide route-specific metadata',()=>{
 for(const [page,route] of [
  ['app/buy/page.tsx','/buy'],
  ['app/off-plan/page.tsx','/off-plan'],
  ['app/commercial/page.tsx','/commercial'],
  ['app/about/page.tsx','/about'],
  ['app/contact/page.tsx','/contact'],
  ['app/properties/(listing)/page.tsx','/properties'],
  ['app/privacy/page.tsx','/privacy'],
 ]){
  const content=source(page);
  assert.ok(content.includes(`path:'${route}'`),`Missing canonical metadata for ${route}`);
  assert.ok(content.includes('description:'),`Missing description for ${route}`);
 }
});
