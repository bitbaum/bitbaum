// Real-browser check for the painted figures (warp.mjs). A lost WebGL
// context painted Chromium's "sad WebGL" face in place of a figure, and on a
// running figure that face crossed the screen. Pins three things:
//   1. a page holds at most ONE WebGL context, however many figures it has;
//   2. the figures really animate (a warping figure has drawn pixels);
//   3. when that context is lost, every figure shows its still painting.
// Usage: node site/check-figures.mjs <base-url>
import { chromium } from "playwright";

const base = process.argv[2];
if (!base) throw new Error("usage: node site/check-figures.mjs <base-url>");
const pages = ["/", "/work/", "/studio/", "/packages/", "/hire/", "/builders/"];
const failures = [];
const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    // Every page loads the feedback widget from Loki, and a page's "load"
    // waits for it. This check is about figures drawn on this page, so it
    // must not depend on another host answering: on 2026-11-12 that host
    // stalled, "/work/" never reached "load" in 30s, and a change to two
    // documents could not merge. Every other browser check already answers
    // this script itself.
    await context.route("**/widget.js", (r) => r.fulfill({ status: 200, contentType: "text/javascript", body: "" }));
    await context.addInitScript(() => {
      window.__gls = [];
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        const c = get.call(this, type, ...rest);
        if (c && /webgl/.test(type) && !window.__gls.includes(c)) window.__gls.push(c);
        return c;
      };
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => failures.push(`${width}px: ${e.message}`));
    for (const path of pages) {
      await page.goto(base + path, { waitUntil: "load" });
      const rigs = await page.locator("[data-rig]").count();
      if (!rigs) continue;
      await page.evaluate(async () => { for (const el of document.querySelectorAll("[data-rig]")) { el.scrollIntoView({ block: "center" }); await new Promise((r) => setTimeout(r, 250)); } });
      await page.waitForTimeout(500);
      const state = await page.evaluate(() => ({
        contexts: window.__gls.length,
        warping: document.querySelectorAll(".puppet.warping").length,
        blank: [...document.querySelectorAll(".puppet.warping .warp-canvas")].filter((c) => {
          const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
          for (let i = 3; i < d.length; i += 16) if (d[i]) return false;
          return true;
        }).length,
      }));
      const where = `${width}px ${path}`;
      if (state.contexts > 1) failures.push(`${where}: ${state.contexts} WebGL contexts for ${rigs} figures (must be at most 1)`);
      if (!state.warping) failures.push(`${where}: no figure animates`);
      if (state.blank) failures.push(`${where}: ${state.blank} animating figure(s) drew nothing`);
      // Lose the context the way a phone does, and look at what is left.
      const after = await page.evaluate(async () => {
        for (const gl of window.__gls) gl.getExtension("WEBGL_lose_context")?.loseContext();
        await new Promise((r) => setTimeout(r, 300));
        const shown = (el) => { const s = getComputedStyle(el); return s.display !== "none" && s.visibility !== "hidden"; };
        return {
          warping: document.querySelectorAll(".puppet.warping").length,
          canvases: [...document.querySelectorAll(".warp-canvas")].filter(shown).length,
          hiddenBodies: [...document.querySelectorAll(".puppet .pp-body")].filter((i) => !shown(i)).length,
          webglCanvasesInDom: [...document.querySelectorAll("canvas")].filter((c) => window.__gls.some((g) => g.canvas === c)).length,
        };
      });
      if (after.warping || after.canvases) failures.push(`${where}: after context loss ${after.warping} figure(s) still warping, ${after.canvases} canvas(es) shown`);
      if (after.hiddenBodies) failures.push(`${where}: after context loss ${after.hiddenBodies} still painting(s) hidden`);
      if (after.webglCanvasesInDom) failures.push(`${where}: a WebGL canvas is in the page, where a lost context would paint the sad face`);
      console.log(`${where}: ${rigs} figures, ${state.contexts} context, ${state.warping} warping; after loss: still paintings back`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
console.log("figures: ok");
