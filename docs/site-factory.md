# OrangeCat Site Factory

**created_date:** 2026-08-20  
**last_modified_date:** 2026-08-20  
**last_modified_summary:** Studio overview — infinite sellable sites at *.orangecat.ch.

---

## The model

OrangeCat runs as a **site factory** for the studio:

1. **Prospect** — business owner with an existing site (or none).
2. **Import** — `fleetcrown/scripts/site-import/import-site.ts` scrapes their current site into a reviewable manifest.
3. **Build** — fork OSS if licensed, else scaffold from our Next stack; improve from first principles.
4. **Host** — `{slug}.orangecat.ch` on bitbaum via `provision-site.sh`.
5. **Sell** — they look; buying is optional. OrangeCat identity/economy can layer on later.

This is how the studio scales: mechanical provisioning, not heroic deploys.

---

## SSOT map

| Concern | Where |
|---------|--------|
| Architecture | `fleetcrown/docs/architecture/site-factory.md` |
| Cross-repo discipline | `fleetcrown/docs/standards/fleet-discipline.md` |
| Fleet manifest | `fleetcrown/scripts/hetzner/apps.conf` |
| Provision CLI | `fleetcrown/scripts/hetzner/provision-site.sh` |
| Import CLI | `fleetcrown/scripts/site-import/import-site.ts` |
| Project briefs | `bitbaum/projects/*.md` |

---

## Quick start

```bash
# 1. Scrape prospect site
cd /home/g/dev/fleetcrown
npx tsx scripts/site-import/import-site.ts https://prospect.example --out imports/prospect.json

# 2. Provision hosting (after repo exists)
bash scripts/hetzner/provision-site.sh prospect-slug --repo /home/g/dev/prospect-slug

# 3. DNS + env + deploy (checklist printed by provision-site.sh)
```

---

## Relationship to products

- **OrangeCat app** — platform (identity, economy, Cat AI). See `orangecat/docs/architecture/PLATFORM_AND_COLLABORATION.md`.
- **FleetCrown** — build cockpit + agent fleet; provisions and deploys sites.
- **Customer sites** — independent repos, one row in `apps.conf` each.

Do not conflate OrangeCat RLS multi-tenancy (inside one app) with site factory hosting (many apps on one box).
