# Automan Star Real Estate — Phase 2 Foundation

Includes the existing Phase 1 Next.js UI in `frontend/` and a new Go/PostgreSQL/Redis backend in `backend/`.

## Requirements
Docker + Docker Compose, Node.js 20+, npm. For running Go without Docker: Go 1.23+ and PostgreSQL/Redis.

## Local startup

```bash
cp .env.example .env
# Edit .env; replace POSTGRES_PASSWORD with a strong URL-safe development password.
docker compose up --build -d
curl -i http://localhost:8080/health/live
curl -i http://localhost:8080/health/ready
curl -i http://localhost:8080/api/v1/status
curl -i http://localhost:8080/api/v1/properties
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000/live-properties` to see actual PostgreSQL-backed listings. A newly initialized database returns an empty collection; it does not seed fake listings. Existing `/properties`, enquiries and `/dashboard` retain their browser-local **demo** behavior and are **not yet wired to the database**.

## Backend routes
- `GET /health/live` — process liveness, no dependency checks.
- `GET /health/ready` — verifies PostgreSQL and Redis availability; HTTP 503 when either is unavailable.
- `GET /api/v1/status` — version and phase metadata.
- `GET /api/v1/properties` — read-only published property listings from PostgreSQL, at most 24.

SQL migration `backend/internal/db/migrations/0001_initial.sql` runs at Go API startup, atomically and under a PostgreSQL advisory lock. Includes staff users, properties, media metadata, leads, lead activity, site visits, private document metadata and audit events. Private file bytes are not stored in PostgreSQL. No public writes or authentication endpoints are implemented yet.

## Verification

```bash
docker compose ps
docker compose logs api --tail=100
curl -fsS http://localhost:8080/health/ready
cd backend && go test ./...
cd ../frontend && npm run build
```

## Important limitations
- Docker is not installed in the generation environment, and external Go module downloads were blocked. Go tests, actual migrations, Compose start and frontend build **are not verified** here. Run commands above in an internet-connected development environment.
- `postgres` and `redis` bind only to localhost for local development. Change credentials and enable TLS/managed credentials for deployment.
- `ALLOWED_ORIGINS` is strict origin matching, not a security boundary; authentication/authorization are required before adding write endpoints.
- Never store sensitive real estate documents in public assets or browser localStorage.
- Do not claim the `/live-properties` screen is the final property website: it is a diagnostic integration screen.
- API intentionally requires Redis as part of startup readiness, but Redis is not yet used for real caching/queues.

Next: authentication and RBAC, property CRUD with validation, media object storage, CRM lead APIs, rate limiting, integration tests with disposable PostgreSQL/Redis, then replace demo browser storage in the frontend.


## Phase 2C — Real CRM leads and viewing requests

- Public Next.js `POST /api/crm/leads`, `/api/crm/visits` forward to Go API and require PostgreSQL + Redis availability. Unlike the previous phase, they **do not save form submissions in localStorage**.
- Go public endpoints: `POST /api/v1/leads`, `POST /api/v1/visits`. Public writes enforce validation, JSON body size limits, and Redis-based 6 requests/minute per directly connected IP. Rate limit requires correct reverse-proxy IP policy before production; currently suitable for direct API / Next.js proxy during local development, but all Next.js requests may share the same peer IP in a deployment. Configure trusted-identity aware rate limiting before high-volume launch.
- Secure Go staff endpoints: `GET /api/v1/admin/leads`, `GET /api/v1/admin/visits`, `PATCH /api/v1/admin/leads/{uuid}/status`, `PATCH /api/v1/admin/visits/{uuid}/status`. Protected by `X-Admin-Key` (minimum 24 characters; use `openssl rand -hex 32`).
- Next.js CRM staff pages `/dashboard/leads`, `/dashboard/visits` ask for an independent `CRM_DASHBOARD_PASSWORD` (minimum 20 chars), checked server-side via timing-safe comparison. Secrets are configured in `.env.local` and are never embedded in client JavaScript. This is a **single-team-password interim implementation**, not production staff authentication; add per-user identity, RBAC, auditing, CSRF/session protection and request throttling before putting the CRM online.
- Run `openssl rand -hex 32` twice to create `ADMIN_API_KEY` and `CRM_DASHBOARD_PASSWORD`; put the former in root `.env` and in `frontend/.env.local` (the latter must also be in `frontend/.env.local`).
- Sample property listings still have no DB ID; enquiry/visit records use `property_label`. Once real properties are imported, send a real `property_id` instead. Do not treat sample content as verified listings.
- Site visit records are **requests**, not confirmed appointments. Real availability checks, automated emails/SMS and staff notifications are not part of this milestone.
- The existing dashboard overview, property-management and document-management screens remain browser-local demos.

### Local setup

```bash
cp .env.example .env
# edit .env: POSTGRES_PASSWORD and ADMIN_API_KEY
# Create frontend/.env.local from .env.local.example
# Set BACKEND_INTERNAL_URL=http://localhost:8080
# Set ADMIN_API_KEY to same value as root .env
# Set CRM_DASHBOARD_PASSWORD to a different random 32+ char secret

docker compose up --build -d
cd frontend && npm install && npm run dev
```

