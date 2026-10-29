#!/usr/bin/env bash
# Smoke-test a Next.js server or Netlify preview. No mutations or authentication.
# Usage: bash scripts/seo-http-qa.sh http://127.0.0.1:3777
set -euo pipefail
BASE="${1:?Pass the origin of the Next.js or Netlify preview deployment}"
BASE="${BASE%/}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
fetch() {
  local route="$1" expected="$2" actual
  actual="$(curl --silent --show-error --location --max-time 35 --output "$tmp/response" --write-out '%{http_code}' "$BASE$route")"
  if [[ "$actual" != "$expected" ]]; then
    echo "FAIL $route: HTTP $actual (expected $expected)" >&2
    head -c 350 "$tmp/response" >&2 || true
    exit 1
  fi
  echo "PASS $route: HTTP $expected"
}
contains() {
  local value="$1" reason="$2"
  if ! grep -Fq -- "$value" "$tmp/response"; then
    echo "FAIL: $reason ($value)" >&2
    exit 1
  fi
}
fetch "/" 200
contains 'rel="canonical"' 'Homepage canonical tag missing'
contains 'https://automanstarrealty.com/' 'Homepage canonical domain missing'
contains 'data-automan-entrance' 'Door entrance absent from rendered home HTML'
for route in /buy /off-plan /commercial /about /contact /properties; do
  fetch "$route" 200
  contains 'rel="canonical"' "$route missing canonical link"
  contains 'name="description"' "$route missing metadata description"
done
fetch "/robots.txt" 200
contains 'sitemap.xml' 'Sitemap location absent from robots'
fetch "/sitemap.xml" 200
contains '<urlset' 'Sitemap is not a sitemap XML document'
contains 'https://automanstarrealty.com/' 'Sitemap canonical origin incorrect'
fetch "/saved" 200
contains 'noindex' 'Non-public saved view must be noindex'
fetch "/definitely-not-a-route-seo-test" 404
fetch "/api/definitely-not-a-route-seo-test" 404
if grep -Fq 'data-automan-entrance' "$tmp/response"; then
  echo "FAIL: unknown API route served homepage instead of 404" >&2
  exit 1
fi
echo 'SEO HTTP smoke tests passed'
