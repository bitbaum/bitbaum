# Bitbaum changelog

Completed changes are recorded here; unfinished work stays in [ROADMAP.md](ROADMAP.md).

## 2026-10-02 — The map

- New page, /map/: every project drawn as a loop, meaning work that recurs and still needs a person in it. Four layers: the rails (OrangeCat, Solon, Loki and the shared packages), the constraints (Substrata), professionals in the loop, and loops in the world. Each loop names who stays in it and what routine part it aims to retire.
- The loops live in `site/overrides.json` (`loops`). The build fails if a loop cites a project the site does not show, if a project is in two loops, or if a shown project is in none, so a new project cannot reach /work/ without someone deciding what it is for.
- A loop with no project is drawn as a gap and claims nothing. Allocating money is the first: named, not built, and explicitly not advice.
- Diplodoctor and Causius now describe their own plans: a licensed clinician, or a licensed lawyer, stays in the loop and owns the result. Both remain "not built".
- 138 responsive checks pass, including the new page.

## 2026-10-02 — The cast is accounted for

- `site/cast.json` names every painted or drawn element once; the build finds each one on the pages it renders and writes the register (`dist/cast.json`, `docs/CAST.md` — what is where, how it moves, what shows on phones). It refuses to build when an element is on no page or a painting belongs to no entry. The first run found one: the hummingbird avatar was assigned to a venture that does not exist, so it was on no page — it now lives on Camille's bakery.
- `site/check-cast.mjs` opens every page at phone and desk width and proves each element is in the DOM, loaded and sized where the register says; it runs in CI with the other checks.
- Quixote and Sancho ride into the plain toward the mill — near and large first, then up and away, smaller and hazier — instead of along the horizon line.
- The header steps aside while the reader reads down and returns on the first scroll up; never while the menu is open.

## 2026-10-01 — The sky obeys the weather

- One table in `site/sky.mjs` (`WX`) says what each weather does: the sky's gradient by day and night, how much sun, moon and stars show, how many clouds and how bright, what falls, how hard the wind blows. Everything that draws reads it; nothing tests a weather by name any more. Rain is an overcast with no sun, mist veils it, snow dims the stars.
- Quixote and Sancho ride out of the haze: small and far first, nearer and larger as they come toward the mill, instead of sliding along a line.
- On a phone the clouds keep to the band above the first screen's words.

## 2026-10-01 — One door

- The studio's intake is one field, typed or spoken, on /hire/ and /partners/: no form, nothing refused for its shape. A website in the text makes a studio request; on /partners/ the message is the application; anything else is asked one question and joins the waitlist. Every request gives the visitor its private portal link; follow-ups go to the same record; a retry reuses the same receipt.
- The three paths say true things everywhere: the free tool is one address, the studio shows its fixed price and its day rate, and partners read "applications open · none approved yet" with the systems design course named as the step before review.
- The browser checks drive the conversation instead of the forms; 135 responsive checks still pass.

## 2026-09-30 — Start the shared studio portal and course pilot

- Build a Bitbaum brief intake, request receipt and private customer/partner portal backed by Loki's scoped request API.
- Keep free Loki self-service independent, with an explicit draft-preserving handoff. Studio offer and current capacity stay in hire.json; Rescue retains its assessment scope.
- Add course evidence, separate studio approval, consented profile review and assigned-brief delivery. Availability determines public directory inclusion.
- Write the first systems design lesson, exercise and capstone rubric. Further lessons and calibration remain in development.
- Render the canonical roadmap and changelog through bip-kit, and resolve the studio repository through its canonical project ID.
- Verify the scoped backend in Loki's full CI, including PostgreSQL isolation, revocation, assignment and retry tests. Bitbaum's browser journeys and 135 responsive checks pass, including rotation and enlarged text; the narrow-screen footer and price wrapping are corrected.
- Production release is gated on the backend migration and API availability. The first real engagement and reviewer calibration remain pilot work.

## 2026-09-30

### Recorded
- Added the studio roadmap and delivery plan. Recorded free, independent Loki access; studio-only engagement prices; course completion before studio partner approval; and optional product participation. Course, portal and intake-placement corrections remain planned.

### Changed
- Mobile artwork has grounded spaces away from copy. All 123 responsive page/viewport checks passed, including rotation and enlarged text.
- Partner applications use a direct message and tracking receipt. Submission records interest for review; it does not confer approval.
