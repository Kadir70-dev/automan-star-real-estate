#!/usr/bin/env bash
# Run AFTER docker compose up --build -d. Non-destructive route/status/security checks.
set -euo pipefail
BASE="${API_BASE_URL:-http://localhost:8080}"
check() { local path="$1" expected="$2" actual; actual=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 10 "$BASE$path");
 echo "$path -> $actual (expected $expected)"; test "$actual" = "$expected"; }
check /health/live 200
check /health/ready 200
check /api/v1/admin/leads 401
check /api/v1/admin/visits 401
check /api/v1/admin/properties 401
check /api/v1/admin/properties/not-a-uuid/media 401
check /api/v1/admin/documents/not-a-uuid/download 401
check /api/v1/status 200
check /api/v1/properties 200
printf 'PASS: basic health + unauthorized-access checks. Full DB CRUD requires an authenticated integration test.\n'
