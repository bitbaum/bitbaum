#!/usr/bin/env node
// bitbaum.orangecat.ch — generated from the fleet register.
//
// What this page is: the studio's ventures, grouped as Products, Clients,
// Demos and Not live. What it is NOT: a list anyone types. The list comes from
// Loki's public register (which joins the hosting register with project
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
const REGISTER_URL = process.env.FLEET_REGISTER_URL ?? "https://loki.orangecat.ch/api/fleet/register";
const SNAPSHOT = join(here, "register.snapshot.json");
// The packages are NOT the fleet register: ventures are things that run,
// packages are things you install. Two different objects, so two sources —
// this one is derived by bitbaum/fleet's shared-registry audit from real
// package.json data across the org, never typed. Same fetch-or-snapshot
// contract as the register above.
const PACKAGES_URL = process.env.FLEET_PACKAGES_URL ?? "https://raw.githubusercontent.com/bitbaum/fleet/main/registers/packages.json";
const PACKAGES_SNAPSHOT = join(here, "packages.snapshot.json");
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

async function loadPackages() {
  if (!args.has("--offline")) {
    try {
      const res = await fetch(PACKAGES_URL, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json = await res.json();
        writeFileSync(PACKAGES_SNAPSHOT, JSON.stringify(json, null, 2) + "\n");
        return json;
      }
      console.error(`package registry answered ${res.status}; using snapshot`);
    } catch (e) {
      console.error(`package registry unreachable (${e?.message ?? e}); using snapshot`);
    }
  }
  if (!existsSync(PACKAGES_SNAPSHOT)) {
    // A missing package registry must not silently produce a page with no
    // packages on it — that reads exactly like "we have none".
    throw new Error("no package registry and no snapshot — cannot build");
  }
  return JSON.parse(readFileSync(PACKAGES_SNAPSHOT, "utf8"));
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
  const live = Boolean(v.url) && v.group !== "next";
  const door = v.door ?? (v.url ? v.url.replace(/^https?:\/\//, "") : "not live");
  // The door is the promise of the row, so it carries a direction marker when
  // it is walkable and a pill when it is not. Previously a live venture and an
  // unbuilt one rendered identically and a visitor could not tell them apart.
  const doorHtml = live
    ? `<span class="door">${esc(door)} <span class="arrow" aria-hidden="true">&rarr;</span></span>`
    : `<span class="door">${esc(door)}</span>`;
  const inner = `<span class="name">${esc(v.name)}</span><span class="what">${esc(v.what)}</span>${doorHtml}`;
  return live
    ? `      <a class="row" href="${esc(v.url)}">${inner}</a>`
    : `      <div class="row off">${inner}</div>`;
}

/**
 * A package is not a venture: you install it, you do not visit it. So it gets
 * its own shape — the install line is the primary action, and the adopter
 * count is the honest trust signal, derived rather than claimed.
 */
function pkgHtml(p, editorial) {
  const what = editorial?.what ?? p.description ?? "";
  const uses = p.adopters === 1 ? "used in 1 app" : `used in ${p.adopters} apps`;
  const npmHref = p.install.source === "npm"
    ? `https://www.npmjs.com/package/${encodeURIComponent(p.name).replace("%40", "@").replace("%2F", "/")}`
    : null;
  const links = [
    `<a href="${esc(p.repo)}">source</a>`,
    npmHref ? `<a href="${esc(npmHref)}">npm</a>` : `<span>git tag</span>`,
  ].join("");
  return `      <article class="pkg">
        <div class="pkg-top"><span class="pkg-name">${esc(p.slug)}</span><span class="pkg-uses">${esc(uses)}</span></div>
        <p class="pkg-what">${esc(what)}</p>
        <code class="pkg-install">${esc(p.install.command)}</code>
        <div class="pkg-links">${links}</div>
      </article>`;
}

function build(register, packages, cfg) {
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

  const counts = {};
  const sections = GROUPS.map(([id, title]) => {
    const items = ventures
      .filter((v) => v.group === id)
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
    counts[id] = items.length;
    if (!items.length) return "";
    return `    <section class="group" id="${id}">
      <div class="sec"><h2>${title}</h2><span class="count">${items.length}</span></div>
${items.map(rowHtml).join("\n")}
    </section>`;
  })
    .filter(Boolean)
    .join("\n");

  const pkgEditorial = cfg.packages ?? {};
  const pkgRows = (packages.packages ?? []).map((p) => pkgHtml(p, pkgEditorial[p.slug])).join("\n");
  const pkgSection = pkgRows
    ? `    <section class="group" id="packages">
      <div class="sec"><h2>Packages</h2><span class="count">${packages.packages.length}</span><span class="note">open source &middot; install any of them</span></div>
      <div class="pkgs">
${pkgRows}
      </div>
    </section>`
    : "";

  const liveCount = (counts.products ?? 0) + (counts.clients ?? 0) + (counts.demos ?? 0);
  const pkgCount = (packages.packages ?? []).length;

  const navItems = [...GROUPS.filter(([id]) => counts[id] > 0), ...(pkgRows ? [["packages", "Packages"]] : [])];
  const head = readFileSync(join(here, "head.html"), "utf8");
  return `${head}<body>
  <header class="top">
    <div class="wrap">
      <a class="mark" href="#top">bitbaum</a>
      <nav>
${navItems.map(([id, t]) => `        <a href="#${id}">${t}</a>`).join("\n")}
      </nav>
    </div>
  </header>
  <main class="wrap">
    <div class="hero" id="top">
      <h1>The work, each its own.</h1>
      <p class="lead">Products, client systems, and the shared packages they are all built from. One person, one box, no crew.</p>
      <p class="stats"><span><b>${liveCount}</b> live systems</span><span><b>${pkgCount}</b> open-source packages</span><span><b>1</b> server</span></p>
    </div>
${sections}
${pkgSection}
  </main>
  <footer>
    <div class="wrap">
      <span>Cato. Nothing here is registered. An orangecat.ch name is an address on this box.</span>
      <span>Generated from the <a href="${esc(REGISTER_URL.replace(/\/api\/.*/, "/fleet"))}">fleet register</a>${register.generatedAt ? `, ${register.generatedAt.slice(0, 10)}` : ""}, and from the <a href="https://github.com/bitbaum/fleet/blob/main/SHARED.md">package registry</a>.</span>
    </div>
  </footer>
</body>
</html>
`;
}

const register = await loadRegister();
const packages = await loadPackages();
const cfg = JSON.parse(readFileSync(join(here, "overrides.json"), "utf8"));
const html = build(register, packages, cfg);
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
  // `class="row"` and `class="row off"` are both rows. Matching the exact
  // string silently under-counted by four the moment not-live rows gained a
  // modifier — a build log reporting a number nobody checks is worse than one
  // reporting none.
  const n = (html.match(/class="row(?: off)?"/g) || []).length;
  console.log(`wrote site/index.html (${n} ventures, ${(packages.packages ?? []).length} packages, register ${register.generatedAt ?? "snapshot"})`);
}
