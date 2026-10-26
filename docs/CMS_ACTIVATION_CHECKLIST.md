# Automan CMS activation: Hostinger + Netlify

Canonical CMS implementation was merged via PR #7 to `main`. The backend API is already verified healthy on Hostinger at `127.0.0.1:18080` for the older release. Never expose Postgres/Redis or replace the frontend's Netlify domain.

## Gate 1: Backup before modifying live database
From authorized SSH on the designated VPS `srv2093533`:
```bash
cd /opt/automan-star-real-estate
git fetch origin main
git status --short
# Take backup of currently running services *before* pulling the new source.
# On existing release, the backup script may not exist yet, so obtain that script separately,
# or take a manual pg_dump and media volume snapshot before updating.
```

For an existing checkout with this script, run:
```bash
bash deploy/hostinger/backup-before-cms.sh
```
This is a **local** backup only. Make a verified **encrypted off-site** copy. Do not run `docker compose down -v`.

## Gate 2: Rebuild the CMS backend after verifying backup
```bash
cd /opt/automan-star-real-estate
git pull --ff-only
bash deploy/hostinger/preflight.sh
docker compose --env-file deploy/hostinger/.env.production -f deploy/hostinger/compose.yml -p automanstar-api up -d --build
curl -fsS http://127.0.0.1:18080/health/ready
```
The Go service applies additive migrations 0003 and 0004 on startup.

## Gate 3: HTTPS API
- Confirm owner approval, authoritative DNS and no existing reverse proxy on ports 80/443.
- Create A record `api` in the **authoritative** `amsrealty.tech` DNS zone to the VPS's confirmed IP.
- Enable TCP 80 and 443 on Hostinger's VPS firewall, maintaining SSH access.
- If a reverse proxy exists, modify it safely instead; do NOT start another one.
- On a clean VPS with no proxy and after DNS resolves, run the optional Caddy overlay:
```bash
docker compose --env-file deploy/hostinger/.env.production \
  -f deploy/hostinger/compose.yml -f deploy/hostinger/compose.https.yml \
  -p automanstar-api up -d
curl -fsS https://api.amsrealty.tech/health/ready
```

## Gate 4: Existing Netlify site
In Netlify for the **existing root Next.js website**, set server-only env:
```dotenv
BACKEND_INTERNAL_URL=https://api.amsrealty.tech
```
Do NOT use `NEXT_PUBLIC_`. Redeploy root Next.js, not the obsolete `frontend/` app. Do not change the public root domain DNS.

## Gate 5: Admin and acceptance
Create first administrator using docs/CMS_RELEASE.md one-shot `/bootstrap` instructions. Admin portal at `https://automanstarrealty.com/admin`, with signed-in admin-only inline Edit Page.
Verify draft not visible publicly, publish visible, revisions rollback, SEO title/description, image upload, website form lead retention, and existing styling. Keep CMS inaccessible externally until TLS and session tests pass.
