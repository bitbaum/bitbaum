#!/usr/bin/env node
// Product imagery for the site: a screenshot of every venture with a live
// URL, taken the same way every time — 1280×800, dark colour scheme, above
// the fold, JPEG at the size the site serves. Nothing here is drawn by hand;
// a product looks on this site exactly the way it looks to a visitor, and a
// shot only exists for something that is actually up.
//
//   node site/shots.mjs            capture into site/dist/shots/
//   node site/shots.mjs orangecat  one slug
//
// Needs Playwright with Chromium. It is not a dependency of this repo — any
// fleet checkout has one — so point at it:
//   PLAYWRIGHT=/path/to/node_modules/playwright node site/shots.mjs
import { createRequire } from "node:module";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT ?? "playwright");

const out = join(here, "dist", "shots");
mkdirSync(out, { recursive: true });
const cfg = JSON.parse(readFileSync(join(here, "overrides.json"), "utf8"));
const map = JSON.parse(readFileSync(join(here, "map.snapshot.json"), "utf8"));

const targets = [];
for (const p of map.projects) {
  const o = cfg.overrides?.[p.slug] ?? {};
  const url = o.url ?? p.urls?.live;
  if (url && o.shot !== false && (o.what ?? p.what)) targets.push({ slug: p.slug, url });
}
for (const x of cfg.extras ?? []) if (x.url && x.shot !== false) targets.push({ slug: x.slug, url: x.url });
const only = process.argv[2];

const browser = await pw.chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  colorScheme: "dark",
  reducedMotion: "reduce",
});
for (const t of targets) {
  if (only && t.slug !== only) continue;
  const page = await ctx.newPage();
  try {
    await page.goto(t.url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: join(out, `${t.slug}.jpg`), type: "jpeg", quality: 82 });
    console.log(`shot ${t.slug} <- ${t.url}`);
  } catch (e) {
    console.error(`FAILED ${t.slug} (${t.url}): ${e.message.split("\n")[0]}`);
  } finally {
    await page.close();
  }
}
await browser.close();
