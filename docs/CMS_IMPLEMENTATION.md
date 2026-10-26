# Automan Star Realty CMS — Option A (design unchanged)

## Goal
Separate Admin Portal plus admin-only inline edit mode, using fixed public Next.js components and new Go/PostgreSQL CMS endpoints. No page builder or arbitrary HTML/CSS editing.

## Existing
Production VPS on Hostinger runs Go, PostgreSQL, Redis on loopback 127.0.0.1:18080. Public Next.js is on Netlify. API HTTPS and Netlify BACKEND_INTERNAL_URL connection still need verification. Existing dashboard mixes real property admin and insecure local browser-only demo areas: do not use demo data as production CRM.

## Delivery gates
1. Foundation SQL migration + Go public/admin content API. Guard writes with admin role. Version and audit actions.
2. Next.js server-only CMS proxy and data access layer, no client-side admin credentials.
3. Replace existing text/images/SEO via typed per-component fields with exact visual parity and hardcoded fallback.
4. Admin portal with session-bound authentication and drafts, media library, settings, pages.
5. Inline edit mode (admin-only controls) using same forms and publishing APIs.
6. Production: media persistence, backup+restore, HTTPS proxy, Netlify environment integration, test role isolation and XSS, cache refresh and visual screenshots.

## Security
Never expose /api/v1/cms/admin/* directly without session. Never pass arbitrary code into JSX or metadata. Use immutable revision snapshots and concurrency checks. All media uploads require MIME/size checking and trusted storage. Preview must never leak draft to anonymous visitors.