Do not put real customer personal information into this prototype on publicly accessible hosts until real staff authentication, anti-spam/abuse and UAE privacy/compliance measures are in place.


## Phase 2D — Staff accounts and PostgreSQL property management

- Staff login: `POST /api/v1/staff/login`; `GET /api/v1/staff/me`; `POST /api/v1/staff/logout`. Opaque Redis-backed 12-hour cookie sessions; PBKDF2-HMAC-SHA256 password hashes (210k iterations), generic invalid credentials, role checked against database on each request.
- Properties: `GET/POST /api/v1/admin/properties`; `PUT /api/v1/admin/properties/{id}`; `PATCH /api/v1/admin/properties/{id}/status`; `DELETE /api/v1/admin/properties/{id}` (soft archive). Admin/manager can write, agent can read. New properties default to `draft`; publication is explicit.
- Frontend property dashboard at `/dashboard/properties` uses same-origin server proxy and HttpOnly cookie. It does not expose the Redis session or database password to client JavaScript.
- Bootstrap first admin **after** Docker database is ready, from the backend project (never through public HTTP):

```bash
cd backend
BOOTSTRAP_ADMIN_EMAIL=admin@example.com BOOTSTRAP_ADMIN_PASSWORD='replace-with-a-strong-unique-password' DATABASE_URL='postgres://automan:YOUR_PASSWORD@localhost:5432/automan?sslmode=disable' go run ./cmd/bootstrap
```

- IMPORTANT: Legacy Phase 2C CRM shared-key endpoints and demo overview remain; do not expose this build to the public Internet as a complete secure CRM until all dashboard routes use session/RBAC.
- HTTPS required in production, and the backend must be behind a trusted HTTPS reverse proxy; cookies need Secure enforced at the proxy edge.
- Real uploads, ownership model, paginated public search, lead reassignment and staff self-service onboarding are not implemented.
- End-to-end verification: Docker Compose, bootstrap, login, create property, publish, public listing, archive, logout.


## Phase 2E — Media and unified staff CRM auth
- CRM endpoints now require the same Redis-backed staff session as properties. The legacy shared-key CRM proxy was removed.
- Property image upload accepts JPEG/PNG/WebP (max 10 MiB), lists media, selects a cover, orders items and deletes media. Only admin/manager may modify.
- Confidential PDF/JPEG/PNG file uploads and downloads require staff role authorization; files reside in a private Docker volume (not a public static directory).
- Uses `MEDIA_DIR=/app/media` in Docker. Storage is **local Docker volume**, NOT S3. Backups and production object storage have not been implemented.
- New endpoints `/api/v1/admin/properties/{id}/media`, `/media/{mediaID}/cover`, `/media/{mediaID}/order`, `/api/v1/admin/properties/{id}/documents`, `/api/v1/admin/documents/{id}/download`.
- The old `/api/admin/*` Next.js routes have been replaced by `/api/staff/*` routes with cookie forwarding.
- Security caveats: CSRF protection on Go mutations, advanced file-content validation/virus scanning, encryption-at-rest, storage quotas, per-property granular permissions, production hardening and live integration tests remain necessary.

### Local Phase 2E smoke tests
1. Run `docker compose up --build -d` with your project `.env`.
2. Log in at `/dashboard/properties` using a bootstrapped account.
3. Create a draft property. Select it in **Property media & private documents**.
4. Upload JPEG/PNG/WebP, select cover, change order, delete.
5. Upload a *test-only* PDF and confirm unauthorized download returns 401 and authorized download succeeds.
6. Check `/dashboard/leads` and `/dashboard/visits` with the same staff login, without entering an additional dashboard password.
7. Confirm agent role cannot upload media or confidential documents.

**Not production ready**: No verified frontend build or live database test; server uploads are on local Docker storage with no backup, malware scanning, file recompression, at-rest encryption, granular document ACL or CSRF token verification. Do not store customer ID documents yet.


## Phase 2F security and verification delta

- Added cross-origin and Fetch Metadata rejection for browser mutation requests on the Go API; allowed origins must include browser frontend origin.
- Added X-Content-Type-Options, X-Frame-Options and Referrer-Policy security headers.
- Validate JPEG/PNG image structure before accepting uploads. WebP uses header validation only; **full WebP decoding and malware scanning remain outstanding**.
- Locked down API container with `no-new-privileges`, dropped Linux capabilities, read-only root filesystem, and bounded `/tmp` tmpfs (media remains on a writable private volume).
- Added focused CSRF/security unit tests. Run `cd backend && go mod tidy && go test ./...` when dependency downloads are available.

### Critical outstanding before production

1. **The project has no verified database integration tests or browser QA in this runtime.** Confirm login, CRUD, media upload, leads and visits using real PostgreSQL/Redis with Docker Compose.
2. The repo lacks a committed go.sum; run `go mod tidy` in a networked environment and commit checksums.
3. Image malware scanning, WebP full decoding, content moderation, S3 storage, offsite backups and backup/restore drill remain open.
4. Add authentication brute-force limits with reliable client identification behind trusted reverse proxy; test session invalidation and staff role changes.
5. Audit frontend session forwarding, CSRF handling and all sensitive documents before connecting real customer data.
6. Existing conceptual UI may contain demo listings; do not treat them as confirmed inventory.

This is a **hardening increment**, not production certification.
