// Exercise the actual Loki feedback widget on the configured public origin.
// The boot endpoint checks Origin, so this is intentionally a live-origin
// browser test rather than a localhost mock.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const config = JSON.parse(readFileSync(join(here, "loki-feedback.json"), "utf8"));
const editorial = JSON.parse(readFileSync(join(here, "overrides.json"), "utf8"));
const base = (process.argv[2] ?? "https://bitbaum.orangecat.ch").replace(/\/$/, "");
const say = (ok, message) => console.log(`${ok ? "PASS" : "FAIL"} ${message}`);
const browser = await chromium.launch({ headless: true });
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  const response = await page.goto(`${base}/`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const html = await response.text();
  const snippet = `${config.origin}/widget.js`;
  const markup = html.includes(snippet) && html.includes(`data-fc-project="${config.token}"`);
  say(markup, "home page includes the configured Loki widget and project token");
  failed ||= !markup;
  const stack = await page.locator(".home-stack-item").evaluateAll((items) => items.map((item) => item.getAttribute("data-stack-project")));
  const stackMatches = JSON.stringify(stack) === JSON.stringify(editorial.home.flagshipProjects) && stack.includes("solon");
  say(stackMatches, "homepage shows its configured stack, including Solon");
  failed ||= !stackMatches;
  const routes = await page.locator(".home-intro .actions a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  const clearRoutes = routes.some((href) => href?.startsWith("https://loki.orangecat.ch")) && routes.includes("/hire/#waitlist");
  say(clearRoutes, "hero offers Loki for immediate use and the capacity-aware studio waitlist");
  failed ||= !clearRoutes;
  const responsive = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  say(responsive, "homepage fits the mobile viewport without horizontal scrolling");
  failed ||= !responsive;
  await page.waitForSelector("#loki-feedback-host", { state: "attached", timeout: 15_000 });
  const launcher = page.locator("#loki-feedback-host button[aria-label='Give feedback']");
  const mounted = await launcher.count() === 1 && await page.evaluate(() => window.Loki?.ready === true);
  say(mounted, "Loki booted on this origin and mounted its accessible launcher");
  failed ||= !mounted;
  await launcher.click();
  const dialog = page.locator("#loki-feedback-host [role='dialog']");
  const opens = await dialog.isVisible();
  say(opens, "launcher opens the feedback panel");
  failed ||= !opens;
  const narrow = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
  say(narrow, "widget does not cause horizontal overflow on a 375px viewport");
  failed ||= !narrow;
  say(errors.length === 0, errors.length ? `browser errors: ${errors.join(" | ")}` : "no browser errors");
  failed ||= errors.length > 0;
} catch (error) {
  console.error(`FAIL ${error.message}`);
  failed = true;
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
