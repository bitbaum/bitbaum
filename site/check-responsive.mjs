// Real-browser geometry checks for the published pages. Keep decorative
// worlds out of mobile copy, including after rotation and text enlargement.
// Usage: node site/check-responsive.mjs <base-url>
import { chromium } from "playwright";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2];
if (!base) throw new Error("usage: node site/check-responsive.mjs <base-url>");
const widget = JSON.parse(readFileSync(new URL("./loki-feedback.json", import.meta.url), "utf8"));
let isolatedWidgets = 0;
// Geometry is local. Loading the real widget for 123+ page visits would
// exhaust its live boot rate limit before check-widget tests that integration.
const isolateWidget = (context) => context.route(`${widget.origin}/widget.js`, (route) => {
  isolatedWidgets++;
  return route.fulfill({ status: 200, contentType: "text/javascript", body: "" });
});
const routes = [];
function walk(dir, prefix = "") {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) walk(join(dir, entry.name), `${prefix}/${entry.name}`);
    else if (entry.name === "index.html") routes.push(`${prefix}/`);
  }
}
walk(new URL("./dist", import.meta.url).pathname);
const browser = await chromium.launch();
const failures = [];
let checked = 0;
try {
  for (const width of [320, 390, 768]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
    await isolateWidget(context);
    const page = await context.newPage();
    page.on("pageerror", (e) => failures.push(`${width}px: ${e.message}`));
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
      // A page opens at its top. /hire/ and /builders/ opened on their contact
      // box, thousands of pixels down, because the chat's thread took the
      // page to its own end when it mounted (2026-11-12). The chat loads when
      // the page is idle, so give it the time it takes before measuring.
      if (await page.locator("[data-intake], [data-chat]").count()) {
        // A chat that never mounts leaves the page at its top too: that is
        // not this check passing, it is this check not having run.
        await page.waitForSelector("[data-intake][data-chatkit], [data-chat][data-chatkit]", { timeout: 15000 })
          .catch(() => failures.push(`${width}px ${route}: the chat never mounted, so "opens at the top" was not tested`));
        await page.waitForTimeout(400);
      }
      const scrolled = await page.evaluate(() => Math.round(scrollY));
      if (scrolled !== 0) failures.push(`${width}px ${route}: opens scrolled ${scrolled}px down, not at its top`);
      const problems = await page.evaluate(() => {
        const problems = [];
        const rect = (el) => el.getBoundingClientRect();
        const overlap = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1;
        if (document.documentElement.scrollWidth > innerWidth + 1) problems.push("horizontal page overflow");
        for (const world of document.querySelectorAll(".scene-world")) {
          const copy = world.parentElement.querySelector(":scope > .bleed-body");
          if (copy && overlap(rect(world), rect(copy))) problems.push("scene overlaps its copy");
        }
        for (const stage of document.querySelectorAll("[data-art-stage], [data-art-collection]")) {
          for (const copy of document.querySelectorAll("main h1, main h2, main h3, main p, main .cta")) {
            if (overlap(rect(stage), rect(copy))) problems.push(`art overlaps ${copy.tagName}: ${copy.textContent.slice(0, 40)}`);
          }
        }
        for (const object of document.querySelectorAll(".art-object")) {
          const figure = object.querySelector(".fig");
          if (figure && rect(figure).width > rect(object).width + 1) problems.push("collection figure exceeds its slot");
        }
        return problems;
      });
      failures.push(...problems.map((p) => `${width}px ${route}: ${p}`));
      checked++;
    }
    // The first page changes geometry in place when a phone rotates.
    await page.goto(base + "/", { waitUntil: "load" });
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(100);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) failures.push("landscape: horizontal overflow");
    await context.close();
  }
  // Text at twice its size, on the two phone widths, on every page. Three
  // things a reader with large text met on 2026-11-12, none of which the
  // five-page, one-width version of this check could see: a page wider than
  // the screen (/studio/, the home page, eight project pages), words running out of their
  // card and cut off by it (badges and prices on /hire/, /map/, /work/), and
  // a sentence squeezed into a column so narrow its words broke letter by
  // letter (the "what happens next" lists).
  for (const width of [320, 390]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
    await isolateWidget(context);
    const page = await context.newPage();
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: "load" });
      await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
      await page.evaluate(() => document.fonts.ready);
      const enlarged = await page.evaluate(() => {
        const problems = [];
        if (document.documentElement.scrollWidth > innerWidth + 1) problems.push(`the page is ${document.documentElement.scrollWidth}px wide`);
        const scrollsSideways = (el) => { for (let a = el; a && a !== document.body; a = a.parentElement) if (/auto|scroll/.test(getComputedStyle(a).overflowX)) return true; return false; };
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const past = [], broken = [];
        while (walker.nextNode()) {
          const node = walker.currentNode, el = node.parentElement;
          if (!node.textContent.trim() || !el || el.closest("[aria-hidden='true'], svg, noscript, script, style")) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.display === "none" || scrollsSideways(el)) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          if ([...range.getClientRects()].some((c) => c.width && c.right > innerWidth + 1)) past.push(node.textContent.trim().slice(0, 30));
          if (!el.closest(".next-steps")) continue;
          for (const word of node.textContent.matchAll(/\S+/g)) {
            range.setStart(node, word.index);
            range.setEnd(node, word.index + word[0].length);
            if (new Set([...range.getClientRects()].map((c) => Math.round(c.top))).size > 1) broken.push(word[0]);
          }
        }
        if (past.length) problems.push(`text runs past the edge of the screen: ${past.slice(0, 4).join(" | ")}`);
        if (broken.length) problems.push(`words broken across lines: ${broken.slice(0, 6).join(" ")}`);
        return problems;
      });
      failures.push(...enlarged.map((p) => `200% text ${width}px ${route}: ${p}`));
    }
    await context.close();
  }
} finally {
  await browser.close();
}
if (isolatedWidgets < checked) failures.push(`widget isolation did not cover every page (${isolatedWidgets}/${checked})`);
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`PASS ${checked} page/viewport checks: opens at the top, mobile art and copy, overflow, rotation, enlarged text`);
