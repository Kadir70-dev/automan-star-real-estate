# AUT​​OMAN STAR — stabilization checkpoint

## Code changes
- Corrected missing `keyword` and `minBeds` dependencies in the property-search `useMemo`; previously typing into these controls could leave results stale.
- Added `Sec-Fetch-Site: cross-site` rejection for mutation requests in the Next.js staff API proxy, alongside the existing Origin check. This is a defense-in-depth measure, **not** a complete CSRF security assessment.
- Added four source-level regression tests and expanded non-destructive Docker smoke checks.

## Release blockers
- Go dependency download, compilation and unit tests must pass.
- `npm install`, TypeScript/Next.js build, lint and real browser QA must pass.
- Live Docker/PostgreSQL/Redis migration and staff CRUD/media/customer lead journey tests must pass.
- Public `/properties` remains DEMO listings, whereas `/live-properties` reads PostgreSQL. These must be unified before release.
- Full document permission audit, file upload hardening and backup/restore testing still pending.

## Run locally
```bash
bash scripts/verify.sh
# On a network-enabled host:
RUN_NETWORK_TESTS=1 bash scripts/verify.sh
```
Do not deploy real client data yet.
