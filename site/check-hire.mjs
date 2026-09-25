// What the intake must keep doing — checked in a real browser, because every
// rule below was broken at least once by a change that looked harmless.
//
//   node site/check-hire.mjs http://127.0.0.1:8731     (python3 -m http.server in site/dist)
//   node site/check-hire.mjs https://bitbaum.orangecat.ch
//
// It pins: the published rates are on /hire/ (they were removed once and put
// back); the copy speaks for the company, never "I"; no email address is
// rendered anywhere, because the form is the only door; an incomplete request
// costs no network call; a filled honeypot stores nothing while telling a bot
// exactly what a person is told; the engagement a reader clicked reaches the
// payload; one submission makes exactly one request, shaped the way Loki's
// feedback route expects; a failure leaves the visitor a way forward; and a
// venture page carries the same working door.
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
await page.goto(base + "/hire/", { waitUntil: "networkidle" });
say(errors.length === 0, `no page errors${errors.length ? ": " + errors[0] : ""}`);

const html = await page.content();
const prices = html.match(/CHF [0-9,]+/g) || [];
say(prices.length >= 3, `rates are published (${[...new Set(prices)].join(", ")})`);
const text = await page.innerText("main");
say(!/\bI\b|\bmy\b/.test(text), "no first-person voice in the page text");
say(!/mailto:/i.test(html) && !/@orangecat\.ch/i.test(html), "no mailbox or mailto: is rendered anywhere");

// an incomplete request never reaches the network
await fill("#f-waitlist-email", "nope");
await fill("#f-waitlist-what", "short");
await page.click("#form-waitlist button[type=submit]");
await page.waitForTimeout(200);
say(posts === 0, "a bad address is refused without a request");
await fill("#f-waitlist-email", "someone@example.com");
await page.click("#form-waitlist button[type=submit]");
await page.waitForTimeout(200);
say(posts === 0, "and too little detail is refused too");
say((await page.textContent("#form-waitlist ~ .form-status")).length > 0, "both say why");

// honeypot: a bot is answered exactly as a person is, and nothing is sent
await page.$eval('#form-waitlist [name="website"]', (el) => (el.value = "Acme"));
await fill("#f-waitlist-what", "We have an inherited Rails app nobody understands.");
await page.click("#form-waitlist button[type=submit]");
await page.waitForTimeout(250);
say(posts === 0, "a filled honeypot sends nothing");
say((await page.textContent("#form-waitlist ~ .form-status")).includes("Request sent"), "but is told what a person is told");

// the engagement a reader clicked reaches the payload
await page.reload({ waitUntil: "networkidle" });
await page.click('[data-engagement="Rescue"]');
await fill("#f-waitlist-name", "Probe Tester");
await fill("#f-waitlist-email", "someone@example.com");
await fill("#f-waitlist-org", "Acme AG");
await fill("#f-waitlist-what", "We have an inherited Rails app nobody understands.");
await page.click("#form-waitlist button[type=submit]");
await page.waitForTimeout(600);
say(posts === 1, `one submission makes exactly one request (${posts})`);
say(/^fcw_/.test(last?.token ?? ""), "it carries the widget token");
say((last?.suggestion ?? "").includes("Engagement: Rescue"), `the engagement is recorded (${(last?.suggestion ?? "").split("\n")[0]})`);
say((last?.contact ?? "").includes("Probe Tester") && (last?.contact ?? "").includes("Acme AG"), `the contact is recorded (${last?.contact})`);
say((last?.page ?? "") === "/hire/", `the page is recorded (${last?.page})`);
say(await page.$eval("#form-waitlist", (f) => f.hidden), "and the form gets out of the way");

// a failure must still leave a way forward, and must not name an address
await page.reload({ waitUntil: "networkidle" });
await page.route("**/api/feedback", (r) => r.abort());
await fill("#f-waitlist-name", "Probe");
await fill("#f-waitlist-email", "someone@example.com");
await fill("#f-waitlist-what", "We have an inherited Rails app nobody understands.");
await page.click("#form-waitlist button[type=submit]");
await page.waitForTimeout(600);
const err = await page.textContent("#form-waitlist ~ .form-status");
say(/try again/i.test(err), `a failed request says what to do: "${err.trim().slice(0, 60)}"`);
say(!/@/.test(err), "and does not fall back to an address");
say(!(await page.$eval("#form-waitlist button[type=submit]", (b) => b.disabled)), "the button is usable again");
await ctx.close();

// ── a venture page asks by chat, and a person is one field away ─────────────
// The four-field "Ask about X" form became the site's chat (@bitbaum/chatkit):
// the Cat and Loki answer at once, and "Send to a person" posts the whole
// conversation to the same inbox — still recording which product it was about.
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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
await p2.goto(base + "/loki/", { waitUntil: "networkidle" });
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

await browser.close();
console.log(fail ? `\n${fail} FAILED` : "\nall intake checks passed");
process.exit(fail ? 1 : 0);
