# Fleet system review — what we built, who it is for, how it holds together

**Date:** 2026-11-03 · **Scope:** Loki, OrangeCat, Solon, bitbaum, the shared packages, the box, and the twelve venture sites that load Loki's widget · **Method:** read the ten attached repositories plus `bitbaum/fleet`, ran five independent code audits, ran the repos' own gates, and walked production the way four kinds of people do (a visitor, a stranger on a site, the public demo, a pseudonymous OrangeCat account). Everything marked **measured** was observed live today; everything else is read from code or docs and says so.

---

## 0. The answer in one page

**What exists.** One studio (bitbaum) ships three planes of one idea: OrangeCat is the economy of a thing (hold, receive, send value), Solon its governance (signed votes), Loki its execution (built, changed, shipped). Around them, 29 ventures on Loki's fleet map, 16 served as "live", one Hetzner box running all of it, and a growing set of `@bitbaum/*` packages meant to be the single implementation of chat, search, accounts, mail, model calls and design tokens.

**Where the bots live.** The named, talkable bots (the Cat, Companions, the "Bots" list) live in **OrangeCat**: `ai_assistants` rows, memories, rooms and routines. The bots that **do work** (Claude Code, Codex and the other CLIs) live in **Loki**, as PTYs on a builder. Loki's own assistant ("Loki" the chat) is a third thing, in Loki. No bot has a record in both products. The only bridge is a Companion *proposing* `ask_loki` / `send_to_loki`, which the Cat executes after a tap, and OrangeCat's bots reaching the owner's Telegram *through Loki's one gateway* (shipped 2026-11-02).

**Workbench, widget, chat, terminal: duplicates or views?** Mostly views of the same objects, and that part is well built. Thirteen API routes end in one `injectPrompt`; one `work-phase.ts` decides every feedback status; the Workbench genuinely mounts the Sessions surface and the Review frame rather than copying them. What *is* duplicated is smaller and specific: a second floating Loki chat on every page, an old prompt box still mounted on Home, three different "brains" answering as Loki, and in OrangeCat three chat UIs that are not chatkit. The matrix in §2 says who should use which surface.

**Does it work?** Yes, the core loops work in production today (measured): the widget on a stranger's browser answered a question in under twenty seconds and filed a note that got a tracking page; the Cat answered on a free model; a fleet bot (Diplodoctor) answered through OrangeCat; every site in the fleet is up; Loki's deploy is at main's tip. Two doors are broken or blunt: **"Explore the demo" lands on a 404 page** (measured), and a no-email OrangeCat account hits "Add your email" at Loki's door, which contradicts the "Start instantly, no email" promise one screen earlier.

**Is it efficient?** As a product, the shape is right: one box, stored decisions, derived status, one inject spine. As a system, it is expensive to carry: ~570k lines of application code across the two main repos written largely by one identity in six months, 355 + 312 API routes, 85 + 179 config files, a cloud builder restarted several times a day by dependency-floor commits (27% of OrangeCat's and ~9% of Loki's recent commits are bumps, every one a deploy), and an auto-merge sweep that wakes ~190 times a day across the two repos mostly to find nothing. The quality gates are real and green; what they do not catch is drift between the rules the repos state and what the code does (RLS, "every chat is chatkit", "model calls go through ai-kit", "one box").

**What to do first.** §9 lists it. In short: fix the two doors, delete the second boxes and the second brains, finish the three "packages first" migrations that both repos have half-done (chat, model calls, auth), quiet the dependency churn, and write the surface matrix down once so every future screen is placed by rule rather than by taste.

---

## 1. What has been built

### 1.1 The three planes and the studio

| Plane | Product | Audience | Lives at | Role (SSOT `orangecat/src/config/ecosystem.ts` → `ECOSYSTEM_PILLARS`) |
|---|---|---|---|---|
| Economy | OrangeCat | public by design | orangecat.ch | fund, offer, get paid; "My Cat" is the interface; entities are its world model |
| Execution | Loki | private by default | loki.orangecat.ch | brief → repository → deployed result → feedback → verified change; plus the people, money, goals and habits the work runs on |
| Governance | Solon | shared with members | solon.orangecat.ch | proposals, signed votes, watch-only treasury, append-only audit |
| Studio | bitbaum | public | bitbaum.orangecat.ch | a *view* generated from Loki's fleet map and the package registers; the Builders directory |

The fleet map (`GET loki.orangecat.ch/api/fleet/map`, **measured** 200, 462 KB) is the one producer of which ventures exist. Today: 29 projects, 16 marked live, 2 demo, 2 validating, 1 prospect, 8 not live. The serve register (`loki/scripts/hetzner/apps.conf`) lists 29 rows with ports 4004–4041 on one box.

