// Every page, light and dark, phone and desktop: no text below WCAG AA.
//
// The owner noticed that in light mode some text was hard to read on a laptop.
// It was: the shared text tokens are tuned for a white page and this site's
// light page is a warm sky, so secondary text measured 4.2:1 and captions
// 2.2:1. Contrast is invisible to every other check here, so this one runs
// a WCAG AA contrast check over the built pages in a real browser and
// fails on any violation. It computes WCAG 2 contrast itself in the page — no
// dependency — compositing each text's translucent backgrounds down to the
// page. Text over the painted scenes (a gradient or image no formula can
// measure) is kept on the primary ink in styles.css instead, and skipped here.
//
//   node site/check-contrast.mjs            (serves site/dist itself)
import { chromium } from "playwright";
import http from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, "dist");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".json": "application/json", ".woff2": "font/woff2", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };

const server = http.createServer((req, res) => {
  let p = join(DIST, decodeURIComponent(req.url.split("?")[0]));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, "index.html");
  if (!p.startsWith(DIST) || !existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { "content-type": TYPES[extname(p)] ?? "application/octet-stream" });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(0, r));
const origin = `http://localhost:${server.address().port}`;

const pages = ["/"];
for (const d of readdirSync(DIST, { withFileTypes: true })) {
  if (d.isDirectory() && existsSync(join(DIST, d.name, "index.html"))) pages.push(`/${d.name}/`);
}
if (existsSync(join(DIST, "packages"))) {
  for (const d of readdirSync(join(DIST, "packages"), { withFileTypes: true })) {
    if (d.isDirectory()) pages.push(`/packages/${d.name}/`);
  }
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const failures = [];
for (const theme of ["light", "dark"]) {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
    await ctx.addInitScript((t) => { try { localStorage.setItem("theme", t); } catch { /* none */ } }, theme);
    // The chat's own reply is text too, and it only exists after a question,
    // so the check asks one: a canned answer stands in for the network.
    // Order matters: Playwright tries the last-registered route first.
    await ctx.route((url) => !url.href.startsWith(origin), (r) => r.abort());
    await ctx.route("**/api/widget/chat", (r) => r.fulfill({ json: { reply: "x", messages: [{ speaker: "loki", text: "A reply long enough to measure, the way a real answer reads." }] } }));
    const page = await ctx.newPage();
    for (const path of pages) {
      await page.goto(origin + path, { waitUntil: "load" });
      // The chat loads a moment after the page (chat.js is lazy), so wait for it.
      const box = page.locator("[data-chat] textarea").first();
      if (await page.locator("[data-chat]").count()) {
        await box.waitFor({ timeout: 15000 });
        await box.fill("How do I start?").catch(() => {});
        await box.press("Enter").catch(() => {});
        await page.waitForFunction(() => document.querySelector("[data-chat]")?.textContent?.includes("A reply long enough"), null, { timeout: 10000 }).catch(() => {});
      }
      const bad = await page.evaluate(() => {
        const parse = (c) => { const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 0]; return [m[0], m[1], m[2], m[3] ?? 1]; };
        const over = (top, under) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1); };
        const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
        const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
        const out = [];
        const seen = new Set();
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const el = walker.currentNode.parentElement;
          if (!el || seen.has(el) || !walker.currentNode.textContent.trim()) continue;
          seen.add(el);
          const cs = getComputedStyle(el);
          const box = el.getBoundingClientRect();
          if (cs.visibility === "hidden" || cs.display === "none" || box.width === 0 || box.height === 0) continue;
          if (el.closest("[aria-hidden='true'], .sr-only, svg")) continue;
          // Backgrounds from the element up; an image or gradient means a scene.
          const layers = [];
          let scene = false;
          let opacity = 1;
          for (let n = el; n; n = n.parentElement) {
            const s = getComputedStyle(n);
            opacity *= Number(s.opacity);
            if (s.backgroundImage !== "none") { scene = true; break; }
            const bg = parse(s.backgroundColor);
            if (bg[3] > 0) layers.push(bg);
            if (bg[3] === 1) break;
          }
          if (scene) continue;
          let bg = [255, 255, 255, 1];
          const root = parse(getComputedStyle(document.documentElement).backgroundColor);
          if (root[3] > 0) bg = over(root, bg);
          for (const l of layers.reverse()) bg = over(l, bg);
          let fg = parse(cs.color);
          fg = over([fg[0], fg[1], fg[2], fg[3] * opacity], bg);
          const a = lum(fg), b = lum(bg);
          const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          const px = parseFloat(cs.fontSize);
          const large = px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700);
          const need = large ? 3 : 4.5;
          if (ratio + 0.005 < need) {
            const name = el.tagName.toLowerCase() + (el.className && typeof el.className === "string" ? "." + el.className.trim().split(/\s+/).join(".") : "");
            out.push(`${name} "${walker.currentNode.textContent.trim().slice(0, 40)}" — ${hex(fg)} on ${hex(bg)} = ${ratio.toFixed(2)}:1 (needs ${need})`);
          }
        }
        return out;
      });
      for (const b of bad) failures.push(`${theme} ${width}px ${path}  ${b}`);
    }
    await ctx.close();
  }
}
await browser.close();
server.close();

if (failures.length) {
  console.error(`✗ ${failures.length} text element(s) below WCAG AA contrast:`);
  for (const f of failures.slice(0, 60)) console.error(`  ${f}`);
  if (failures.length > 60) console.error(`  … and ${failures.length - 60} more`);
  process.exit(1);
}
console.log(`✓ contrast: ${pages.length} pages × light/dark × phone/desktop, no text below AA`);
