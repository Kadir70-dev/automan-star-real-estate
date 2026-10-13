# Phase 2F test-driven checkpoint

This milestone adds repeatable offline structural regression checks, Go AST syntax validation, a live API smoke script, and build/test runner. **Do not treat these checks as proof of functional or production security.**

## Local developer commands

```bash
bash scripts/verify.sh
# on machine with Go module access, Node dependencies and Docker:
cp .env.example .env # supply real secrets
cp frontend/.env.local.example frontend/.env.local
# configure envs, then:
docker compose up --build -d
RUN_NETWORK_TESTS=1 bash scripts/verify.sh
```

Important: `package-lock.json` is not included, so the runner uses `npm install`. Commit a lockfile and replace this with `npm ci` for reproducible release builds.

## Known release blockers

- Complete Go dependency resolution and test suite execution
- Frontend install/build and verified browser tests
- Docker and Postgres/Redis migrations integration
- Real authenticated property CRUD/media, CRM, and site visit tests
- Real backup/restore and secret rotation validation
- File antivirus / robust image decoder, secure proxy origin / CSRF end-to-end verification
- Production secure object storage & threat-model review

Changes in this checkpoint: remove legacy X-Admin-Key CORS allowance, prevent unpublished media from receiving public cache headers, add offline Go syntax and structural tests, add non-destructive live smoke script.
