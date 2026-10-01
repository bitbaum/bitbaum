// What the intake must keep doing — checked in a real browser, because every
// rule below was broken at least once by a change that looked harmless.
//
//   node site/check-hire.mjs http://127.0.0.1:8731     (python3 -m http.server in site/dist)
//   node site/check-hire.mjs https://bitbaum.orangecat.ch
//
// It pins: the published rates are on /hire/ (they were removed once and put
// back); the copy speaks for the company, never "I"; no email address is
// rendered anywhere, because the waitlist intake is the only door; the intake
// is ONE free-form field with a microphone and refuses nothing — a vague line
// with no email is kept, because a request that bounces is a person lost; the
// engagement a reader clicked reaches the payload; one message makes exactly
// one request, shaped the way Loki's feedback route expects; an email given
// afterwards becomes the reply address; a failure keeps the words and can be
// retried; and a venture page carries the same working door.
import { createRequire } from "node:module";

const require_ = createRequire(import.meta.url);
const DEV = process.env.DEV_ROOT ?? `${process.env.HOME}/dev`;
let pw;
for (const where of ["playwright", `${DEV}/solon/node_modules/playwright`, `${DEV}/loki/node_modules/playwright`]) {
  try {
    pw = require_(where);
    break;
  } catch {
    /* next */
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
const say = (ok, m) => {
  if (!ok) fail++;
  console.log((ok ? "PASS " : "FAIL ") + m);
};

const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
// The live widget keeps a connection open, so "networkidle" never comes; the
// checks wait for the page's own input instead.
await ctx.route("**/widget.js", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

let posts = 0;
let last = null;
await page.route("**/api/feedback", async (route) => {
  posts++;
  last = JSON.parse(route.request().postData() || "{}");
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, claimUrl: "https://loki.orangecat.ch/claim-feedback?token=x" }),
  });
});

const fill = async (sel, v) => page.fill(sel, v);

// ── /hire/ ──────────────────────────────────────────────────────────────────
await page.goto(base + "/hire/", { waitUntil: "load" });
say(errors.length === 0, `no page errors${errors.length ? ": " + errors[0] : ""}`);

const html = await page.content();
const prices = html.match(/CHF [0-9,]+/g) || [];
say(prices.length >= 3, `rates are published (${[...new Set(prices)].join(", ")})`);
const text = await page.innerText("main");
say(!/\bI\b|\bmy\b/.test(text), "no first-person voice in the page text");
say(!/mailto:/i.test(html) && !/@orangecat\.ch/i.test(html), "no mailbox or mailto: is rendered anywhere");

const W = "#waitlist";
await page.waitForSelector(`${W} .ck-input`, { timeout: 10000 }).catch(() => {});
say((await page.$$(`${W} .ck-input`)).length === 1, "the waitlist is one field");
say((await page.$$(`${W} .ck-mic`)).length === 1, "with a microphone");
say((await page.$$(`${W} form, ${W} input[type=email], ${W} select`)).length === 0, "and no form fields to fill");

// The one door routes by what was written, never by what was filled in.
// A line with no website and no email is kept: one question, then the
// studio's waitlist (Loki's inbox) — the engagement a reader clicked travels
// with it, and no address is invented.
let intakes = 0, intake = null;
const cors = { "access-control-allow-origin": new URL(base).origin, "access-control-allow-methods": "GET, POST, OPTIONS", "access-control-allow-headers": "Content-Type, Authorization" };
await page.route("**/api/studio-intake", async (route) => {
  if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
  intakes++; intake = JSON.parse(route.request().postData() || "{}");
  await route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ ok: true, id: "4a1bbf67-7ced-411b-9eec-9bdbb975115b", status: "waitlisted" }) });
});
await page.click('[data-engagement="Rescue"]');
await page.fill(`${W} .ck-input`, "an app");
await page.press(`${W} .ck-input`, "Enter");
await page.waitForTimeout(400);
say(posts === 0 && intakes === 0, "a line without a site is not sent anywhere yet");
say(/website that already exists/i.test(await page.innerText(`${W} .ck-thread`)), "it asks the one question: is there a site?");
await page.fill(`${W} .ck-input`, "no, something new");
await page.press(`${W} .ck-input`, "Enter");
await page.waitForTimeout(600);
say(posts === 1 && intakes === 0, `"something new" joins the waitlist in one request (${posts})`);
say(/^fcw_/.test(last?.token ?? ""), "it carries the widget token");
say((last?.suggestion ?? "").includes("Engagement: Rescue"), "the engagement is recorded");
say((last?.suggestion ?? "").includes("an app") && (last?.suggestion ?? "").includes("something new"), "both lines are recorded as written");
say(!last?.contact, "no address is invented");
say((last?.page ?? "") === "/hire/", `the page is recorded (${last?.page})`);
const asked = await page.innerText(`${W} .ck-thread`);
say(/on the studio waitlist/i.test(asked) && /reply by email/i.test(asked), "the visitor is told it is kept, and that an email is optional");

