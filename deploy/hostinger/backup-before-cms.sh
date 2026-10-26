#!/usr/bin/env bash
# Creates local, owner-only database and media backups without changing running services.
# Also copy backups off the VPS to durable encrypted storage before production acceptance.
set -euo pipefail
umask 077
cd "$(dirname "$0")/../.."
export COMPOSE_PROJECT_NAME=automanstar-api
ENV_FILE=deploy/hostinger/.env.production
COMPOSE=deploy/hostinger/compose.yml
if [[ ! -f "$ENV_FILE" ]]; then echo "Missing private .env.production" >&2; exit 1; fi
if ! docker compose --env-file "$ENV_FILE" -f "$COMPOSE" -p automanstar-api ps --status running --services | grep -Fxq postgres; then
  echo "PostgreSQL container not running; refusing backup" >&2; exit 1
fi
OUT="${BACKUP_DIR:-/opt/automan-backups}/$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$OUT"
chmod 700 "$OUT"
echo "Creating database dump (do not share it in chat)..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" -p automanstar-api exec -T postgres \
  pg_dump -U automan -d automan -Fc > "$OUT/postgres.dump"
test -s "$OUT/postgres.dump"
# Check that pg_restore recognizes the PostgreSQL custom archive.
docker compose --env-file "$ENV_FILE" -f "$COMPOSE" -p automanstar-api exec -T postgres \
  pg_restore --list < "$OUT/postgres.dump" >/dev/null
echo "Creating private media volume archive..."
docker run --rm --network none \
  --mount type=volume,source=automanstar-api_media_data,target=/media,readonly \
  --mount type=bind,source="$OUT",target=/backup \
  alpine:3.21 tar -czf /backup/media.tar.gz -C /media .
test -s "$OUT/media.tar.gz"
(cd "$OUT" && sha256sum postgres.dump media.tar.gz > SHA256SUMS.txt)
chmod 600 "$OUT"/*
echo "Local backup verified at $OUT"
echo "REQUIRED: make a separate encrypted off-site copy; test restoring on a disposable instance."
