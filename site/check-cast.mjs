// Every painted element is where the register says it is — proven in a real
// browser, because the site has fifty paintings on forty pages and a figure
// that quietly stops rendering looks exactly like one that was never there.
//
//   node site/check-cast.mjs http://127.0.0.1:8731
//
// dist/cast.json is written by the build from site/cast.json: for each page,
// the entries whose marker the rendered HTML carries. Here each one is opened
// at phone and desk width and the element must be in the DOM; "immediate"
// ones must also be sized, loaded (every <img> has pixels) and inside the
// page; "canvas" ones must have a size; entries hidden on phones by design
// must really be hidden there and really shown on a desk.
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require_ = createRequire(import.meta.url);
const DEV = process.env.DEV_ROOT ?? `${process.env.HOME}/dev`;
let pw;
for (const where of ["playwright", `${DEV}/solon/node_modules/playwright`, `${DEV}/loki/node_modules/playwright`]) {
  try { pw = require_(where); break; } catch { /* next */ }
}
if (!pw) { console.error("playwright not found — install it, or set DEV_ROOT to a checkout that has it"); process.exit(2); }
const base = process.argv[2];
if (!base) { console.error("usage: node site/check-cast.mjs <base-url>"); process.exit(2); }

const register = JSON.parse(readFileSync(new URL("./dist/cast.json", import.meta.url), "utf8"));
const byId = Object.fromEntries(register.entries.map((e) => [e.id, e]));
const browser = await pw.chromium.launch();
let fail = 0, checked = 0;
const bad = (m) => { fail++; console.log(`FAIL ${m}`); };

for (const [width, device] of [[390, "phone"], [1280, "desk"]]) {
  const ctx = await browser.newContext({ viewport: { width, height: 860 } });
  await ctx.route("**/widget.js", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
  await ctx.route("**/api.open-meteo.com/**", (r) => r.abort());
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [path, ids] of Object.entries(register.pages)) {
    // Not "load": a slow third-party asset must not read as a lost painting. Each
    // painting's own pixels are awaited below.
    await page.goto(`${base}${path}?weather=clear`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const docW = await page.evaluate(() => document.documentElement.scrollWidth);
    for (const id of ids) {
      const e = byId[id];
      checked++;
      // Bring it into view first, as a reader would: lazy paintings load when
      // they come near the screen, and a figure far down a long page is still
      // a figure that must be there when the reader arrives.
      await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: "center" }), e.selector);
      if (e.visible === "immediate") await page.waitForFunction((sel) => { const el = document.querySelector(sel); if (!el) return true; const imgs = el.matches("img") ? [el] : [...el.querySelectorAll("img")]; return imgs.every((i) => i.complete); }, e.selector, { timeout: 4000 }).catch(() => {});
      const info = await page.evaluate(([sel, phone]) => {
        const el = document.querySelector(sel);
        if (!el) return { missing: true };
        // Measure where the element LIVES, not where its motion has it this
        // frame: a tumbleweed mid-roll is rightly off the page for a moment.
        for (const a of el.getAnimations({ subtree: true })) a.cancel();
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const imgs = [...(el.matches("img") ? [el] : el.querySelectorAll("img"))];
        return {
          display: cs.display,
          w: r.width, h: r.height, left: r.left + scrollX, right: r.right + scrollX,
          tag: el.tagName.toLowerCase(),
          imgs: imgs.length,
          unloaded: imgs.filter((i) => !(i.complete && i.naturalWidth > 0)).length,
          hiddenAttr: el.hidden,
          canvasW: el.tagName === "CANVAS" ? el.width : null,
        };
      }, [e.selector, device === "phone"]);
      const where = `${path} ${device} · ${e.id} (${e.selector})`;
      if (info.missing) { bad(`${where}: not in the DOM`); continue; }
      const hiddenByDesign = device === "phone" && e.phone === "hidden";
      if (hiddenByDesign) { if (info.display !== "none") bad(`${where}: should be hidden on phones, is ${info.display}`); continue; }
      if (e.visible === "canvas") { if (!(info.canvasW > 0 && info.w > 0 && info.h > 0)) bad(`${where}: canvas has no size`); continue; }
      if (e.visible !== "immediate") continue; // arrives by JS later; presence is the promise
      if (info.display === "none" || info.hiddenAttr) bad(`${where}: hidden (${info.display})`);
      else if (!(info.w > 0 && info.h > 0)) bad(`${where}: no size (${Math.round(info.w)}×${Math.round(info.h)})`);
      else if (info.right <= 0 || info.left >= docW) bad(`${where}: outside the page (left ${Math.round(info.left)}, page ${docW})`);
      if (info.unloaded) bad(`${where}: ${info.unloaded} of ${info.imgs} images did not load`);
    }
  }
  if (errors.length) bad(`${device}: page errors — ${errors[0]}`);
  await ctx.close();
}
await browser.close();
console.log(fail ? `\n${fail} FAILED of ${checked} placements` : `\nPASS the cast is where the register says: ${checked} placements on ${Object.keys(register.pages).length} pages, phone and desk`);
process.exit(fail ? 1 : 0);
