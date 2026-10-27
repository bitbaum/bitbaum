# The site's two chats — package audit (2026-10-27)

Why this exists: the owner tried the intake on `/hire/#waitlist` from a phone,
said "build me", and the box read "build build me build me"; there was no way
to attach a screenshot; and every message got the same canned reply. This
file records what the site's chats are built from, how the bundle reaches the
box, what was wrong and what was changed. Check it again before trusting it:
versions move.

## The two chats

| | Front desk | Intake — "the studio's one door" |
|---|---|---|
| Where | the home page and every venture page (`#ask`) | `/hire/#waitlist` (studio) and `/partners/#join` (partner) |
| Mount | `chatMount()` in `site/build.mjs` → `[data-chat]` | `intakeMount()` in `site/build.mjs` → `[data-intake]` |
| Code | `Chat` in `site/chat/chat.tsx` | `Intake` in `site/chat/chat.tsx` (view) + `site/chat/intake-flow.mjs` (logic, tested by `site/intake-flow.test.mjs`) |
| Who answers | Cat and Loki, from Loki's public fleet map — `POST /api/widget/chat` | Loki — `POST /api/widget/chat` with `mode: "intake"` |
| Where words are kept | nowhere until "Send to a person" (`POST /api/feedback`, with the pictures) | saved FIRST on every turn: `POST /api/studio-intake` (website brief or partner application, private portal) or `POST /api/feedback` (waitlist note); later turns go to the same record |
| Pictures | up to 3 per message, to Loki's vision chain for the answer, and with "Send to a person" | up to 3 per message, to the record (feedback `screenshots`) and to Loki's answer |
| Mic | widget transcription route, server first | same |

## Fleet packages

| Package | Version | Used by the chats? | How | Verdict |
|---|---|---|---|---|
| `@bitbaum/chatkit` | 0.18.0 (`package.json` `^0.18.0`) | yes, both | `ChatThread`, `Composer` (attach, voice), `ChatStarters`, `richAnswerText`, `chatkit.css` | correct piece. `ChatApp` (0.18) is NOT used, on purpose: it is a whole-screen app — chat list drawer, New chat, rename/delete, store, `fill="viewport"` — and these chats are one section of a page with no history to keep. The thread + composer embedded is chatkit's own frame for that. If the front desk ever keeps conversations across visits, move it to `ChatApp` with `localConversationStore`. |
| `@bitbaum/design-tokens` | 1.2.0 | indirectly | the site's tokens; chatkit's CSS reads the same variable names | fine |
| `listkit` (`@bitbaum/listkit`) | 0.2.1 | no | `/work/` and `/packages/` filters | not a chat piece |
| `bip-kit` | 0.6.x | no | package pages | not a chat piece |
| `@bitbaum/searchkit` | — | no | — | nothing to search inside a two-chat page; the answers search the fleet map on Loki's side |
| `@bitbaum/whenkit` | — | no | — | nothing is scheduled from here; dates are never promised |
| `@bitbaum/accountkit` | — | no | — | see "Coming back to a request" |
| `@bitbaum/ai-kit` | — | no (server side is Loki's) | Loki's route calls its own model chain and vision chain (`src/lib/vision.ts` in bitbaum/loki) | fine: the site holds no keys |

Custom code, by design: the two `fetch` transports, the waitlist/portal
filing rules (`site/chat/intake-flow.mjs`), the "Send to a person" field, and
the link chips under answers. Everything the visitor touches — the box,
attach sheet (Camera · Photos · Files), thumbnails, mic, send/stop, retry,
copy, 16px text, 44px targets — is chatkit's, and the site no longer
overrides the composer's shape (`site/styles.css` used to force a 14px
radius).

## What the bundle contains, and how it is built and served

