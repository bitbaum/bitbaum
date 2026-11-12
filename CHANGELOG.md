# Bitbaum changelog

Completed changes are recorded here; unfinished work stays in [ROADMAP.md](ROADMAP.md).

## 2026-11-12 — What two adversarial reviews found

The two changes below were read again by reviewers told to break them. Ten findings held; a scan of every page at twice the text size, added to settle two of them, found more of the same kind. The fixes were then reviewed the same way before they were opened for merge, and that review found nine more that held, all made by the fixes themselves: six in what a visitor sees and three in the new checks. All are fixed here, and each now has a check.

- "Request this builder" landed at the top of `/hire/`, with the line saying who was asked for 5,400px down on a phone. Arriving with a builder chosen now goes to the box, which names the builder; the cursor is not put in it, so no keyboard opens unasked. A reader who has already started down the page is not taken anywhere.
- After the first message the page jumped up about 300px and left the receipt and the box under the fold, with the cursor still in the box. Both stay on screen, after a failed send too, in the contact box and in the small chat on the home page and every project page. A reader who scrolls away while a reply is pending is left where they are: the first version of this fix pulled them 500px back down when the reply arrived. The cause is in the chat package and is fixed there as well (chatkit #88).
- A link to the box ("Join the waitlist") put the cursor in it while it was still two screens down on a phone, which opens the keyboard over the text. The box takes the cursor only when it is in sight, and the page is asked once it has come to rest: asked while it was still gliding, a box about to be on screen on a desk was left without the cursor.
- `/builders/` said an approved builder publishes a profile and that it is shown "when you say so". The builder proposes it and the studio reviews it before it is listed; the page says that.
- `/hire/` promised a reply "in your private portal" for every request, its questions said the only email is the one about a slot, and the box offered "the reply by email" to everyone. A first message with no website address gets a page that follows the note, not a portal, and an email address gets a link to that page; nothing mails a person's reply to a note. The page, the prompt and what the box says after an address now say what happens for each kind of request.
- "A studio and its builders" in the footer, the home page's description and the picture a shared link shows. No builder is listed yet. The footer and the description read "A studio in Zürich, and a place for builders who work with agents."; the picture says the same without the city.
- `/solon/` and `/loki/` still called Solon's four closed kinds of decision fixed "red lines" after the map stopped. Each organisation can change that list by a vote, and both pages say so.
- At twice the text size on a phone: `/studio/`, the home page and eight project pages were wider than the screen, the "what happens next" lists broke words letter by letter, and badges and prices on `/hire/`, `/map/` and `/work/` were cut off by their cards. All 48 pages are clean at 320px and 390px. At the normal size nothing moves: no button label and no link in running text takes more lines than before, at eight widths from 320px to 1440px. (The first version of this fix made ten button labels wrap on phones and split two-word links on `/studio/` across lines.)
- A file that is not a picture, sent with no words, filed a request that said "See the picture." It now says why beside the box, files nothing, lets go of the file, and starts no conversation.
- On a phone the three kinds of button are one size. Without JavaScript the menu link sits at the right edge, where the button is. A portal entry with no time shows no time, not 1 January 1970. A directory entry prints only the parts of a profile that exist ("null · undefined" was a rate line), offers "Request this builder" only with an id `/hire/` accepts, and "View their work" only for a web address.
- The checks themselves: "opens at the top" fails when the chat never loads (it passed). The contrast check reads the contact box after a message is sent and fails if no reply or receipt appears, and reads every kind of weather or none. The large-text check covers every page at two widths with the chat loaded (it covered five pages at one width, before the chat), and catches text cut off by its own card inside the screen. `check-hire` pins the box and the receipt on screen after a message and after a failure, the arrival with a builder, the cursor after the page glides, the reader who scrolls away, and the file that is not a picture. Nine of its new cases fail on the site as it was published before this change.

## 2026-11-12 — Readable on the real sky, and the assistant says who it is

- Text was measured against the sky as it is painted, not against its cream base. In the light theme the top of the sky is blue, and small grey text over it read 2.4:1 to 3.0:1 where 4.5:1 is the line; in rain even the main text fell to 3.3:1. Secondary text is now near the ink, the day rain sky is a bright overcast, and the contrast check measures every page against the darkest day sky as well. The dark theme's smallest labels are lighter.
- At the door on `/hire/` and `/builders/`, the first thing that answers is Loki, and it now says so: "Loki, the studio's assistant" stands over the prompt and every line it speaks. The card that promised "a reply from a person" says what happens: questions now, a person's answer later.
- `/hire/` shows the rates before the detour to Loki, and beside the box it says what happens when a message is sent.
- `/work/`, `/packages/` and every project page show their content on the first screen. An empty band a screen tall, left over from a floor that had moved, sat under each headline.
- Package names stay on one line. They broke mid-word ("threadk / it") on 15 of 18 tiles on a phone.
- The builders page and the course end with "Apply as a builder", not "Start a project".
- A wrong address gets a page with the header and four ways on (once Caddy is told to serve it; see `site/DEPLOY.md`).
- Words the site's own rules forbid are gone from public pages: "client" on `/work/` and `/private/`, "partner" in the course. The map no longer calls Solon's starting rules "red lines". evig's story no longer attributes it to another organisation, and Hirnli's no longer claims daily use that nothing here can check.
- Dates in the portal read "30 Sept 2026, 14:05", not "9/30/2026, 12:00:00 AM".

## 2026-11-12 — Pages open at the top, and builders get a door

- `/hire/` and `/builders/` opened scrolled down to the contact box: 3,400px down on a desk, 5,500px on a phone, past the headline and the prices. The chat's thread took the page to its own end when it loaded. Both pages now open at their top, the greeting stands above the box as a prompt, and the browser check fails if any page opens anywhere but its top. The cause is fixed in the chat package too (chatkit #84).
- The home page has two doors on its first screen: "Start a project" and "Become a builder". A new section, "Build here, under your own name", says what a builder gets.
- `/builders/` is a landing page for builders: what an approved builder gets, how approval works, the application with what happens next beside it, then the directory. It says in words that no builder is listed yet and nobody is promised work.
- After a request is sent, its private link appears above the box, where the reply names it. It used to appear under the box, off the screen. On the portal, "Copy your private link" copies it; the old control reloaded the page.
- "Request this builder" keeps the builder when the first message has no website address, and the page says who was asked for.
- A brief brought over from Loki takes the visitor to the filled box and says it arrived.
- The header, the menu and the footer use one word per place: Work, Builders, Packages, Studio. The phone menu is no longer see-through, keeps the keyboard inside it while open, and without JavaScript the menu button leads to the site map in the footer.
- One button shape. Three families of button, 2px apart in every dimension, are now one with three fills. Step titles in a row sit on one line; four of a kind are two and two.
- The picture a shared link shows carries the site's tree mark and green. It still carried an older mark and OrangeCat's orange.
- `/packages/` gets its "Where next" buttons back; `/academy/` no longer sends someone who has not applied to an empty portal.

## 2026-11-11 — No more broken pictures on the figures

- The painted figures that move (the fox on `/work/`, the cat, the whale and the rest) could turn into a white box with Chromium's sad face, and on the running fox it crossed the screen. Each figure held its own WebGL context, so a phone with many tabs, or one sent to the background, dropped them. Now one context serves the page and draws into plain 2D canvases, which never show that face; if the context is lost anyway, every figure goes back to its still painting.
- `node site/check-figures.mjs <base-url>` pins it in a real browser: at most one WebGL context per page, the figures really draw, and after a forced context loss every still painting is back. CI runs it before publishing.

## 2026-10-30 — Partners are builders

- The independent people the studio approves on their work are now called builders: "Hire a builder" on the homepage, `/builders/` for the directory and the application, and "Become a builder" in the footer. "Partner" read as co-ownership or a revenue share, which is not on offer.
- `/partners/` forwards to `/builders/`, keeping any `#join` in the link.
- "Builders in the loop" is written down as the positioning in `site/PURPOSE.md`: agents do the typing, and a builder owns the judgement.

## 2026-10-29 — Facts brought up to date

- OrangeCat no longer offers "top up in sats": its checkout stays closed until the company is registered (`PAID_PLANS_OPEN`; orangecat.ch/pricing says "Not open yet"). "Sign in with OrangeCat" now says what it is: one account across the studio's apps, Loki and Solon among them.
- Loki names its six agent adapters as the code does (Antigravity, not Gemini; OpenClaw added), and Fleet Runner is the desktop app, not a second thing.
- Solon's red lines list all four humans-only categories, and the map and the stack say members vote with one click or sign, not that every vote is signed.
- Removed an unsourced recovery-rate claim from the Fundbüro concept.
- Package pages name adopters the packages register shows: design-tokens is shared by Loki, Solon, Skif, Substrata and this site (not OrangeCat); sitekit by Camille, Substrata and Skif; threadkit no longer names a private client app or says OrangeCat "will" adopt it, because it already has.

## 2026-10-27 — Checked publication snapshots

- Publish checked source facts from main and propose generated snapshots through the normal pull-request gates, including generated cast documentation. Stop writing generated changes directly to main.

## 2026-10-27 — Package publication verification

- Validate each package card against its own registry version and source, independently of accessible-label wording. Detect stale displayed versions even when packages share the same release number.

## 2026-10-26 — Package references with source evidence

- Expanded each package page with source-pinned API documentation and examples,
  repository changelogs and published release notes, section navigation and
  linked declared consumers. Release facts and current-source documentation are
  distinguished, and missing history is shown honestly.
- Package source failures stop a fresh publish. Expanded-documentation browser
  checks cover phone/desktop widths and both themes before publication.

## 2026-10-02 — The map

- New page, /map/: every project drawn as a loop, meaning work that recurs and still needs a person in it. Four layers: the rails (OrangeCat, Solon, Loki and the shared packages), the constraints (Substrata), professionals in the loop, and loops in the world. Each loop names who stays in it and what routine part it aims to retire.
- The loops live in `site/overrides.json` (`loops`). The build fails if a loop cites a project the site does not show, if a project is in two loops, or if a shown project is in none, so a new project cannot reach /work/ without someone deciding what it is for.
- A loop with no project is drawn as a gap and claims nothing. Allocating money is the first: named, not built, and explicitly not advice.
- Diplodoctor and Causius now describe their own plans: a licensed clinician, or a licensed lawyer, stays in the loop and owns the result. Both remain "not built".
- 138 responsive checks pass, including the new page.

## 2026-10-08 — The private link cannot be lost

- A studio request or partner application has no account; its private link is the key. Now the link also goes to the email given — at the start, or added later in the same conversation — and the portal page has "Lost the link?": the address you gave gets a fresh link to every open request under it, and the old one stops working (Loki `/api/studio-recover`).

## 2026-10-02 — They move the way they would

- The standing animals (Heidi's cow, the diplodocus, the elephant, the deer, the rabbit, the cat and the kit) graze along their floor: a slow walk to a spot, a rest, a turn, a slow walk back.
- On the partners' meadow the deer comes toward us over minutes and the giant in the fog paces.
- The scarab rolls the sun along the ground; its far start no longer floats.
- The stylesheet and scripts lose the hooks of a plain that no page emits any more (the old gears, rye clump, cow and diplodocus doors, the cat's perch, the scene tumbleweed).

## 2026-10-02 — Every piece has a place

- Nothing is retired: every painting is somewhere, on the ground, one or two to a screen. The inner pages' creatures stand on the Lynch floor in perspective — the same floor as the hero's — and the hero keeps no second floor of its own when a stage follows.
- A page's objects (the soft watch and its gears, the rye, the tumbleweed, the mushrooms, the Little Prince, the dandelions, the windmill, the fog creature) stand at the page's foot with their feet on the footer's chevron band, where the cat waits — not in a grid of pictures. The gears turn, the rye and dandelions sway, the mushrooms breathe, the tumbleweed rolls through now and then.
- The long-legged elephant crosses the plain again on the "build it yourself" screen (desk only).
- Phones keep each screen to one or two things: the plain is the tree, the dome and the hummingbird; the hero's one flying thing is the whale.

## 2026-10-02 — Grounded, and the floor is black again

- The chevron floor is bone on ink in both modes. Its base colour was the foreground — white by night — so in dark mode the Red Room floor was a white slab.
- The owl's perch was a line in mid-air; its painted branch now reaches in from beyond the stage's edge.
- The fox and the cat meet: when the fox runs the floor the cat turns to face it, the fox leaps over, the cat startles and watches it go.
- On phones the riders ride too — they had been pinned still beside the rabbit and the burrow, which is what crowded the first screen. A short receding path right of the burrow, toward the mill.

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
