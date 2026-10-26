# Automan Star Realty — CMS release and activation

## What this release actually ships

- Protected Go/PostgreSQL CMS document store for the existing public Next.js pages.
- Admin-only draft, publish, revision history, and rollback APIs (no public write permissions).
- Dedicated **/admin** Content Studio for page copy, SEO and image uploads.
- Same-site login using existing `automan_staff` HttpOnly cookie and Redis session; role **admin** required.
- Inline **Edit Page** toolbar on marked public website fields, visible after admin login only.
- Pages wired for CMS: homepage, about, contact, buy, off-plan, commercial, experience; all primary pages have dynamic SEO metadata.
- Header logo and footer heading/email settings. Published public copy falls back to the pre-existing exact hardcoded text if a CMS slot is unset.
- Shared image library uploads persist to the **existing** Hostinger named media volume, not Netlify's ephemeral filesystem.
- CRM leads/properties and existing site styling preserved.

**October 26 follow-up branch:** The page-field inventory now covers homepage slides, service cards, community images, leadership, tour CTA/copy, properties intro, privacy paragraphs, site navigation, business contact/socials and extended about copy. A media picker, alt-text PATCH API/editor and optional browser-side center crop to WebP (16:9 or 1:1) are added. The demo overview is being replaced by authenticated real-data metrics. Check the completion PR and CI before promotion.

**Still not implemented:** graphical editing of rich/3D components, server-side image cropping/optimization (browser-side crop is available), independent admin subdomain, CDN/R2 object storage, scheduled offsite backups, WhatsApp enquiry notifications. These must not be described as complete.

## Before production

- Take encrypted PostgreSQL and media backups and verify recovery plan. SQL migrations 0003 and 0004 are automatically applied when the upgraded Go API starts.
- Do not change existing `deploy/hostinger/.env.production` secrets or run `docker compose down -v`.
- Ensure `api.amsrealty.tech` DNS + valid HTTPS reverse proxy to `127.0.0.1:18080`, otherwise Netlify cannot connect.
- Add server-only Netlify environment `BACKEND_INTERNAL_URL=https://api.amsrealty.tech` in the EXISTING root Next.js site and trigger a production redeploy. Never add `NEXT_PUBLIC_` prefix to this value.
- The repo contains a separate obsolete `frontend/` application. Do not switch Netlify base directory away from repository root.

## Hostinger deployment (operator runs through their authorized SSH shell)

```bash
cd /opt/automan-star-real-estate || exit 1
git pull --ff-only
bash deploy/hostinger/preflight.sh
docker compose --env-file deploy/hostinger/.env.production -f deploy/hostinger/compose.yml -p automanstar-api up -d --build
docker compose --env-file deploy/hostinger/.env.production -f deploy/hostinger/compose.yml -p automanstar-api ps
curl -fsS http://127.0.0.1:18080/health/ready
```

Expected `status: ready`, PostgreSQL and Redis `up`.

## One-time administrator creation

The Go Docker image now also contains a private `/bootstrap` binary. It only inserts a user if the email does not already exist. To avoid putting a password into your shell history:

```bash
cd /opt/automan-star-real-estate
read -rsp 'New CMS admin password (14+ characters): ' BOOTSTRAP_ADMIN_PASSWORD; echo
export BOOTSTRAP_ADMIN_PASSWORD
export BOOTSTRAP_ADMIN_EMAIL='saud@automanstarrealty.com'
docker compose --env-file deploy/hostinger/.env.production -f deploy/hostinger/compose.yml -p automanstar-api run --rm \
  -e BOOTSTRAP_ADMIN_EMAIL -e BOOTSTRAP_ADMIN_PASSWORD --entrypoint /bootstrap api
unset BOOTSTRAP_ADMIN_PASSWORD BOOTSTRAP_ADMIN_EMAIL
```

Do not share the password or server tokens in chat. Bootstrap does not reset passwords for pre-existing accounts.

## Manual acceptance verification

1. Guest visits `/admin`: login form; guests cannot call `PUT /api/cms/admin/home/draft`.
2. Valid non-admin staff logs in: "Access restricted".
3. Admin logs in at `https://automanstarrealty.com/admin`.
4. Homepage editor: set Hero heading, click **Save draft**. Refresh the public homepage: still old published content.
5. **Publish** then refresh homepage: new heading visible; generated SEO title changes on metadata update.
6. Upload a JPEG through Media Library, copy `/api/cms/media/{uuid}` URL into Homepage Hero Image; publish. Check HTTPS load.
7. On public homepage, authorized admin sees **Edit Page**; guest browser has no controls.
8. Admin restores previous published version; verify history increments and public content changes.
9. Verify contact enquiry and property routes have not regressed.
10. Check mobile header, footer, hero animations and 3D page for visual parity.

Note: Content changes are published immediately because Next.js CMS fetches use `cache:'no-store'`, not stale ISR.

## Architecture decisions

CMS fields are typed strings keyed by known templates, not HTML/CSS/JS, preventing the CMS from changing visual structure. Go validates URLs and limits field/document sizes. Every write checks an authenticated admin Redis session; admin API calls are proxied same-origin by Next.js. A separate `/admin` portal is available under the existing website domain; a future `admin.` subdomain would require additional session and DNS configuration.

The existing Go source under `backend/` is authoritative. Keep API exposure private until HTTPS is ready; never open PostgreSQL/Redis to the public internet.
