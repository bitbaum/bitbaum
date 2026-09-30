// Real-browser geometry checks for the published pages. Keep decorative
// worlds out of mobile copy, including after rotation and text enlargement.
// Usage: node site/check-responsive.mjs <base-url>
import { chromium } from "playwright";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2];
if (!base) throw new Error("usage: node site/check-responsive.mjs <base-url>");
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
    const page = await context.newPage();
    page.on("pageerror", (e) => failures.push(`${width}px: ${e.message}`));
    for (const route of routes) {
      await page.goto(base + route, { waitUntil: "load" });
      await page.evaluate(() => document.fonts.ready);
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
  for (const route of ["/", "/hire/", "/partners/", "/packages/", "/diplodoctor/"]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    await page.goto(base + route, { waitUntil: "load" });
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) failures.push(`200% text ${route}: horizontal overflow`);
    await page.close();
  }
} finally {
  await browser.close();
}
if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`PASS ${checked} page/viewport checks: mobile art and copy, overflow, rotation, enlarged text`);
