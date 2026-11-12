#!/usr/bin/env node
// The share card — the image a link to this site renders as, rendered the same
// way the product screenshots are: a machine opens site/og-card.html and takes
// a 1200×630 picture of it. Almost every visitor this site will ever have
// arrives through a shared link, so the card is part of the front door, not
// decoration.
//
//   PLAYWRIGHT=/path/to/node_modules/playwright node site/og.mjs
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { MARK_HEADER } from "./brand-mark.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT ?? "playwright");

const out = join(here, "dist", "og");
mkdirSync(out, { recursive: true });

const browser = await pw.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(join(here, "og-card.html")).href, { waitUntil: "load" });
// The mark is drawn by the same function as the header's and the favicon's.
await page.evaluate((svg) => { document.querySelector("[data-mark]").innerHTML = svg; }, MARK_HEADER());
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(out, "studio.png"), type: "png" });
await browser.close();
console.log("wrote site/dist/og/studio.png (1200×630)");
