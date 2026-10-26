#!/usr/bin/env bash
# Local-only Hostinger VPS checks; never prints secrets or edits infrastructure.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FILE="${1:-$ROOT/deploy/hostinger/.env.production}"
if [[ ! -f "$FILE" ]]; then
  echo "BLOCKED: missing private deploy/hostinger/.env.production file" >&2
  exit 2
fi
[[ -r "$FILE" ]] || { echo "BLOCKED: deployment env is not readable" >&2; exit 2; }
command -v docker >/dev/null || { echo "BLOCKED: Docker is missing" >&2; exit 2; }
docker compose version >/dev/null || { echo "BLOCKED: Docker Compose v2 is missing" >&2; exit 2; }

field() {
  # Parse simple KEY=VALUE values only. Never source arbitrary env file commands.
  local name="$1" raw
  raw="$(sed -n "s/^${name}=//p" "$FILE" | tail -1)"
  raw="${raw%$'\r'}"
  if [[ "${raw:0:1}" == '"' && "${raw: -1}" == '"' ]] || [[ "${raw:0:1}" == "'" && "${raw: -1}" == "'" ]]; then raw="${raw:1:${#raw}-2}"; fi
  printf '%s' "$raw"
}
password="$(field POSTGRES_PASSWORD)"
key="$(field ADMIN_API_KEY)"
origins="$(field ALLOWED_ORIGINS)"
port="$(field AUTOMAN_API_LOOPBACK_PORT)"
port="${port:-18080}"
fail=0
if [[ ! "$password" =~ ^[a-fA-F0-9]{64}$ ]]; then echo "ERROR: POSTGRES_PASSWORD must be 64 hex chars (openssl rand -hex 32)" >&2; fail=1; fi
if [[ ! "$key" =~ ^[a-fA-F0-9]{64}$ ]]; then echo "ERROR: ADMIN_API_KEY must be an independent 64 hex chars" >&2; fail=1; fi
if [[ -z "$origins" ]] || [[ "$origins" == *'localhost'* ]] || [[ "$origins" != *'https://automanstarrealty.com'* ]]; then
  echo "ERROR: ALLOWED_ORIGINS must include the exact production HTTPS frontend origin (no localhost)" >&2; fail=1
fi
if [[ ! "$port" =~ ^[0-9]{4,5}$ ]] || ((10#$port < 1024 || 10#$port > 65535)); then echo "ERROR: invalid AUT0MAN loopback port" >&2; fail=1; fi
if ((fail)); then echo "Preflight blocked deployment; no changes made." >&2; exit 1; fi
# Compose config validates environment substitutions but does not start services.
docker compose --project-directory "$ROOT" --env-file "$FILE" -f "$ROOT/deploy/hostinger/compose.yml" config -q
echo "Hostinger API config PASS; no services, network or DNS were changed."
echo "Next: inspect docker ps/ports and Caddy/Nginx config before running the production deploy."
