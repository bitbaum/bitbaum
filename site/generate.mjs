#!/usr/bin/env node
// bitbaum.orangecat.ch — generated from the fleet register.
//
// What this page is: the studio's ventures, grouped as Products, Clients,
// Demos and Not live. What it is NOT: a list anyone types. The list comes from
// FleetCrown's public register (which joins the hosting register with project
// profiles), and this file only decides presentation via overrides.json.
//
// Why: the previous companies.json had drifted from reality within days — it
// named aoz-wohnen (renamed), sent evig to revampit.orangecat.ch (a redirect),
// listed sbb.orangecat.ch (retired) — and the page that was actually live had
// been edited by hand on the server with no source here at all.
//
//   node site/generate.mjs            fetch register, write index.html + snapshot
//   node site/generate.mjs --offline  build from site/register.snapshot.json
//   node site/generate.mjs --check    exit 1 if index.html differs from generation
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const REGISTER_URL = process.env.FLEET_REGISTER_URL ?? "https://fleetcrown.orangecat.ch/api/fleet/register";
const SNAPSHOT = join(here, "register.snapshot.json");
const GROUPS = [
  ["products", "Products"],
  ["clients", "Clients"],
  ["demos", "Demos"],
  ["next", "Not live"],
];

const args = new Set(process.argv.slice(2));

async function loadRegister() {
  if (!args.has("--offline")) {
    try {
      const res = await fetch(REGISTER_URL, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json = await res.json();
        writeFileSync(SNAPSHOT, JSON.stringify(json, null, 2) + "\n");
        return json;
      }
      console.error(`register answered ${res.status}; using snapshot`);
    } catch (e) {
      console.error(`register unreachable (${e?.message ?? e}); using snapshot`);
    }
  }
  if (!existsSync(SNAPSHOT)) throw new Error("no register and no snapshot — cannot build");
  return JSON.parse(readFileSync(SNAPSHOT, "utf8"));
}

/**
 * Default group from the register's own facts; overrides win.
 * Returns null for anything not live: the "Not live" section is curated by
 * hand (a `group: "next"` override), because the register also holds factory
 * test sites and half-day prospects that nobody wants on the front page.
 */
function defaultGroup(row) {
  const s = row.site;
  if (!s) return null;
  if (s.kind === "demo" || s.status === "demo") return "demos";
  if (s.status !== "live") return null;
  if (s.kind === "product") return "products";
  if (s.kind === "client-app" || s.kind === "client-site") return "clients";
  return null;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function rowHtml(v) {
  const door = v.door ?? (v.url ? v.url.replace(/^https?:\/\//, "") : "not live");
  const inner = `<span class="name">${esc(v.name)}</span><span class="what">${esc(v.what)}</span><span class="door">${esc(door)}</span>`;
  return v.url && v.group !== "next"
    ? `      <a class="row" href="${esc(v.url)}">${inner}</a>`
    : `      <div class="row">${inner}</div>`;
}

function build(register, cfg) {
  const ov = cfg.overrides ?? {};
  const ventures = [];
  for (const r of register.rows) {
    const o = ov[r.slug];
    // No tagline, no row: the register lists every host on the box, including
    // factory test sites and half-day prospects. Writing the one line in
    // overrides.json is the editorial act that puts something on this page.
    if (!o?.what) continue;
    const group = o.group ?? defaultGroup(r);
    if (!group) continue;
    const url = o.url ?? r.site?.url ?? null;
    ventures.push({
      slug: r.slug,
      name: o.name ?? r.name ?? r.slug,
      what: o.what,
      url,
      door: o.door,
      group,
      order: o.order ?? 99,
    });
  }
  for (const x of cfg.extras ?? []) ventures.push({ order: 0, ...x });
  // An extra that the register has since learned about would render twice.
  const seen = new Set();
  for (const v of ventures) {
    if (seen.has(v.slug)) throw new Error(`${v.slug} is both in the register and in extras — drop the extra`);
    seen.add(v.slug);
  }

  const sections = GROUPS.map(([id, title]) => {
    const items = ventures
      .filter((v) => v.group === id)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    if (!items.length) return "";
    return `    <section class="group" id="${id}">\n      <h2>${title}</h2>\n${items.map(rowHtml).join("\n")}\n    </section>`;
  })
    .filter(Boolean)
    .join("\n");

  const head = readFileSync(join(here, "head.html"), "utf8");
  return `${head}<body>
  <header class="top">
    <a class="mark" href="#top">bitbaum</a>
    <nav>
${GROUPS.map(([id, t]) => `      <a href="#${id}">${t}</a>`).join("\n")}
    </nav>
  </header>
  <h1 id="top">The work, each its own.</h1>
${sections}
  <footer>Cato. Nothing here is registered. An orangecat.ch name is an address on this box.
    <span class="src">Generated from the <a href="${esc(REGISTER_URL.replace(/\/api\/.*/, "/fleet"))}">fleet register</a>${register.generatedAt ? `, ${register.generatedAt.slice(0, 10)}` : ""}.</span></footer>
</body>
</html>
`;
}

const register = await loadRegister();
const cfg = JSON.parse(readFileSync(join(here, "overrides.json"), "utf8"));
const html = build(register, cfg);
const target = join(here, "index.html");
if (args.has("--check")) {
  const current = existsSync(target) ? readFileSync(target, "utf8") : "";
  if (current !== html) {
    console.error("index.html differs from the register — run: node site/generate.mjs");
    process.exit(1);
  }
  console.log("index.html is in sync with the register");
} else {
  writeFileSync(target, html);
  const n = (html.match(/class="row"/g) || []).length;
  console.log(`wrote site/index.html (${n} ventures, register ${register.generatedAt ?? "snapshot"})`);
}
