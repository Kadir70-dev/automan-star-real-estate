# Automan Star Realty — Hostinger backend release

**Source:** `Kadir70-dev/automan-star-real-estate`, root Next.js app at
`https://automanstarrealty.com`, backend Go/PostgreSQL/Redis at `backend/`.

**Access identified:** the Hostinger collaboration invitation covers VPS
`srv2093533.hstgr.cloud` and domain `amsrealty.tech`; it does **not**
establish access to the DNS zone for `automanstarrealty.com`. Do not use an
unrelated VPS from another Hostinger account. Invite/collaborator access in
hPanel does not automatically grant ChatGPT SSH or VPS shell access.

This stack is designed **not to interfere with any existing sites on that
Hostinger machine**. It publishes its API only on `127.0.0.1:18080` and does
not publish PostgreSQL, Redis, or HTTP(S) ports 80/443.

## 1. Read-only server inventory first

In Hostinger `hPanel → VPS → srv2093533 → Manage → Browser Terminal`
(or SSH with your own authorized credentials), inspect:

```bash
hostname
id
docker --version
docker compose version
docker ps --format 'table {{.Names}}\t{{.Ports}}\t{{.Status}}'
sudo ss -lntp | grep -E ':(80|443|18080|5432|6379)[[:space:]]' || true
```

Verify that this VPS is designated for Automan Star Realty, Docker is
installed, that `18080` is unoccupied, and whether Caddy/Nginx/Traefik
already controls 80/443. **Do not stop/remove existing containers or
overwrite a reverse proxy to make space.**

## 2. Prepare secrets (only in private VPS files)

```bash
git clone https://github.com/Kadir70-dev/automan-star-real-estate.git
cd automan-star-real-estate
cp deploy/hostinger/env.example deploy/hostinger/.env.production
chmod 600 deploy/hostinger/.env.production
openssl rand -hex 32  # paste into POSTGRES_PASSWORD in the private file
openssl rand -hex 32  # use a DIFFERENT value for ADMIN_API_KEY
${EDITOR:-nano} deploy/hostinger/.env.production
```

The file is gitignored and must never be committed, sent in chat, put
in Netlify browser variables, or printed to logs. Use only URL-safe hex
for `POSTGRES_PASSWORD` since Compose embeds it in `DATABASE_URL`.

## 3. Local preflight and deploy to loopback

```bash
bash deploy/hostinger/preflight.sh
docker compose --env-file deploy/hostinger/.env.production \
  -f deploy/hostinger/compose.yml -p automanstar-api up -d --build
docker compose --env-file deploy/hostinger/.env.production \
  -f deploy/hostinger/compose.yml -p automanstar-api ps
curl -fsS http://127.0.0.1:18080/health/live
curl -fsS http://127.0.0.1:18080/health/ready
curl -fsS http://127.0.0.1:18080/api/v1/properties
```

The Go API applies SQL migrations on startup. A new database will return
**zero published listings** until a staff user creates and publishes them.
The named PostgreSQL/Redis/media volumes must survive redeploys.

Never run `docker compose down -v`, `docker system prune --volumes`, or
overwrite live database files. Plan **encrypted off-site database and private
media backups**, an actual restore drill, and disk/uptime monitoring before
accepting real customer submissions.

## 4. Publish through existing HTTPS proxy only after checking conflicts

Use a controlled API hostname such as `api.amsrealty.tech` (example,
not an existing verified record). Add the DNS A/AAAA record only after
verifying its ownership and the VPS's public IP with the owner. If this
VPS already has a working Nginx/Caddy/Traefik proxy, add a **new dedicated
host rule** forwarding `api.amsrealty.tech` to `127.0.0.1:18080`.
An example Caddy site fragment is `api.caddy.example`, but **do not
replace its current configuration** or bind 80/443 twice. Issue and
validate HTTPS certificates.

```bash
curl -fsS https://api.amsrealty.tech/health/ready
```

Do **not** point `automanstarrealty.com` to the VPS: the frontend stays
on Netlify.

## 5. Connect the live root Next.js app on Netlify

In the existing Netlify site settings, add the **server-side** environment
variable (not `NEXT_PUBLIC_*`):

```dotenv
BACKEND_INTERNAL_URL=https://api.amsrealty.tech
```

This is a **sample** until the API DNS and TLS are verified. Redeploy the
existing root Next.js app from its current production source; do **not**
deploy the obsolete `frontend/` directory or overwrite live content.
The server routes `/api/crm/leads`, `/api/crm/visits`,
`/api/staff/*` and the consultation popup can now reach Go.

Use disposable test submissions for: enquiry → saved lead → admin dashboard;
visit request → saved visit; login → role check; published listing → public
property detail. Check HTTP responses and staff cookie handling. Do not
claim production lead capture is operational until this full path passes.

**Per-visitor rate limiting:** the Redis limiter keys on the socket peer
unless the request carries the shared relay secret. Generate one value
(`openssl rand -hex 32`) and set it as `TRUSTED_PROXY_SECRET` in
`.env.production` and as the server-only Netlify variable
`BACKEND_PROXY_SECRET`. The Next.js relay then sends Netlify's
`x-nf-client-connection-ip`, so each visitor gets their own
6-requests/minute bucket. `X-Forwarded-For` is never trusted.
Also verify Netlify Forms fallback and CRM do not duplicate alerts.

## 6. Still separate from this deployment

- Resend keys and approved sender + recipient are needed for **email
  notifications**. This repository does not automatically send WhatsApp
  notifications; obtain the approved business number and integration.
- Configure staff account creation using the existing backend bootstrap
  command, with private credentials and an authorized owner.
- Client/legal approval for lead data, consent, retention and notification
  policies, off-site backups, restore drill, TLS, and public HTTPS tests.

No VPS was accessed, DNS modified, Netlify site modified or services
launched by committing these deployment assets to GitHub.
