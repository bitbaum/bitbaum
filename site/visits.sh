#!/usr/bin/env bash
# Who actually arrived, and from where.
#
# The site's purpose is arrival (site/PURPOSE.md); until 2026-09-17 nothing on
# the box could answer whether anyone did. The shared Caddy access log rolled
# every few hours and mixed eleven hosts together, so "33 of 112,533 requests"
# was the best that could be said, once. This host now writes its own log
# (/etc/caddy/apps.d/bitbaum.caddy: 5mb rolls, 20 kept, 90 days), and this
# script reads it.
#
#   bash site/visits.sh            # the whole retained window
#   bash site/visits.sh 7          # the last 7 days
#
# A referrer is the number that matters: it is the only evidence that a link
# somewhere sent a person here, which is the thing the backlinks were for.
set -euo pipefail
BOX="${BOX:-ubuntu@167.233.22.31}"
DAYS="${1:-0}"

ssh -o BatchMode=yes "$BOX" "sudo python3 - $DAYS" <<'PY'
import glob, gzip, json, sys, time
from collections import Counter

days = float(sys.argv[1] or 0)
cutoff = time.time() - days * 86400 if days else 0
files = sorted(glob.glob("/var/log/caddy/bitbaum*.log*"))
if not files:
    sys.exit("no log yet — check /etc/caddy/apps.d/bitbaum.caddy has its own log block")

total = refs = 0
first = last = None
referrers, paths, agents, statuses = Counter(), Counter(), Counter(), Counter()
# The site's own publish check and the box's own curl are not visits.
SELF = ("bitbaum.orangecat.ch", "127.0.0.1", "localhost")

for f in files:
    op = gzip.open if f.endswith(".gz") else open
    with op(f, "rt", errors="replace") as fh:
        for line in fh:
            try:
                e = json.loads(line)
            except Exception:
                continue
            ts = e.get("ts") or 0
            if cutoff and ts < cutoff:
                continue
            total += 1
            first = ts if first is None else min(first, ts)
            last = ts if last is None else max(last, ts)
            r = e.get("request", {})
            h = r.get("headers", {})
            statuses[e.get("status")] += 1
            paths[r.get("uri", "?").split("?")[0]] += 1
            ua = (h.get("User-Agent") or ["-"])[0]
            agents[ua[:60]] += 1
            ref = (h.get("Referer") or [""])[0]
            if ref and not any(s in ref for s in SELF):
                refs += 1
                referrers[ref[:90]] += 1

span = f"{(last - first) / 86400:.1f} days" if first and last else "—"
print(f"window          {span} ({len(files)} log file(s))")
print(f"requests        {total}")
print(f"with a referrer {refs}" + ("" if refs else "   <- nothing linked here, or nobody followed a link"))
print("\nreferrers")
for k, v in referrers.most_common(15) or [("(none)", 0)]:
    print(f"  {v:>5}  {k}")
print("\ntop paths")
for k, v in paths.most_common(12):
    print(f"  {v:>5}  {k}")
print("\ntop agents")
for k, v in agents.most_common(8):
    print(f"  {v:>5}  {k}")
print("\nstatuses  " + "  ".join(f"{k}:{v}" for k, v in sorted(statuses.items(), key=lambda x: -x[1])))
PY