// an email given afterwards becomes the reply address
await page.fill(`${W} .ck-input`, "someone@example.com please");
await page.press(`${W} .ck-input`, "Enter");
await page.waitForTimeout(600);
say(posts === 2, `the follow-up is kept too (${posts})`);
say(last?.contact === "someone@example.com", `the address is recorded (${last?.contact})`);
say((last?.suggestion ?? "").includes("an app"), "tied to the first message");

// a website in the text makes a studio request with a private portal
await page.reload({ waitUntil: "load" });
await page.waitForSelector(`${W} .ck-input`, { timeout: 10000 }).catch(() => {});
await page.fill(`${W} .ck-input`, "Make booking easier on phones at www.example-gym.ch, reply to ops@example.com");
await page.press(`${W} .ck-input`, "Enter");
const portal = page.locator(W).getByRole("link", { name: "Open your portal →", exact: true });
await portal.waitFor({ timeout: 5000 }).catch(() => {});
say(intakes === 1 && intake?.kind === "website" && intake?.target === "studio", `a website in the text opens a studio request (${intakes})`);
say(intake?.website === "www.example-gym.ch" && intake?.offerId === "rescue", `the address and the published offer travel with it (${intake?.website})`);
say(intake?.contact === "ops@example.com" && intake?.company === "", "the email is the reply address, the honeypot stays empty");
say(/^spt_[A-Za-z0-9_-]{43}$/.test(intake?.accessKey ?? "") && (await portal.count()) === 1 && (await portal.getAttribute("href")).includes(intake?.accessKey), "and the visitor holds the only key to the private portal");

// a failure keeps the words and can be retried, with the same receipt
await page.reload({ waitUntil: "load" });
await page.waitForSelector(`${W} .ck-input`, { timeout: 10000 }).catch(() => {});
await page.unroute("**/api/studio-intake");
let tries = 0; const bodies = [];
await page.route("**/api/studio-intake", async (route) => {
  if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
  tries++; bodies.push(JSON.parse(route.request().postData() || "{}"));
  if (tries === 1) return route.abort();
  await route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ ok: true, id: "4a1bbf67-7ced-411b-9eec-9bdbb975115b", status: "waitlisted" }) });
});
await page.fill(`${W} .ck-input`, "We have an inherited Rails app at legacy.example.ch nobody understands.");
await page.press(`${W} .ck-input`, "Enter");
await page.waitForTimeout(600);
const failed = await page.innerText(`${W} .ck-thread`);
say(/did not reach us/i.test(failed) && /Rails app/.test(failed), "a failed request says so and keeps the words");
await page.locator(W).getByRole("button", { name: /try again|retry/i }).first().click().catch(() => {});
await page.locator(W).getByRole("link", { name: "Open your portal →", exact: true }).waitFor({ timeout: 5000 }).catch(() => {});
say(tries === 2 && bodies[0].requestId === bodies[1].requestId && bodies[0].accessKey === bodies[1].accessKey, `retry sends the same receipt again, never a second request (${tries})`);
await ctx.close();

