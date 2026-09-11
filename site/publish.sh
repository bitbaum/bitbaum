#!/usr/bin/env bash
# Publish site/index.html to the box. This is the whole deploy: the page is
# static and Caddy serves /opt/bitbaum/app directly (see /etc/caddy/apps.d/bitbaum.caddy).
#
# The previous state of affairs — the live file edited by hand on the server,
# with no source in this repository — is what this script exists to end. Run
# generate.mjs first; publish only what the register produced.
set -euo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
BOX="${BOX:-ubuntu@167.233.22.31}"
node "$HERE/generate.mjs" --check
ssh -o BatchMode=yes "$BOX" "cp /opt/bitbaum/app/index.html /opt/bitbaum/app/index.html.bak-$(date -u +%Y%m%d-%H%M%S) 2>/dev/null || true"
scp -o BatchMode=yes "$HERE/index.html" "$BOX:/opt/bitbaum/app/index.html"
curl -fsS -o /dev/null https://bitbaum.orangecat.ch/ && echo "live: https://bitbaum.orangecat.ch/"
