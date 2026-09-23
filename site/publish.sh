#!/usr/bin/env bash
# Publish site/dist/ to the box. This is the whole deploy: the site is static
# and Caddy serves /opt/bitbaum/app directly (see /etc/caddy/apps.d/bitbaum.caddy,
# file_server with try_files, so /orangecat/ resolves to /orangecat/index.html).
#
# The previous state of affairs — the live file edited by hand on the server,
# with no source in this repository — is what this script exists to end. Build
# first; publish only what the registers produced, and prove it by the page.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
# The box address has ONE home: loki scripts/hetzner/_box-env.sh. This repo has
# no copy of it, and this script is run by hand (see DEPLOY.md), so source it
# from the loki checkout when that exists and otherwise require the value —
# rather than keeping a fourteenth copy of the number here.
_box_env="${DEV_ROOT:-$HOME/dev}/loki/scripts/hetzner/_box-env.sh"
# shellcheck source=/dev/null
[ -f "$_box_env" ] && . "$_box_env"
BOX="${BOX:-${BOX_UBUNTU:-ubuntu@${HETZNER_IP:?set BOX or HETZNER_IP — the box address lives in loki scripts/hetzner/_box-env.sh}}}"
node "$HERE/build.mjs" --check

# The web root is root-owned (Caddy's file_server reads it; nothing writes it
# but this), so the tree lands in /tmp and sudo swaps it in. The previous tree
# is kept beside it, once, so a bad publish is one `mv` away from undone.
stamp="$(date -u +%Y%m%d-%H%M%S)"
rsync -az --delete -e "ssh -o BatchMode=yes" "$HERE/dist/" "$BOX:/tmp/bitbaum-dist.$stamp/"
ssh -o BatchMode=yes "$BOX" "set -e
  sudo rm -rf /opt/bitbaum/app.prev
  sudo mv /opt/bitbaum/app /opt/bitbaum/app.prev
  sudo mv /tmp/bitbaum-dist.$stamp /opt/bitbaum/app
  sudo chown -R root:root /opt/bitbaum/app
  sudo find /opt/bitbaum/app -type d -exec chmod 755 {} +
  sudo find /opt/bitbaum/app -type f -exec chmod 644 {} +"

# A health check proves the process; this proves the pages. Every page the
# build wrote must answer, and the home page must carry the venture grid.
fail=0
for rel in "" packages/ studio/ hire/ orangecat/ loki/ solon/ robots.txt sitemap.xml og/studio.png; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://bitbaum.orangecat.ch/$rel")
  [ "$code" = "200" ] || { echo "https://bitbaum.orangecat.ch/$rel -> $code" >&2; fail=1; }
done
# Not `curl | grep -q`: grep closes the pipe early, curl exits 23, and under
# pipefail a healthy page reads as a failure (it did, on the first publish).
home="$(curl -fsS https://bitbaum.orangecat.ch/)" || { echo "home page unreachable" >&2; fail=1; }
# Assert on what the page must CONTAIN, by id and by count — a section id
# that gets renamed should fail loudly here rather than pass by accident.
grep -q 'id="work-grid"' <<<"$home" || { echo "home page has no work grid" >&2; fail=1; }
grep -q 'id="join"' <<<"$home" || { echo "home page has no join section" >&2; fail=1; }
# The hire page is the destination of the primary button on every page, and it
# carries the only door on the site: a request form that files into Loki. Prove
# the form is there, that it still has a token to post with, and that no
# mailbox leaked back onto the page (the form replaced the address on purpose).
hire="$(curl -fsS https://bitbaum.orangecat.ch/hire/)" || { echo "hire page unreachable" >&2; fail=1; }
grep -q 'class="signup js-request"' <<<"$hire" || { echo "hire page has no request form" >&2; fail=1; }
grep -q 'fcw_' <<<"$hire" || { echo "hire page form has no widget token" >&2; fail=1; }
# NOT `grep ... && { ... }`: under `set -e` a non-matching grep ends the whole
# script, so the healthy case would abort the publish it is meant to guard.
if grep -q 'mailto:' <<<"$hire"; then echo "hire page exposes a mailto again" >&2; fail=1; fi
packages="$(curl -fsS "https://bitbaum.orangecat.ch/packages/?publish=$stamp")" || { echo "packages page unreachable" >&2; fail=1; }
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
grep -q 'aria-label="Paykit package"' <<<"$packages" || { echo "packages page does not feature paykit" >&2; fail=1; }
for rel in packages-filter.mjs work-filter.mjs vendor/listkit/index.js vendor/listkit/LICENSE; do
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://bitbaum.orangecat.ch/$rel?publish=$stamp")
  [ "$code" = "200" ] || { echo "https://bitbaum.orangecat.ch/$rel -> $code" >&2; fail=1; }
done
package_headers=$(curl -sSI "https://bitbaum.orangecat.ch/packages/?publish=$stamp")
grep -qi '^cache-control:.*max-age=0.*must-revalidate' <<<"$package_headers" || { echo "packages page must revalidate so browsers do not retain stale package counts" >&2; fail=1; }
cards=$(grep -o 'class="card[^"]*" href="/' <<<"$home" | wc -l)
[ "$cards" -ge 20 ] || { echo "home page shows only $cards venture cards" >&2; fail=1; }
[ "$fail" -eq 0 ] && echo "live: https://bitbaum.orangecat.ch/ ($(find "$HERE/dist" -name index.html | wc -l) pages)" || exit 1