### 1.2 Loki's surfaces, by who they are for

Legend: **O** owner/operator · **B** builder seat · **C** client/viewer seat · **S** stranger on someone's site · **P** public visitor.

| Surface | Route / entry | For | The one job | Box it renders | Status |
|---|---|---|---|---|---|
| Loki chat (default screen) | `/loki` | O, B | say what you want; Loki answers or sends work to a project's agent | shared `Composer` | live |
| Home | `/control` | O | what needs you, what is being built, what got done, the box to start work | `HomeComposer` → shared Composer | live, but also still mounts the old `ProjectCard` prompt box and a "Run in cloud" textarea when a project is focused (desktop) |
| Sessions | `/terminal` | O | each agent's session as Chat or Terminal; type into it | `SessionComposer` → shared Composer | live |
| **Workbench** | `/projects/[id]/workbench` | O, B | one project, one screen: the site as Loki's browser sees it, the robot with one box, one line of state | the Sessions surface in its quiet shape | live (shipped 2026-10-30/31) |
| Review | `/projects/[id]/review` | O | watch Loki's browser walk the site, take over, discuss, choose fixes | shared Composer + review browser | live (2026-11-02) |
| Watch it work | `/projects/[id]/watch` | O, B | the latest run as a readable track with retry | none | live, linked from 15+ places |
| Project page | `/projects/[id]` | O; members see a guide | where am I, what is happening, how do I move it | member `ProjectAskBox` | live |
| Feedback inbox | `/feedback` | O | every report across the fleet with its phase and next tap | none | live |
| My feedback | `/my-feedback`, `/claim-feedback` | S, C, B | the reporter's side of the same loop | none | live (**measured**) |
| Approvals / Suggestions | `/approvals`, `/suggestions` | O | yes/no to proposed actions; what to do next | none | live |
| **Embeddable widget** | `/widget.js` on any site | S, C, B, O | Ask · Save feedback · Fix it (owner) · Point · Talk · Watch · Your changes | its own vanilla composer; chatkit variant opt-in | live on 11 of 12 fleet sites checked (**measured**) |
| Continue in Loki | widget → `/loki?project=` or `/terminal?project=` | O, B | carry the widget thread into the app | lands in the shared Composer | live |
| Fleet Runner | desktop app 0.8.63 | O | own agent PTYs on your own computer; place workbench windows on displays | same web tree | live, optional |
| Firefox extension | AMO "Loki" | O | fill a form Loki hands it, stop at the final button | none | code live; AMO publication not verified |
| No-screen / voice | `/voice` | O | run the fleet with the phone in a pocket | own mic UI | live |
| MCP | `POST /api/mcp` | O, AI apps | 7 tools behind OrangeCat OAuth or an agent token | n/a | live (**measured** 401 challenge) |
| Telegram | webhook + Settings | O | notifications only, one gateway for every bot | none | live |
| Today · People · Crew · Money · Goals · Habits · Events · Prompts · Packages · System · Memory · Activity · Settings | various | O | the life the work runs on; the packages the fleet is built from | form assist bars | live |
| Public | `/`, `/change`, `/thoughts`, `/roadmap`, `/changelog`, `/share/project/[token]` | P | doors and records | `/change` uses the shared Composer | live (**measured**) |
| Retired | `/agents`, `/atlas`, `/duet`, `/digests`, `/decisions`, `/history` | — | redirects | — | redirects, except `/atlas/[projectId]`, a ~640-line page with no inbound link |

### 1.3 OrangeCat's surfaces that matter here

| Surface | For | What it is |
|---|---|---|
| The Cat (`/dashboard/cat`) | signed-in user | the platform's own agent: 65 actions in 5 categories (`src/config/cat-actions.ts`), a real tool loop, pgvector memory, per-category permissions with BTC caps; reachable from Claude.ai/ChatGPT via `/api/mcp` |
| Bots (`/companions/talk`) | signed-in user | one list, newest first: the Cat, your Companions, and fleet bots (Diplodoctor, Causius) seated from Loki's map; group rooms with bot-to-bot handoff; routines on the owner's own key |
| A Companion | its owner, strangers if public | an `ai_assistants` row + `companion_memories` + rooms; cannot call tools; *proposes* one of seven Cat actions as a "Do it?" card |
| The Loki feedback widget | everyone on orangecat.ch | loaded in the root layout with OrangeCat's own widget token (**measured**: boots) |
| Discover, profiles, pay pages | public | readable and payable without an account |

