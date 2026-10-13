#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python3 scripts/verify_offline.py
python3 scripts/test_source_regressions.py
(cd backend && gofmt -l ./cmd ./internal | tee /tmp/automan-gofmt-report; test ! -s /tmp/automan-gofmt-report)
GO111MODULE=off go run scripts/parse_go.go -- backend
if [ "${RUN_NETWORK_TESTS:-0}" = 1 ]; then
 (cd backend && go mod tidy && go test ./... && go vet ./...)
 (cd frontend && npm install && npm run lint && npm run build)
 bash scripts/smoke.sh
else
 echo 'SKIPPED: Go dependency tests, frontend build and Docker smoke. Set RUN_NETWORK_TESTS=1 on a configured machine.'
fi
