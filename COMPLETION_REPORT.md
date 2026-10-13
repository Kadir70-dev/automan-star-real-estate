# Automan Star — integration work performed

## Implemented in this checkpoint
- Added a public Go API for a **single published property**, including safe public fields and published property image metadata. Drafts and archived listings are not retrievable through this endpoint.
- Connected the primary `/properties` page to PostgreSQL-backed published inventory via server-side Go API fetch, with keyword, buy/rent/lease, and price-sort controls.
- Added real-data property detail pages at `/properties/[slug]`, with property specifications, image gallery, and enquiry form.
- Kept illustrative sample listings and demo details separately at `/demo-properties` and `/demo-properties/[slug]`; homepage concept cards now route there instead of causing missing real listing errors.
- Added source integration checks for public-only inventory, separate demo routing, detail API usage, and media proxy links.

## Tests actually run here
- 6 existing structure tests: passed.
- 4 existing regression checks: passed.
- 5 new source integration tests: passed.
- Go parser: 15 files syntax-parsed (not compiled).
- TypeScript syntax transpilation: see associated tool verification. This is not Next.js compilation.

## Release blockers — not complete
- `npm install` timed out; production Next.js build and TypeScript typecheck could not be run.
- Go dependency download and `go test ./...` have not passed.
- Docker executable is missing in this environment: PostgreSQL, Redis, migrations and browser E2E tests are not verified.
- Public listing API still returns a maximum of 24 results, without server-side pagination.
- Customer enquiries currently associate with the property title only; they are not linked through a validated property UUID end to end.
- Live media URL access and security permissions require production browser and authenticated-user testing.
- No live maps, off-plan rich data, S3 backups/malware scanning, production deployment, or penetration test.

## Local release checks
```bash
cp .env.example .env
cd backend && go mod tidy && go test ./... && go vet ./... && cd ..
docker compose up --build -d
bash scripts/smoke.sh
cd frontend && npm install && npm run build
```

Do not use actual client data or expose this system publicly until security and integration testing passes.