### 1.4 What runs on the box (condensed; the full inventory is in appendix A)

- **loki-app** (Next.js, :4002) and **loki-box-runner** (the owner's cloud builder, `User=ubuntu`, holding the DB password, the org GitHub token and the agent sign-ins). The web app never runs an agent; `runtime:false` on `/api/health` is by design.
- **loki-box-runner@&lt;tenant&gt;** template units for private builders, reconciled every minute from `users.private_builder`; the owner's own runner is still the legacy unit.
- **loki-bridge** (Postgres LISTEN → SSE, :4001) wakes runners in under a second; **loki-mailgate** (SMTP :25 → signed POST into apps); **loki-embed** + a nightly reindex for fleet knowledge (not verified active).
- **26 Loki crons** as `fc-cron@` timers (autopilot night/plan, reap-stale-runs, check-runner-stall, sync-package-updates every 15 min, check-site-live, reset-demo, digests, …) plus **~34 sibling-app crons** and **~15 monitoring timers** (host-check, watchdog, security, disk-gc, pg-backup, ivy-health which restarts services) — all installed from the Loki repo.
- **GitHub Actions**: CI → Deploy after green main; the fleet auto-merge sweep (hourly cron + on every CI run) which also reconciles deploys against `/api/health.commit`; fleet uptime hourly.
- The **inspection worker** (the robot's browser) runs *inside the project agent's PTY* when a review is started, and reports frames to `/api/reviews/[id]/worker`.
- The **hosted runner (Hermes)** has no unit file and no installer; code still routes an offline dispatch to it as a fallback.

---

## 2. Who uses what, and when

This is the matrix the owner asked for. It is derived from the code's own audience rules (`lib/execution-access.ts`, `lib/feedback/pass-rule.ts`, `lib/project-capabilities.ts`, the widget's owner/member passes) and from what each screen can actually do.

| Person | Their problem, in their words | The surface that answers it | What they should never need |
|---|---|---|---|
| **A visitor on a venture or client site** (stranger) | "This page is wrong / unclear / broken, and nobody ever writes back." | The **widget**: Ask (an answer about this page), Save feedback (a note with a tracking link), Point, Talk. Then `/claim-feedback` to see what happened. | Loki itself. They never see Sessions, Workbench or an inbox. **Measured**: Ask answered in ~20 s; Save gave a 200 and a working tracking page. |
| **A client who owns a site Loki builds** | "Change this, now, without an email thread." | The **widget on their own site** with the owner or member pass: Fix it now, Your changes (Waiting · Building · Live · Needs you), See it. Optionally `/my-feedback` and the project page in Loki. | The terminal. The Workbench is *optional* for them; the widget is the product. |
| **A person with an idea and no code** (public → owner) | "I know what I want built but I can't write code." | `/` → Start a project → Loki chat (`APP_HOME`). The first build brief, the kickoff questions (all skippable), then the **Workbench** for the first real look. | GitHub, a terminal, model names. Today onboarding ends on `/projects/<id>` or `/control`, not the chat, so the "Loki first" rule is honoured for returning users only. |
| **The owner steering many projects** (George / an operator) | "What needs me, what is being built, what shipped, from my phone." | **Loki chat** to say things; **Home** to see Needs you / Being built / Done; **Approvals** for yes/no; **Feedback inbox** for triage; **Telegram** for the one-tap notices; **no-screen voice** in a pocket. | — |
| **The owner building one thing right now** | "Let me see the site, the robot and one place to type." | **Workbench** (one box, one line of state, the site as a picture, the real site in its own window). | Sessions' tab strip, builder picker, Loki's chat beside it. The Workbench deliberately removes those. |
| **An engineer debugging a run** | "What did the agent actually print?" | **Sessions** (Chat and Terminal views), Watch it work, Activity. The plain shell behind the PIN. | — |
| **A builder seat on someone else's project** (bitbaum Builders) | "Let me change this without owning it." | The **widget** with a member pass, `ProjectAskBox` on the project page, Workbench if the owner wants it. Their own engine pays. | The owner's chat (it runs in the owner's account). |
| **A Companion owner on OrangeCat** | "A bot that remembers me and does small things on OrangeCat." | **Bots** list, 1:1 chat, rooms, routines; "Do it?" cards for the seven hands; `ask_loki` to read what Loki is doing. | Loki's UI. Loki is reached through the Cat, not opened. |
| **An AI app user** (Claude.ai, ChatGPT, Cursor) | "Let my assistant act on my OrangeCat / Loki." | `/api/mcp` on each product behind OrangeCat OAuth. | — |
| **Us** (the studio and its agents) | "Know what is true without reading six repos." | The fleet map, `apps.conf`, the registers, the audits in `fleet/scripts/ci`, `/system`, `/packages`. | A second copy of any fact. |

The point to take from the matrix: **the Workbench is for the person who builds; the widget is for the person who uses.** They are the same loop (site → note → run → live) seen from the two ends of it, and the code already keeps them on one data path. The confusion is not between those two. It is inside Loki, where a person meets *three* rows on a project page ("Workbench", "Review it", "Watch it work") plus Sessions in the sidebar for roughly one intent, and a floating second chat on every page.

---

## 3. How the pieces connect

### 3.1 OrangeCat ↔ Loki (all measured today unless noted)

| Direction | Mechanism | Auth | Live |
|---|---|---|---|
| OC → Loki | project-link (is this OrangeCat project built in Loki?) | public, cached | 200 |
| OC → Loki | actor-status, ask, task, site, entitlement, events, notify (owner Telegram) | HMAC (`ORANGECAT_WEBHOOK_SECRET`), fail-closed | 401 unsigned, 405 GET (correct) |
| OC → Loki | build-intent handoff (a signed, one-use token that opens a Loki project) | HS256 + OIDC-linked actor | not verified (needs an owner) |
| Loki → OC | fleet map and register read by OrangeCat for project tiles, Cat context and the fleet bots' identities | public | 200 |
| Loki → OC | publish a project / promote its changelog to the OrangeCat timeline; mirror paid Crew work and subscriptions as OrangeCat services | the person's OIDC token / an integration key | not verified |
| Shared identity | OrangeCat is the OIDC issuer; Loki is a relying party on AccountKit since 2026-11-01 | OAuth PKCE | discovery 200; the door works (**measured**) but asks a no-email account for an email |
| Embed | Loki's widget on every OrangeCat page | widget token | boots (**measured**) |
| AI apps | `/api/mcp` on both | OAuth resource indicators | 401 challenge on both (correct) |

Two facts to fix here. The register that is supposed to name every Loki endpoint (`LOKI_ENDPOINTS`) lists three of eight; five sibling files hardcode their own URL. And `ECOSYSTEM` is typed twice (one per repo) and has already drifted on the owner's profile URL.

### 3.2 The feedback loop, end to end

widget → `POST /api/feedback` (per-site token, origin allowlist) → `site_feedback` → owner inbox / project section / widget "Your changes" (one phase function) → Implement → `injectPrompt` → `pending_commands` → bridge NOTIFY wakes the runner → claim → PTY → heartbeat every ≤45 s while it prints → run closes at a **pull request** → the project repo's own sweep merges and deploys → Loki learns of merge/deploy by **polling GitHub** when someone looks or the 15-minute cron runs → `fix_live` notice fires once on the transition → reporter's tracking page updates.

Everything after the pull request is observed, not pushed; "Live" is derived. That is honest, and it is why a stranger's page can only say "waiting for the maintainer" until a person acts.

### 3.3 Bots → people

OrangeCat's Cat and Companions reach the owner's phone through Loki's single Telegram gateway with the "only with one tap" policy (OC #1524, #1540, Loki #1543). That is the right shape: one door, one policy, in one repo. On the box, though, four other things still send Telegram directly (`ivy-health.sh`, `check-gateway`, `lib-alert.sh`, OpenClaw).

---

## 4. The production walk (measured 2026-11-03, 07:30–08:00 UTC)

| Walk | Result |
|---|---|
| Health | loki `ok`, commit = main tip `c03cecb`; orangecat healthy, disk 80 %, **`last_backup_age_hours: null`**; solon and bitbaum 200 |
| Public pages at 390 px and 1440 px | Loki `/`, `/login`, `/roadmap`, `/changelog`, `/change`; OrangeCat `/`, `/ecosystem`, `/discover`, `/auth`; bitbaum; Solon: **no horizontal overflow anywhere**, no console errors; several pages have many sub-44 px targets on desktop only |
| Widget presence | boots on loki, orangecat, bitbaum, solon (phone), evig, botsmann, heidi, substrata, causius, diplodoctor, kivvi; **absent on biaslens** |
| Widget as a stranger | Ask → `/api/widget/advise` 200, a correct one-sentence answer about "Private builders"; Save feedback → confirmation card → Send → `POST /api/feedback` 200 with a claim URL; `/claim-feedback` shows the note, "Received on Loki · Nov 3", "Filed and waiting for the maintainer". One clearly labelled test note is now in the Loki project's inbox; it is safe to close. |
| Loki demo | "Explore the demo" on `/login` → the page re-renders as **"404 This page could not be found"**; the demo session *is* created, and typing `/loki` afterwards works. A first-time visitor sees a 404 and leaves. Inside the demo: Loki chat, Home, Projects, a project page, Workbench and Review all render; Sessions and the Workbench's robot pane say "Cloud runner is private for this account", so the demo can show neither a running agent nor the robot's browser. |
| Loki sign-in page | eight ways in on one screen (OrangeCat, GitHub, passkey, Lightning wallet, email+password, magic link, forgot password, demo). Fine for a developer; a lot for "a friend on your side". |
| OrangeCat as a visitor | "Meet your Cat" → the sign-in page (no Cat without an account). "Start instantly — no email" creates a pseudonymous account; dashboard, Bots list (Cat · Diplodoctor · Causius), Cat chat all work; the Cat answered on "Groq · GPT-OSS 20B (Free)"; Diplodoctor answered through OrangeCat's relay. |
| OrangeCat → Loki | "Continue with OrangeCat" → `orangecat.ch/oauth/authorize` → **"Add your email to continue to Loki"**. Correct as a policy (Loki needs to find you again), but it is the first dead end a pseudonymous explorer meets, and the screen does not say why an email is needed *here* when it was not needed to use the Cat. |
| GitHub | Loki: 22 open PRs (5 unmerged `chore(starter): sync` since Oct 25, 8 Dependabot since Oct 7, 2 drafts since Oct 1/21), 11 open issues of which 8 from 2026-09-10 describe runner failures. OrangeCat: 17 open PRs, 13 Dependabot since Oct 26. The sweep runs every ~15 minutes in each repo (run numbers 6363 and 5484). |

Screenshots for every step are in the session scratchpad (`shots/`, `shots/demo/`, `shots/oc/`, `shots/oauth/`).

---

## 5. The backend as a system

**What is well designed.** One inject spine (13 routes → `injectPrompt`). Builder choice is a stored decision, never presence. The run ledger separates "the agent finished" from "it is live". The bridge makes dispatch sub-second with a 25 s long-poll as the safety net. Deploy applies schema first, forward-only, with a drift gate that rolls back. The box runner only restarts when its agents are idle. The demo is sandboxed by policy *and* by effect asserts.

**Where authority is split (the repo's own "#1 bug source").**

1. Three executors embed the same `home/` core differently (box-runner, Fleet Runner, hosted runner); the box runner imports the desktop package by relative path.
2. Two writers of `runner_presence` (the bridge and the hosted runner), and a third client-side state of the same name.
3. "Online" is inferred from the runner's *version string*; it has misreported twice.
4. The hosted runner (Hermes) is half-retired: no unit, no installer, still a fallback in `inject-core.ts` and `implement.ts`. A dispatch that falls back to it can sit unclaimed and be **deleted after 20 minutes** by `purgeStalePendingCommands`, which no doc mentions and which contradicts "work queued for a shut laptop waits visibly".
5. Five paths close a run; five things watch Loki's uptime (one of them restarts services outside the drain discipline); six places may restart the runner; two definitions of "operator".
6. `fc-cron@` units have no `OnFailure=`; a failed Loki cron reaches only the host-check sweep.
7. Legacy still shipped: zellij comments, `legacyClaudeSessionsDir`, compat for desktop ≤ 0.8.9, `harden-box-runner.sh` next to the template that supersedes it.

**Efficiency.** Dependency-floor commits (fleet `internal-currency.yml`) land several times a day in both repos; each is a full CI, a CD and a production swap. On Loki a runner-code change also schedules a drain-and-restart. The sweep wakes every 15 minutes per repo whether or not a PR is green. None of this is wrong individually; together it is the single largest consumer of CI minutes and the most frequent reason production restarts, for changes that carry no product value on their own.

---

## 6. Engineering quality, against the principles the repos state

Both repos ran their own gates here: Loki `tsc`, lint, `check:design` pass; `test:unit` 555/565 (the 10 failures are browser tests that need Chromium and do not skip like their 20 siblings). OrangeCat `type-check`, lint (23 warnings), `test:unit` 661 files / 5,560 tests all pass; duplication 0.74 % against a 1.0 % baseline.

| Principle | Loki | OrangeCat |
|---|---|---|
| **SSOT** | Holds where it says it does (nav, APP_HOME, widget theme from tokens, no hex in components). Drifts: 8 status vocabularies, "Needs you" defined in 22 files, 120 of 355 routes hand-write the `{ok}` envelope, `ECOSYSTEM` typed in both repos. | Holds strongly for entity names (809 `DATABASE_TABLES.*`, 4 literals), `any` (~26 in 302k lines), logging (2 `console.log`). Drifts: `text-bitcoin-orange` prescribed in one rule and declared a no-op in another, and used in 5 live places (renders nothing). |
| **DRY** | 8 relative-time helpers; 99 raw `fetch(` in components plus a private `fetchJson`; a 555-line second chat (`AskLokiButton`) with its own thread store and own API; the old `ProjectCard` prompt box and "Run in cloud" textarea still mounted on Home; three renderers of one project dossier; 33 "one sentence about a project" composers. | 217 raw `fetch(API_ROUTES.*)`; 84 files use the type-erasing `looseClient`; `formatRelativeTime` ×2, `formatAmount` ×3; 1,266 lines of own LLM clients; 3,763 lines of entity templates as code under `components/`. |
| **Packages first** | chatkit: yes for the three main boxes and threads; ai-kit: installed, but 3 files still call Groq directly and the widget advisor bypasses the Loki brain; two auth stacks in production (next-auth 5 beta and AccountKit behind `AUTH_RUNTIME`). | chatkit: **1 of 4** chat surfaces (Cat yes; Companion, Room and the 7,342-line DM feature no); ai-kit: the Cat yes, Companions no (own OpenRouter/Groq clients); react-query installed, unused. |
| **Separation of concerns** | Three API routes at 920–964 lines on the dispatch path; 63 components over 300 lines; 85 config files. | 26 route files use the service-role admin client (bypassing RLS) and therefore carry 11 app-side ownership guards, while the rules say "rely on RLS, never app-side auth". Either the rule or the code is wrong; the code is the one that is tested. |
| **One shape per kind** | Two project-row shapes (`ProjectCard`, `ProjectRow`); the login screen has eight choices; the project page has three rows for one intent. | The money surface is the reference and holds; `check:choice-rows` etc. gate it. |
| **Tests** | 577 test files, 90k lines, 0 orphaned; no coverage measurement; 80 tests grep source as text; 29 browser tests in the "unit" lane. | 5,560 unit tests, 0 skipped; 12 of 19 Playwright specs run by no workflow; `tests/integration` run by nothing; `cypress/` dead. |
| **Docs truth** | The fleet gate (`docs-truth-audit.mjs`) is **green on all four repos** because it is ratcheted to a baseline; underneath, 35 of 438 cited paths in Loki docs and 23 of 341 in OrangeCat's live docs do not exist, and `surfaces.md` describes `AskLokiButton` and Atlas incorrectly. OrangeCat: 58 % of 412 docs archived, 98 live docs undated, 4 live Vercel references, 11 `package.json` scripts point at missing files. |

**Velocity, for context.** Loki: 540 commits since 1 Oct, 15.8 per active day, 100 % merged by the sweep, fix:feat 0.76, 52 commits (10 %) on the dispatch path. OrangeCat: 297 commits, 27 % dependency bumps, fix:feat 1.09. One author identity on both. This is the throughput of a studio, produced by one person plus agents; the review's job is to say what that throughput is costing.

---

## 7. From first principles

**The problem for the person with an idea** is not that building is hard; it is that *every tool asks them to become a developer first*. Loki's answer (say it in a sentence, Loki keeps the code, no GitHub, the result has an address) is the right answer, and the landing page says it well. The product then undercuts it at the two doors a newcomer meets first: a demo that 404s and a sign-in screen with eight options.

**The problem for a site owner** is latency and trust: a change is an email, a quote and a week, and when it lands they cannot tell whether it is live. The widget plus the derived "Live · confirm" ledger is a genuinely new answer. It works today. Its weak point is that it has three brains (the widget advisor on Groq, the concierge with a scripted "Cat", and Loki's real assistant), so the owner meets three Lokis with three memories.

**The problem for a visitor** is being ignored. A note with a tracking link and a sentence that says "nothing more is needed from you" solves it, measured.

**The problem for OrangeCat's user** is turning identity into income without a gatekeeper. The Cat and the Bots are the interface; the economy underneath (any rail, Bitcoin native) is there. What is unclear is *why a person would open OrangeCat's bots rather than any chat app*; the answer the code gives (the hands: a bot can file a product, an event, a wishlist, or ask Loki) is the differentiator, and it is one tap away from invisible: it only appears when a bot proposes it.

**The problem for us** is that the system is now larger than any one head, including the owner's ("I still don't know what we have built"). The fleet has excellent *rules* for this (one producer per fact, registers, audits) and the audits are green, which is exactly the trap: a ratcheted gate accepts the drift it was born with. The measure that matters is not green CI but *can a new person find, in one place, who each surface is for and which one to open*. That document did not exist before today; §2 is a first draft and should become config (a table in `loki/src/config/`) that the nav, the project page rows and the widget read.

**Is the multi-screen Workbench the right bet?** Yes, with a caveat. For the builder it is the screen; the owner's own words ("one thing to do, a few things to see") are implemented. For a client it should stay optional and the widget should stay the product, which the code already respects (passes, seats, "Make it live"). The caveat: the robot's browser is a picture, not a window (fleet sites forbid framing), and the demo cannot show the robot at all, so the one screen that best explains Loki is the one a prospect cannot see without an account and a builder.

---

## 8. Duplicate or view? The verdict list

| Pair | Verdict |
|---|---|
| Workbench vs Sessions + Review | **View.** Same components, same `site_reviews` row, same session. Keep. Rename the three project-page rows so each says what it is for. |
| Widget conversation vs Loki chat | **Two brains by design, one hand-off.** Acceptable for anonymity and budget; unacceptable that the concierge impersonates the Cat. Route the widget's "Ask" through Loki's answering seam with a page-scoped context, and either route "the Cat" to OrangeCat's MCP or stop naming it. |
| Home composer vs Loki chat vs Session box | **View** (all end in `injectPrompt`). The duplicates are the *extra* boxes: `AskLokiButton` (own API `/api/loki`), the old `ProjectCard` prompt box, `HostedDispatchButton`, the command palette's free text. Delete or fold into the shared Composer. |
| Feedback inbox vs ControlInbox vs project section vs widget "Your changes" | **View** (one phase function). Three different control vocabularies on the same queue; unify the actions. |
| Suggestions vs Approvals vs "Needs you" | **Different data, correctly separated**, with a test that the number is said once. Keep. |
| Today vs Home | **Partial duplicate.** Both answer "what now"; Today imports Home's cards. Decide which is the morning screen and demote the other to a section. |
| Cat vs Loki's assistant | **Two brains, one skin.** Both chatkit; separate tool loops, text-protocol parsers and memories; Loki's loop header says it copied the Cat's approach. Not a product duplicate (different planes), but the model-call layer under both should be ai-kit, once. |
| Companions vs Loki agents | **Different kinds.** No overlap; the bridge is the seven hands. Keep. |
| OrangeCat DMs / Companion chat / Room chat vs chatkit | **Duplicate of the package.** 1 of 4 complies; the fleet rule is explicit. |
| Two `ECOSYSTEM` configs, `LOKI_ENDPOINTS` vs five hardcoded URLs | **Copies.** One already drifted. |
| Loki's two auth stacks | **Transitional duplicate.** Retire next-auth once the AccountKit cutover is proven (the journeys are marked proven live on 2026-11-01). |
| `orangecat/mcp-servers/` vs `/api/mcp` | **Not the same thing.** Dev tooling in a product repo, with an npm lockfile in a pnpm repo and a CI job. Move or delete. |

---

## 9. What to do, in order

**Now (days).**
1. Fix "Explore the demo" so it lands on the demo's Loki chat, not a 404 (`SignInForm.handleDemo` → `goAfterSignIn` on the AccountKit runtime). Add it to the authenticated smoke.
2. Say why at the OrangeCat → Loki door: "Loki needs an email because it will write to you when a build lands", and offer the same "Continue to Loki" after adding one in place. Or let a pseudonymous account into Loki read-only.
3. Put the widget on biaslens (the one fleet site without it) and find out why OrangeCat's health reports no backup age.
4. Close or triage the 8 open Loki issues from 2026-09-10 and the 22 + 17 stale PRs; a queue nobody reads is the same as no queue.
5. Throttle the dependency-floor stream: batch floor raises daily, and let the sweep run on PR events plus one hourly cron instead of every 15 minutes.

**Next (weeks).**
6. One Loki brain: route the widget advisor and concierge through the Loki answering seam with page context; delete the scripted Cat or route it to OrangeCat's MCP.
7. One box: delete `AskLokiButton`'s own thread and API, the old `ProjectCard` prompt box, `HostedDispatchButton`, the orphan Atlas page, `/api/decisions/feed`, `/api/agents`.
8. One status vocabulary in Loki (fold the eight files; a source-grep test that fails on a new "Needs you" literal); one relative-time helper (whenkit); route the 120 hand-written envelopes through `route-helpers`.
9. Packages first, for real: OrangeCat's three non-Cat chats onto chatkit; both repos' model calls onto ai-kit `complete()`/`usableChain()` (−1,266 lines in OrangeCat, the 3 direct Groq callers in Loki); retire next-auth.
10. Retire the hosted runner from the code paths or give it a unit; one writer for presence; `OnFailure=` on `fc-cron@`; make the 20-minute purge visible or longer.
11. Reconcile OrangeCat's RLS rule with its 26 admin-client routes (rewrite the rule to "admin client ⇒ explicit, tested ownership check").
12. Reset the docs-truth baselines to zero after a path-fixing pass (35 + 23 dead paths), archive the dated plans, and make `surfaces.md` generated from the surface table rather than written.

**Later (as the roadmap already says).** Private builders for the first non-owner tenant, sealed builds, the box pool, BYOK by default, signed installers. None of these should start before the "one brain, one box" items above, because each multiplies the surfaces that would otherwise have to be cleaned twice.

**The one structural change.** Write the surface matrix (§2) as configuration in Loki: `audience`, `job`, `box`, `entry`. Have the sidebar, the project page's rows, the widget's "Continue in Loki" and the public "How it works" read it. Then a new screen earns its place by adding a row, and the question this review answers stays answered.

---

## Appendix A. Process inventory (Loki, the box)

| Process | Runs as | Trigger | Alive when |
|---|---|---|---|
| loki-app (:4002) | systemd, box | always | `/api/health` ok, commit |
| loki-box-runner (owner's cloud builder) | systemd, `ubuntu`, holds DB password + org token + agent sign-ins | always | Control "Cloud builder online"; `/api/health/builder` |
| loki-box-runner@&lt;tenant&gt; | systemd template, sandboxed user, no DB | always, per `users.private_builder` | `systemctl list-units` |
| loki-tenants.timer → reconcile-tenants.sh | root, every minute | timer | list-timers |
| loki-runner-restart-* | transient, after a runner-code deploy | waits up to 6 h for idle | journal `loki-drain` |
| Fleet Runner (desktop) | user's machine | app open | tray, "This computer" |
| hosted-runner (Hermes) | **no unit, no installer** | poll loop if started by hand | not verified; code says inactive |
| inspection worker | inside the project agent's PTY | a review is started | `site_reviews.status` |
| loki-bridge (:4001) | systemd (unit hand-written, not in repo) | always | `/healthz` |
| loki-mailgate (:25) | systemd | always | journal |
| loki-embed + loki-reindex.timer | systemd, manual installer | always / 03:30 | not verified |
| Telegram notify bot | inside loki-app, webhook | request | Settings → Notifications |
| MCP | inside loki-app | request | 401 challenge |
| 26 `fc-cron@` timers | box → `127.0.0.1:4002/api/crons/*` | 15-min to daily | list-timers; **no OnFailure** |
| ~34 `appcron-*` timers (other apps) | installed from Loki | timers | list-timers |
| ~15 monitoring timers | installed from Loki (mostly by hand) | 5-min to daily | `/system` |
| GitHub Actions | CI → Deploy; auto-merge sweep (hourly + per CI run, reconciles deploy); uptime hourly | events | Actions tab |

## Appendix B. Numbers used in this review

| | Loki | OrangeCat |
|---|---|---|
| App code (lines) | 266,440 in `src/` + 129,677 in `scripts/` (90k tests) | 302,119 in `src/` |
| API routes / pages / components | 355 / 102 / 482 | 312 / 196 / 594 |
| Config files / migrations | 85 / 135 | 179 / 136 |
| Test files | 577 (565 run; 10 fail without Chromium) | 690 (661 in the unit lane; 5,560 tests pass) |
| Docs | 92 files, 35 dead paths | 412 files (58 % archived), 23 dead paths in live docs |
| Commits since 1 Oct | 540, 100 % via sweep, fix:feat 0.76 | 297, 100 % via sweep, 27 % dependency bumps |
| Files over the repos' own size limits | 63 components, 35 routes, 14 services | 71 (43 in categories the gate does not check) |
| Open PRs / issues today | 22 / 11 | 17 / 3 |

## Appendix C. What was not verified

Signed-in flows as the real owner (no credentials in this session); whether the hosted runner, loki-embed and the reindex timer run on the box; AMO publication of the extension; which customer sites opt into the widget's chatkit variant; the build-intent handoff and Loki → OrangeCat publishing (need an owner session); the all-time history before May 2026 (shallow clones); token-level clone pairs in Loki (jscpd not available offline).
