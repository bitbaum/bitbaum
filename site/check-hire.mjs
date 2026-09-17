// What /hire/ must keep doing — checked in a real browser, because every rule
// here was broken once by a change that looked harmless in the diff.
//
//   node site/check-hire.mjs http://127.0.0.1:8731     (a local `python3 -m http.server` in site/dist)
//   node site/check-hire.mjs https://bitbaum.orangecat.ch
//
// It pins, in order: the published rates are on the page (they were taken down
// once and put back); the copy speaks for the company, never "I"; an invalid
// address costs no request; a filled honeypot stores nothing while telling a
// bot exactly what a human is told; clicking an engagement carries WHICH one
// into the signup, which is the only reason the list is a demand signal; one
// submission makes exactly one request; and a FAILED request still leaves the
// visitor a way in, because the endpoint lives on another host that can be
// down while this static page is fine.
import { createRequire } from "node:module";


// Playwright lives in whichever sibling checkout installed it; this repo has no
// node_modules of its own and is not about to grow one for a check.
const require_ = createRequire(import.meta.url);
const DEV = process.env.DEV_ROOT ?? `${process.env.HOME}/dev`;
let pw;
for (const where of ["playwright", `${DEV}/solon/node_modules/playwright`, `${DEV}/loki/node_modules/playwright`]) {
  try {
    pw = require_(where);
    break;
  } catch {
    /* try the next one */
  }
}
if (!pw) {
  console.error("playwright not found — install it, or set DEV_ROOT to a checkout that has it");
  process.exit(2);
}
const base = process.argv[2];
if (!base) {
  console.error("usage: node site/check-hire.mjs <base-url>");
  process.exit(2);
}
const browser = await pw.chromium.launch();
let fail = 0;
const say = (ok, m) => { if (!ok) fail++; console.log((ok ? "PASS " : "FAIL ") + m); };

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
let posts = 0;
let lastSource = "";
await page.route("**/api/newsletter", async (route) => {
  posts++;
  const body = JSON.parse(route.request().postData() || "{}");
  lastSource = body.source;
  say(/^bitbaum-hire/.test(body.source), `posts source=${body.source}`);
  say(!!body.email, `posts an email (${body.email})`);
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, subscribed: true }) });
});

await page.goto(base + "/hire/", { waitUntil: "networkidle" });
say(errors.length === 0, `no page errors${errors.length ? ": " + errors[0] : ""}`);
const html = await page.content();
const prices = (html.match(/CHF [0-9,]+/g) || []);
say(prices.length >= 3, `rates are published on the page (${[...new Set(prices)].join(", ")})`);
say(!/\bI\b|\bmy\b/.test(await page.innerText("main")), "no first-person voice in the page text");

// invalid address: refused locally, nothing sent
await page.fill("#wl-email", "nope");
await page.click("#waitlist-form button");
await page.waitForTimeout(200);
say(posts === 0, "an invalid address is refused without a request");
say((await page.textContent("#wl-status")).includes("email address"), "and says why");

// honeypot: a bot is told the same thing, and nothing is stored
await page.fill("#wl-email", "bot@spam.test");
await page.$eval(".hp", (el) => { el.value = "Acme"; });
await page.click("#waitlist-form button");
await page.waitForTimeout(200);
say(posts === 0, "a filled honeypot sends nothing");
say((await page.textContent("#wl-status")).includes("on the list"), "but says the same thing a human is told");

// clicking an engagement carries WHICH one into the signup
await page.reload({ waitUntil: "networkidle" });
await page.click('[data-interest="rescue"]');
await page.waitForTimeout(150);
say(!(await page.$eval("#wl-interest-note", (e) => e.hidden)), "clicking an engagement says which one you are joining for");
await page.fill("#wl-email", "rescue@example.com");
await page.click("#waitlist-form button");
await page.waitForTimeout(600);
say(lastSource === "bitbaum-hire-rescue", `the row records the engagement (${lastSource})`);

// the real path
await page.reload({ waitUntil: "networkidle" });
const before = posts;
await page.fill("#wl-email", "someone@example.com");
await page.click("#waitlist-form button");
await page.waitForTimeout(600);
say(posts - before === 1, `a valid address posts exactly once (${posts - before})`);
const status = await page.textContent("#wl-status");
say(status.includes("on the list"), `confirms: "${status.trim().slice(0, 60)}"`);
say(await page.$eval("#waitlist-form", (f) => f.hidden), "and the form gets out of the way");

// failure path must still leave a door
await page.reload({ waitUntil: "networkidle" });
await page.route("**/api/newsletter", (r) => r.abort());
await page.fill("#wl-email", "someone@example.com");
await page.click("#waitlist-form button");
await page.waitForTimeout(600);
const err = await page.textContent("#wl-status");
say(err.includes("cato@orangecat.ch"), `a failed request names the mailbox: "${err.trim().slice(0, 70)}"`);
say(!(await page.$eval("#waitlist-form button", (b) => b.disabled)), "and the button is usable again");

await browser.close();
console.log(fail ? `\n${fail} FAILED` : "\nall form checks passed");
process.exit(fail ? 1 : 0);