// ── a venture page asks by chat, and a person is one field away ─────────────
// The four-field "Ask about X" form became the site's chat (@bitbaum/chatkit):
// the Cat and Loki answer at once, and "Send to a person" posts the whole
// conversation to the same inbox — still recording which product it was about.
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx2.route("**/widget.js", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
const p2 = await ctx2.newPage();
let vposts = 0;
let vlast = null;
await p2.route("**/api/widget/chat", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify({
      ok: true,
      reply: "Loki: Sign up and I will run agents on your code.",
      messages: [{ speaker: "loki", text: "Sign up and I will run agents on your code." }],
      links: [{ label: "Loki", url: "https://loki.orangecat.ch/" }],
    }),
  });
});
await p2.route("**/api/feedback", async (route) => {
  vposts++;
  vlast = JSON.parse(route.request().postData() || "{}");
  await route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: JSON.stringify({ ok: true }) });
});
await p2.goto(base + "/loki/", { waitUntil: "load" });
say((await p2.$$("form.js-request")).length === 0, "a venture page has no request form any more");
await p2.waitForSelector("#ask .ck-input", { timeout: 10000 }).catch(() => {});
say((await p2.$$("#ask .ck-input")).length === 1, "a venture page has the chat");
say((await p2.$$("#ask .ck-composer .ck-mic")).length === 1, "and its composer has a microphone");
await p2.fill("#ask .ck-input", "Could this run for our organisation?");
await p2.press("#ask .ck-input", "Enter");
await p2.waitForSelector("#ask .ck-turn-answer .ck-md", { timeout: 5000 }).catch(() => {});
say((await p2.$$("#ask .ck-turn-answer .ck-md")).length >= 1, "a question gets an answer in place");
await p2.fill("#ask .chat-handoff input", "someone@example.com");
await p2.click("#ask .chat-handoff button[type=submit]");
await p2.waitForTimeout(600);
say(vposts === 1, `"Send to a person" posts the conversation (${vposts})`);
say((vlast?.page ?? "") === "/loki/", `recording which product was asked about (${vlast?.page})`);
say(/Could this run for our organisation\?/.test(vlast?.suggestion ?? ""), "carrying the question the visitor asked");
await ctx2.close();

// Partner applications now have their own scoped studio receipt.
const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
await ctx3.route("**/widget.js", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
const p3 = await ctx3.newPage();
let applications = 0, application = null;
// (cors headers declared above, for the /hire/ door)
await p3.route("**/api/studio-partners", (route) => route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ ok: true, partners: [] }) }));
await p3.route("**/api/studio-intake", async (route) => {
  if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
  applications++; application = JSON.parse(route.request().postData() || "{}");
  await route.fulfill({ status: 200, headers: cors, contentType: "application/json", body: JSON.stringify({ ok: true, id: "4a1bbf67-7ced-411b-9eec-9bdbb975115b", status: "course_in_progress" }) });
});
await p3.goto(base + "/partners/#join", { waitUntil: "load" });
await p3.waitForSelector("#join .ck-input", { timeout: 10000 }).catch(() => {});
say((await p3.$$("#join .ck-input")).length === 1 && (await p3.$$("#join .ck-mic")).length === 1 && (await p3.$$("#join form, #join select")).length === 0, "a partner applies in one field with a microphone, not a form");
await p3.fill("#join .ck-input", "I build booking sites. My work is at https://builder.ch/work");
await p3.press("#join .ck-input", "Enter");
const application_ = p3.locator("#join").getByRole("link", { name: "Open your application →", exact: true });
await application_.waitFor({ timeout: 5000 }).catch(() => {});
say(applications === 1 && application?.kind === "partner", "one message submits one partner application");
say(application?.website === "https://builder.ch/work" && application?.changes?.includes("I build booking sites") && !application?.contact, "the work link is the website, the words are kept, and no email is needed");
const told = await p3.innerText("#join .ck-thread");
say(/pilot course/i.test(told) && /separate/i.test(told) && !/approved\b(?! are)/i.test(told.replace(/being approved are separate/i, "")), "it names the course as the next step and does not claim approval");
say((await application_.count()) === 1 && (await application_.getAttribute("href")).includes("/portal/#id="), "a saved application offers its private portal");
await ctx3.close();

await browser.close();
console.log(fail ? `\n${fail} FAILED` : "\nall intake checks passed");
process.exit(fail ? 1 : 0);
