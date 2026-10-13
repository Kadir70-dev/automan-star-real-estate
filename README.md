# Automan Star Real Estate

Premium Dubai/UAE real-estate website and property-management platform.

**Stack:** Next.js/TypeScript/Three.js frontend; Go API; PostgreSQL; Redis; Docker Compose.

## Current repository status

The initial repository configuration has been committed. **The complete application source has not yet been committed**. The latest source archive is available in the associated ChatGPT project conversation as `automan-star-ubuntu-ci-checkpoint.zip`. Do not mistake this repository for a fully tested production release.

## Import the source archive

Extract the archive, open its `automan-star/` directory and commit its contents at the root of this repository. Never commit actual `.env` secrets, database dumps, customer data, or `node_modules`.

## Validate after import

```bash
bash scripts/verify.sh
cd backend && go mod tidy && go test ./... && go vet ./...
cd ../frontend && npm install && npm run build
cd .. && docker compose up --build -d
bash scripts/smoke.sh
```

Production readiness still requires end-to-end PostgreSQL/Redis testing, security review, backups, and a successful build.