- `site/build.mjs` bundles `site/chat/chat.tsx` with esbuild into
  `site/dist/chat.js` (about 315 KB minified, about 100 KB gzipped: react-dom
  about 210 KB, chatkit about 75 KB, the site's own code about 16 KB) and copies
  chatkit's `styles.css` to `site/dist/chatkit.css`. Pages load both lazily,
  near the chat or when the page is idle.
- The first line of `chat.js` names the chatkit release
  (`/* @bitbaum/chatkit 0.18.0 — … */`) and every mount carries
  `data-chatkit="0.18.0"`.
- Deploy: `.github/workflows/deploy-site.yml` on `main` installs from the
  lockfile, rebuilds everything (`--require-fresh`) and publishes with
  `site/publish.sh`; afterwards a generated PR proposes the rebuilt
  `site/dist` back to `main`.

## The stale bundle — what actually happened

- The SERVED bundle is always rebuilt in CI from the lockfile, so it was as
  current as the lockfile. The lockfile was the problem: `@bitbaum/chatkit`
  stayed on `^0.12.0` (locked 0.12.0) until #145 raised it to `^0.17.1` on
  2026-10-27 09:53 UTC. chatkit 0.15.2 had fixed Android dictation repeating
  each cumulative partial; the site ran 0.12.0 for every release since. The
  owner's "build build me build me" is that bug.
- Measured after #145 deployed: `https://bitbaum.orangecat.ch/chat.js` was
  byte-identical to a fresh build from chatkit 0.17.1 (which contains the
  fix), while the COMMITTED `site/dist/chat.js` was still the 2026-10-22
  build from 0.12.0. Nothing checked the committed bundle against the
  lockfile — the PR check rebuilt `dist` before running `--check`, so `--check`
  could never fail on it. (Grepping the minified bundle for `heardFromResults`
  proves nothing either way: minification renames functions.)
- Fixed:
  1. `node site/build.mjs --check-bundles` compares the committed `chat.js`,
     `chatkit.css`, `tokens.css` and `vendor/listkit/*` with what the
     installed packages build, and names both chatkit versions when they
     differ. The PR check runs it BEFORE rebuilding, so a dependency bump
     without its rebuilt bundle fails in review.
  2. The chatkit version is stamped in the bundle and on every mount.
  3. `site/publish.sh` reads the served `chat.js` after publishing and fails
     when its version is not the installed one.
  4. The mic now prefers the server transcription route (`prefer: "server"`),
     so a phone's own recogniser can no longer feed repeated partials into
     the box at all; the browser recogniser stays as chatkit's fallback.
- Not fixed here: nothing raises the site's chatkit floor when chatkit ships.
  chatkit's README asks for Renovate/Dependabot in every app; this repo has
  neither. With `--check-bundles`, a Dependabot bump would fail until someone
  rebuilds `dist` on its branch — the right next step is a workflow that
  rebuilds and pushes `site/dist` on Dependabot branches, or the fleet's
  floor-raising PRs (like #145) carrying the rebuild.

## Coming back to a request ("authentication")

What a visitor can do today:

- **Website brief or partner application** (`/api/studio-intake`): a private
  portal link `/portal/#id=…&key=spt_…` — the key is the only credential and
  never leaves the URL fragment. The tab remembers it (`sessionStorage`, read
  by `site/portal/portal.js`); an email given at any point receives the link;
  a lost link can be re-sent to that address from `/portal/`
  (`/api/studio-recover`, which never says whether the address matched).
- **Waitlist note without a website** (`/api/feedback`): a "Track this
  request" link to Loki's claim page, mailed when an email is given. No
  portal; an account on Loki is optional there.
- **Approved partners** can connect the application to their OrangeCat
  account from the portal and later sign in with OrangeCat to reopen it.

Missing compared with the products: a client (not a partner) cannot keep a
request with an account — sign-in with OrangeCat, the fleet's identity root,
is offered only to approved partners; and the chats themselves keep no
history across visits. Recommendation: after the first saved message, offer
"Keep this request with your OrangeCat account" on the portal for every
request kind, reusing the partner hand-off Loki already has (a short-lived
signed id from the portal to Loki's `/studio/connect`). That needs a Loki
change to accept non-partner requests there, so it is not in this change.
Never require it: the private link with no account stays the default.

## Overlaps

The floating feedback widget is told never to cover either chat
(`data-fc-avoid` on both mounts). The cat no longer sits on a stage that
holds a chat, nor on the footer when a chat ends within a screen of it
(`site/lodge.mjs`).
