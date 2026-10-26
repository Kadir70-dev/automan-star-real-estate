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

## VPS administrator bootstrap (after the first rollout and backup)
The runtime image contains a one-shot `/bootstrap` utility built from existing `backend/cmd/bootstrap`. It inserts a new administrator and **will not overwrite** an existing administrator password. Do not put a password into a shell command literal or Git repository. Run only from the designated Hostinger VPS after the database is healthy.

```bash
cd /opt/automan-star-real-estate
read -rp "Administrator email: " CMS_ADMIN_EMAIL
read -rsp "New administrator password (14+ characters): " CMS_ADMIN_PASSWORD; echo
docker compose --env-file deploy/hostinger/.env.production -f deploy/hostinger/compose.yml -p automanstar-api run --rm \
  -e BOOTSTRAP_ADMIN_EMAIL="$CMS_ADMIN_EMAIL" \
  -e BOOTSTRAP_ADMIN_PASSWORD="$CMS_ADMIN_PASSWORD" \
  --entrypoint /bootstrap api
unset CMS_ADMIN_EMAIL CMS_ADMIN_PASSWORD
```

Only do this once with the client's authorization. Real CMS endpoints are inaccessible through the public site until the backend HTTPS proxy and Netlify server-only BACKEND_INTERNAL_URL are configured. The portal's interim same-origin path is `/cms`; the separate admin subdomain is a later deployment concern. Existing static fallback content remains live until first publish.
