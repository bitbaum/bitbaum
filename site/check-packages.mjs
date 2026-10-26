// Verify the generated package references, including expanded source documentation.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import { join, normalize, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const dist = fileURLToPath(new URL("./dist/", import.meta.url));
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".svg": "image/svg+xml", ".woff2": "font/woff2" };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const path = normalize(join(dist, pathname.endsWith("/") ? pathname + "index.html" : pathname));
    if (!path.startsWith(dist)) return response.writeHead(403).end();
    response.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream" }).end(await readFile(path));
  } catch { response.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = process.argv[2] ?? `http://127.0.0.1:${server.address().port}`;
const packages = JSON.parse(readFileSync(new URL("./packages.snapshot.json", import.meta.url), "utf8")).packages;
const widget = JSON.parse(readFileSync(new URL("./loki-feedback.json", import.meta.url), "utf8"));
const failures = [];
let visits = 0;
const browser = await chromium.launch();
try {
  for (const width of [320, 390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
    await context.route(`${widget.origin}/widget.js`, (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
    const page = await context.newPage();
    page.on("pageerror", (error) => failures.push(`${width} ${page.url()}: ${error.stack ?? error.message}`));
    for (const pkg of packages) {
      const response = await page.goto(`${base}/packages/${pkg.slug}/`);
      if (!response?.ok()) failures.push(`${pkg.slug}: page unavailable`);
      await page.evaluate(() => document.fonts.ready);
      for (const scheme of ["light", "dark"]) {
        await page.emulateMedia({ colorScheme: scheme });
        await page.locator(".pkg-document").evaluateAll((elements) => elements.forEach((element) => { element.open = true; }));
        const problems = await page.evaluate(() => {
          const problems = [];
          if (document.documentElement.scrollWidth > innerWidth + 1) problems.push("horizontal overflow with expanded documentation");
          for (const link of document.querySelectorAll('.pkg-local-nav a[href^="#"]')) {
            if (!document.getElementById(link.getAttribute("href").slice(1))) problems.push("missing in-page destination");
            if (link.getBoundingClientRect().height < 44) problems.push("small section navigation target");
          }
          for (const button of document.querySelectorAll(".pkg-install")) if (button.getBoundingClientRect().height < 44) problems.push("small install-copy target");
          if (document.querySelector('a[href^="javascript:"]')) problems.push("unsafe documentation link");
          return problems;
        });
        failures.push(...problems.map((problem) => `${pkg.slug} ${width} ${scheme}: ${problem}`));
        visits++;
      }
      if (pkg.slug === "accountkit" && width === 390) {
        // A transient tiny viewport used to cache an empty cloud sprite.
        await page.setViewportSize({ width: 1, height: 1 });
        await page.evaluate(() => new Promise(requestAnimationFrame));
        await page.setViewportSize({ width, height: 844 });
        await page.evaluate(() => new Promise(requestAnimationFrame));
        await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text) => { window.packageCopiedCommand = text; } } }));
        await page.locator(".js-copy").click();
        if (await page.locator("[data-copy-status]").textContent() !== "Copied install command.") failures.push("copy action lacks success feedback");
        await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("denied"); } } }));
        await page.locator(".js-copy").click();
        if (!(await page.locator("[data-copy-status]").textContent()).includes("Select the command")) failures.push("copy denial lacks a recovery path");
        await page.locator(".pkg-document").evaluateAll((elements) => elements.forEach((element) => { element.open = false; }));
        await page.screenshot({ path: "/tmp/bitbaum-accountkit-reference.png", fullPage: true });
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (failures.length) throw new Error(failures.join("\n"));
console.log(`Package references pass ${visits} browser checks with expanded docs, phone/desktop and light/dark.`);
