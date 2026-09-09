# bitbaum

Strategic planning repository for independent ventures. Public name is **Cato**.

@~/.claude/CLAUDE.md

---

## What This Repo Is

Documentation-only repository containing strategic vision, product specs, and business plans for ventures. No code, no tests, no deployments.

## Structure

```
README.md          — Overview pointing to sources of truth
state/org.json     — Organizational facts register
projects/          — Venture briefs (narrative and business plans)
docs/              — Cross-venture documentation
```

## Sources of Truth

- `state/org.json` — Organizational facts (legal status, hosting model, public name)
- `bitbaum/fleetcrown scripts/hetzner/apps.conf` — What the Hetzner box serves
- `projects/*.md` — Venture narratives and business plans (authoritative per venture)

## Conventions

- **Accuracy over completeness** — Never leave placeholder text (`[TBD]`, `[To be defined]`)
- **One source per fact** — Each fact lives in exactly one place; other files point to it
- **Status must be current** — Update status fields when a venture's stage changes
- **No fake metrics** — Revenue projections are estimates/targets, always labeled as such
- **Check compliance** — Run `node scripts/check-stale-claims.js` before committing
