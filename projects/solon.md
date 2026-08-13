# solon — Bitcoin-Native Governance Rail

**Status:** Active Development (Live, MVP — Bitcoin backend stubbed)
**Tagline:** Proposals → cryptographically signed votes → binding policy, with self-verifying records
**URL:** [solon.orangecat.ch](https://solon.orangecat.ch)
**Codebase:** `/home/g/dev/solon/`

---

## Executive Summary

Solon is the governance pillar of the three-product stack (OrangeCat = economy, FleetCrown = capability, Solon = governance). It provides a governance rail for organizations: proposals, Bitcoin-message-signed votes, versioned policies, append-only audit, and on-chain treasury transparency. The vote spine works end-to-end over HTTP: create proposal → open → signed votes → close → decision, with a public read API returning the full self-verifying signed record.

**Distinctive:** AI agents are voting members (`orangecat:cat`, `fleetcrown:loki` vote via script) — with humans-only red-line categories (membership, safety, aid, governance rules). "Sign in with OrangeCat" (OIDC) shipped: no passwords, no registration, no auth tables — login is recognition, not authority; anonymous OC accounts rejected.

---

## What's Built

- Vote mechanisms: simple majority, supermajority, consensus, ranked choice; one vote per member per session (DB-enforced)
- Org surfaces: proposals, audit, treasury, policies APIs; dashboard, voting, treasury pages; `/ecosystem` renders live governed state
- Transparency Engine scoring orgs on 5 dimensions (0–100); amounts as BigInt satoshis
- Real usage today: the sibling projects — OrangeCat's platform allocation policy is governed in Solon
- Recent theme: "the live site stops lying" — fabricated numbers and dead surfaces purged

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 App Router, TypeScript 5.5 strict, Tailwind 3 |
| Database | Prisma + PostgreSQL; amounts as BigInt satoshis |
| Crypto | @noble/secp256k1 + @noble/hashes + bs58check (Bitcoin message signing/verification) |
| Bitcoin backend | Stubbed in MVP (BTCPay / Bitcoin Core planned) |
| Auth | "Sign in with OrangeCat" OIDC — no passwords, no auth tables |
| i18n | en / de / fr / it |
| Deployment | FleetCrown's shared selfhost-deploy.yml → Hetzner |

---

## Business Model

- **Monetization state: none.** No pricing, no processor. Treasury code moves *organizational* sats, not Solon revenue.
- No revenue model has been committed; candidates (hosted governance for Vereine/DAOs/public bodies) are undecided. Design direction (memory: consent-based public finance) needs founder sign-off.

---

## Distribution

**What exists today:** one OG image route ("a real social preview"). That's all.

**Not yet — fleet standard pending:** no sitemap, no robots, no blog, no RSS, no newsletter, no social queue. MIT LICENSE + SECURITY.md exist.

---

## Go-to-market

- **ICP:** organizations wanting auditable votes + treasury — member orgs, Vereine, DAOs, public bodies. Today's real users are the sibling fleet projects; the fictional town profiles in docs are scenario material, not customers.
- **Positioning one-liner:** the governance rail: every decision a signed, self-verifying, public record — and AI agents get a vote where humans allow it.
- **Shortest first-paying-customer path:** none active — no processor, below the fleet's top-4 revenue priorities. Nearest credible path: the evig Verein adopting Solon for member voting (statutes require voting; the integration story is in-fleet).
- **Monetization state:** none; deliberate until governance rail proves out on the fleet itself.
- **Key metrics to move:** decisions recorded · orgs governed (beyond siblings) · votes by external members · agent votes within red-line policy.
