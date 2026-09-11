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
# The web root is root-owned (Caddy's file_server reads it; nothing writes it
# but this), so the copy lands in /tmp and sudo installs it.
stamp="$(date -u +%Y%m%d-%H%M%S)"
scp -q -o BatchMode=yes "$HERE/index.html" "$BOX:/tmp/bitbaum-index.$stamp.html"
ssh -o BatchMode=yes "$BOX" "sudo cp -a /opt/bitbaum/app/index.html /opt/bitbaum/app/index.html.bak-$stamp && sudo install -m 644 -o root -g root /tmp/bitbaum-index.$stamp.html /opt/bitbaum/app/index.html && rm /tmp/bitbaum-index.$stamp.html"
curl -fsS -o /dev/null https://bitbaum.orangecat.ch/ && echo "live: https://bitbaum.orangecat.ch/"
