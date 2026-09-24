#!/usr/bin/env bash
# Publish site/dist/ to the box. This is the whole deploy: the site is static
# and Caddy serves /opt/bitbaum/app directly (see /etc/caddy/apps.d/bitbaum.caddy,
# file_server with try_files, so /orangecat/ resolves to /orangecat/index.html).
#
# Build first (`node site/build.mjs`); this script only rsyncs what is already
# in site/dist/. CI runs it after a fresh build; locally it is also safe to run
# by hand after an offline build (see DEPLOY.md). Local dist/ is not live until
# this script succeeds.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
SITE_ORIGIN="${SITE_ORIGIN:-https://bitbaum.orangecat.ch}"
# The box address has ONE home: loki scripts/hetzner/_box-env.sh.
_box_env="${DEV_ROOT:-$HOME/dev}/loki/scripts/hetzner/_box-env.sh"
# shellcheck source=/dev/null
[ -f "$_box_env" ] && . "$_box_env"
BOX="${BOX:-${BOX_UBUNTU:-ubuntu@${HETZNER_IP:?set BOX or HETZNER_IP — the box address lives in loki scripts/hetzner/_box-env.sh}}}"
node "$HERE/build.mjs" --check

stamp="$(date -u +%Y%m%d-%H%M%S)"
rsync -az --delete -e "ssh -o BatchMode=yes" "$HERE/dist/" "$BOX:/tmp/bitbaum-dist.$stamp/"
ssh -o BatchMode=yes "$BOX" "set -e
  sudo rm -rf /opt/bitbaum/app.prev
  sudo mv /opt/bitbaum/app /opt/bitbaum/app.prev
  sudo mv /tmp/bitbaum-dist.$stamp /opt/bitbaum/app
  sudo chown -R root:root /opt/bitbaum/app
  sudo find /opt/bitbaum/app -type d -exec chmod 755 {} +
  sudo find /opt/bitbaum/app -type f -exec chmod 644 {} +"

fail=0
for rel in "" packages/ packages/paykit/ studio/ hire/ orangecat/ loki/ solon/ robots.txt sitemap.xml map.json og/studio.png theme.mjs request.mjs; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$SITE_ORIGIN/$rel")
  [ "$code" = "200" ] || { echo "$SITE_ORIGIN/$rel -> $code" >&2; fail=1; }
done
home="$(curl -fsS "$SITE_ORIGIN/")" || { echo "home page unreachable" >&2; fail=1; }
grep -q 'id="work-grid"' <<<"$home" || { echo "home page has no work grid" >&2; fail=1; }
grep -q 'id="join"' <<<"$home" || { echo "home page has no join section" >&2; fail=1; }
grep -q 'Skip to content' <<<"$home" || { echo "home page has no skip link" >&2; fail=1; }
hire="$(curl -fsS "$SITE_ORIGIN/hire/")" || { echo "hire page unreachable" >&2; fail=1; }
grep -q 'class="signup js-request"' <<<"$hire" || { echo "hire page has no request form" >&2; fail=1; }
grep -q 'request.mjs' <<<"$hire" || { echo "hire page does not load request.mjs" >&2; fail=1; }
if grep -q 'mailto:' <<<"$hire"; then echo "hire page exposes a mailto again" >&2; fail=1; fi
if grep -q 'manual steps between merge and deploy' <<<"$hire"; then echo "hire page still claims 0 manual deploy steps" >&2; fail=1; fi
packages="$(curl -fsS "$SITE_ORIGIN/packages/?publish=$stamp")" || { echo "packages page unreachable" >&2; fail=1; }
while IFS=$'\t' read -r slug version; do
  [ -n "$slug" ] || continue
  if ! grep -Fq "aria-label=\"Latest npm version $version\"" <<<"$packages"; then
    echo "packages page is missing $slug npm version $version" >&2
    fail=1
  fi
done < <(node -e 'for (const p of require("./site/packages.snapshot.json").packages) if (p.install?.source === "npm" && p.version) console.log(`${p.slug}\t${p.version}`)')
expected_packages=$(node -e 'const c=require("./site/overrides.json"); console.log(require("./site/packages.snapshot.json").packages.length + (c.upcomingPackages ?? []).length)')
actual_packages=$(grep -o 'data-package="[^"]*"' <<<"$packages" | wc -l | tr -d ' ')
[ "$actual_packages" = "$expected_packages" ] || { echo "packages page has $actual_packages cards; expected $expected_packages" >&2; fail=1; }
grep -q 'data-package="paykit"' <<<"$packages" || { echo "packages page is missing the paykit card" >&2; fail=1; }
grep -q 'distinct adopters in the fleet' <<<"$packages" || { echo "packages page missing unique-adopter eyebrow" >&2; fail=1; }
if grep -q 'uses across the fleet' <<<"$packages"; then echo "packages page still sums dependency edges as uses" >&2; fail=1; fi
for rel in packages-filter.mjs work-filter.mjs theme.mjs request.mjs vendor/listkit/index.js vendor/listkit/LICENSE; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "$SITE_ORIGIN/$rel?publish=$stamp")
  [ "$code" = "200" ] || { echo "$SITE_ORIGIN/$rel -> $code" >&2; fail=1; }
done
package_headers=$(curl -sSI "$SITE_ORIGIN/packages/?publish=$stamp")
grep -qi '^cache-control:.*max-age=0.*must-revalidate' <<<"$package_headers" || { echo "packages page must revalidate so browsers do not retain stale package counts" >&2; fail=1; }
grep -qi '^referrer-policy:' <<<"$package_headers" || { echo "packages response missing Referrer-Policy" >&2; fail=1; }
grep -qi '^x-content-type-options:.*nosniff' <<<"$package_headers" || { echo "packages response missing X-Content-Type-Options nosniff" >&2; fail=1; }
map_json="$(curl -fsS "$SITE_ORIGIN/map.json")" || { echo "map.json unreachable" >&2; fail=1; }
if grep -q '"changelog"' <<<"$map_json"; then echo "published map.json still contains changelog" >&2; fail=1; fi
if grep -qi 'solo-founder' <<<"$map_json"; then echo "published map.json still says solo-founder" >&2; fail=1; fi
robots="$(curl -fsS "$SITE_ORIGIN/robots.txt")" || { echo "robots.txt unreachable" >&2; fail=1; }
grep -q 'Disallow: /map.json' <<<"$robots" || { echo "robots.txt must Disallow /map.json" >&2; fail=1; }
cards=$(grep -o 'class="card[^"]*" href="/' <<<"$home" | wc -l)
[ "$cards" -ge 20 ] || { echo "home page shows only $cards venture cards" >&2; fail=1; }
[ "$fail" -eq 0 ] && echo "live: $SITE_ORIGIN/ ($(find "$HERE/dist" -name index.html | wc -l) pages)" || exit 1
