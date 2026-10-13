# Ubuntu test handoff — 14 October 2026

## Executed on available Linux (Debian 13)
- 6 structural offline checks passed
- 4 source regression checks passed
- Go syntax parser passed 15 source files
- `GOPROXY=off go test ./...` blocked by absent `backend/go.sum` and missing cached pgx/Redis modules.
- `npm run build` failed with `next: not found` because `node_modules` is not installed.
- Docker executable not available, and npm registry DNS resolution fails in the local environment.

## Added
`.github/workflows/ci-ubuntu.yml`: Ubuntu 24.04 GitHub Actions workflow for Go dependencies/tests/vet, npm install/Next.js build, Docker Compose + API smoke test. **Not executed on GitHub**. CI is a proposed remote verification path; a GitHub repo and connected runner are required.

## How to run on free hosted Ubuntu
1. Push this source to a repository under your GitHub account (do not commit production `.env` secrets).
2. Open **Actions → Automan Ubuntu CI → Run workflow**, or push a new commit.
3. Inspect each step's pass/fail output. Do not launch publicly until tests, browser UX QA, auth, uploads, DB migrations, and backup/restore are independently verified.

GitHub Actions hosted runners are free for standard runners in public repos; private repositories are subject to account minutes/billing limits. Avoid making private code public solely to avoid compute costs.
