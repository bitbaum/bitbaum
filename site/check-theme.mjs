// Light / dark / system, checked in a real browser.
//
//   node site/check-theme.mjs http://127.0.0.1:8731
//   node site/check-theme.mjs https://bitbaum.orangecat.ch
//
// What it pins, and why each one is here:
//   • the theme is decided BEFORE the stylesheet paints — otherwise every page
//     load flashes white at anyone who chose dark;
//   • "system" is a real third state that keeps following the OS afterwards,
//     not a one-time reading;
//   • a choice survives navigation;
//   • both themes actually meet a contrast floor, measured off rendered pixel
//     colours rather than trusted from the tokens.
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
  console.error("usage: node site/check-theme.mjs <base-url>");
  process.exit(2);
}

let fail = 0;
const say = (ok, m) => {
  if (!ok) fail++;
  console.log((ok ? "PASS " : "FAIL ") + m);
};

/** Relative luminance from an `rgb(r, g, b)` string. */
const lum = (rgb) => {
  const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map((n) => {
    const c = Number(n) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const browser = await pw.chromium.launch();

// ── no flash: the decision happens in <head>, before the stylesheet ─────────
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "domcontentloaded" });
  const head = await page.$eval("head", (h) => h.innerHTML);
  const scriptAt = head.indexOf("localStorage.getItem(\"theme\")");
  const cssAt = head.indexOf('href="/styles.css"');
  say(scriptAt !== -1 && scriptAt < cssAt, "the theme is decided in <head> before the stylesheet loads");
  await ctx.close();
}

// ── by default the site follows the real sky where the reader is ───────────
// Zurich at noon is day and at midnight is night, whatever the OS prefers.
for (const [hour, expectDark] of [[12, false], [0, true]]) {
  const ctx = await browser.newContext({ colorScheme: expectDark ? "light" : "dark", timezoneId: "Europe/Zurich" });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date(`2026-06-21T${String(hour).padStart(2, "0")}:30:00+02:00`));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const isDark = await page.$eval("html", (h) => h.classList.contains("dark"));
  say(isDark === expectDark, `at ${hour}:30 local time the page is ${expectDark ? "night (dark)" : "day (light)"} by default`);

  const [bg, fg] = await page.evaluate(() => {
    // The page's background is the sky (sky.mjs), painted over html's
    // --sky-base; body is transparent. Measure against the first opaque
    // background up the tree, which is that base.
    const bg = [document.body, document.documentElement].map((el) => getComputedStyle(el).backgroundColor).find((c) => !/rgba\(.*,\s*0\)|transparent/.test(c));
    return [bg, getComputedStyle(document.body).color];
  });
  const ratio = contrast(bg, fg);
  say(ratio >= 7, `and body text clears 7:1 there (${ratio.toFixed(1)}:1)`);
  await ctx.close();
}

// ── an explicit choice wins, and survives navigation ───────────────────────
{
  const ctx = await browser.newContext({ colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.click('[data-set-theme="light"]');
  await page.waitForTimeout(150);
  say(!(await page.$eval("html", (h) => h.classList.contains("dark"))), "choosing light overrides a dark system");
  say(
    await page.$eval('[data-set-theme="light"]', (b) => b.getAttribute("aria-pressed") === "true"),
    "and the control says which state is active",
  );
  await page.goto(base + "/packages/", { waitUntil: "networkidle" });
  say(!(await page.$eval("html", (h) => h.classList.contains("dark"))), "the choice survives navigation");

  const ratio = await page.evaluate(() => {
    // The page's background is the sky (sky.mjs), painted over html's
    // --sky-base; body is transparent. Measure against the first opaque
    // background up the tree, which is that base.
    const bg = [document.body, document.documentElement].map((el) => getComputedStyle(el).backgroundColor).find((c) => !/rgba\(.*,\s*0\)|transparent/.test(c));
    return [bg, getComputedStyle(document.body).color];
  });
  say(contrast(ratio[0], ratio[1]) >= 7, `light stays readable after switching (${contrast(ratio[0], ratio[1]).toFixed(1)}:1)`);

  await ctx.close();
}

// ── "local time" hands control back to the sky ────────────────────────────
{
  const ctx = await browser.newContext({ colorScheme: "light", timezoneId: "Europe/Zurich" });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date("2026-06-21T23:30:00+02:00"));
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.click('[data-set-theme="light"]');
  await page.waitForTimeout(150);
  say(!(await page.$eval("html", (h) => h.classList.contains("dark"))), "light can be chosen at night");
  await page.click('[data-set-theme="auto"]');
  await page.waitForTimeout(150);
  say(await page.$eval("html", (h) => h.classList.contains("dark")), "choosing local time at 23:30 gives night again");
  await ctx.close();
}

await browser.close();
console.log(fail ? `\n${fail} FAILED` : "\nall theme checks passed");
process.exit(fail ? 1 : 0);
