# Automan Star Realty — SEO Phase 2 release and validation

Canonical production domain: https://automanstarrealty.com

## What this PR changes

- Removes the legacy SPA fallback `/* → /index.html (200)` from Netlify configuration. This is a Next.js 15 SSR/hybrid application using the Netlify Next.js runtime; framework-generated SSR, API, sitemap, robots and 404 routes must not be shadowed by a generic SPA rewrite.
- Prevents the XML sitemap from linking to live properties whose slug, title, community or emirate is missing; removes duplicates and rental listings. Detail-page metadata already marks incomplete records as noindex.
- Adds source-level regression tests. These tests do **not** establish real-world search visibility or live HTTP correctness.

Existing titles/descriptions, canonical URL, OG/Twitter tags, JSON-LD (RealEstateAgent/Organization/WebSite/BreadcrumbList), robots and noindex defaults remain intact.

## Release gate (before merging or deploying)

1. Run `npm ci && npx tsc --noEmit && npx eslint app components lib --quiet && npm test && npm run build`.
2. Preview deploy with Netlify's Next.js runtime and verify SSR routes: `/`, `/buy`, `/off-plan`, `/commercial`, `/properties`, `/about`, `/contact`.
3. Verify `/robots.txt` and `/sitemap.xml` return HTTP 200 with the expected content types.
4. Verify `/definitely-not-a-route-seo-test` returns HTTP **404**, not the homepage with HTTP 200.
5. Verify `/api/not-a-real-route` is NOT rewritten into the homepage HTML.
6. Verify page source has one self-referencing canonical URL and route-specific title and description, and that `/admin` and demo/account pages remain `noindex`.
7. Recheck the door entrance, consultation popup and contact forms after Netlify publish. Preserve the rollback deploy ID.

## Post-release Google Search Console

- Verify a Domain property for `automanstarrealty.com` with domain-owner approval. Do not change DNS without approval.
- Submit `https://automanstarrealty.com/sitemap.xml` under Indexing → Sitemaps after validating it is reachable.
- Inspect `/`, `/buy`, `/off-plan`, `/commercial`, `/properties`, and `/contact` in URL Inspection; record **Crawled**, **Indexed**, **Canonical selected** and sitemap discovery states.
- Monitor Indexing → Pages for soft 404, duplicate canonical, server errors and blocked resources.
- Use Core Web Vitals and PageSpeed Insights on real production URLs, including mobile. A CSS entrance may affect perceived loading even without WebGL.
- Check business identity/address, social profiles and leadership facts against the client's approved details. Do not add unsupported RERA/licence numbers, phone numbers, reviews or rankings.

## Content roadmap (separate client approval)

Publish useful original buying guidance only with verified project and brokerage information: Dubai buying process, costs and due diligence, comparing ready versus off-plan, Business Bay offices, and verified Dubai neighbourhood guides. Do not create invented listings or filler location landing pages.

This is a code/config release checklist; a live website crawl and indexing claims require direct production evidence.
