#!/usr/bin/env node
// bitbaum.orangecat.ch — generated from the fleet MAP.
//
// What this page is: the studio's ventures, grouped as Products, Clients,
// Demos and Not live, each with what it is and the last thing that moved on
// it — and, next to it, the same map as machine-readable JSON (map.json) for
// anyone (or any agent) who wants the studio's shape without scraping a page.
// What it is NOT: a list anyone types. The list comes from Loki's public map
// (the register — hosting facts joined with project profiles — plus purpose,
// layer, state and activity), and this file only decides presentation via
// overrides.json.
//
// Why: the previous companies.json had drifted from reality within days — it
// named aoz-wohnen (renamed), sent evig to revampit.orangecat.ch (a redirect),
// listed sbb.orangecat.ch (retired) — and the page that was actually live had
// been edited by hand on the server with no source here at all.
//
//   node site/generate.mjs            fetch map, write index.html + map.json + snapshots
//   node site/generate.mjs --offline  build from site/map.snapshot.json
//   node site/generate.mjs --check    exit 1 if index.html differs from generation
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const MAP_URL = process.env.FLEET_MAP_URL ?? "https://loki.orangecat.ch/api/fleet/map";
const SNAPSHOT = join(here, "map.snapshot.json");

// The packages are NOT the fleet map: ventures are things that run, packages
// are things you install. Two different objects, so two sources — this one is
// derived by bitbaum/fleet's shared-registry audit from real package.json data
// across the org, never typed. Same fetch-or-snapshot contract as the map.
const PACKAGES_URL =
  process.env.FLEET_PACKAGES_URL ??
  "https://raw.githubusercontent.com/bitbaum/fleet/main/registers/packages.json";
const PACKAGES_SNAPSHOT = join(here, "packages.snapshot.json");

const GROUPS = [
  ["products", "Products"],
  ["clients", "Clients"],
  ["demos", "Demos"],
  ["next", "Not live"],
];

const args = new Set(process.argv.slice(2));

async function fetchOrSnapshot(url, snapshot, what) {
  if (!args.has("--offline")) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json = await res.json();
        writeFileSync(snapshot, JSON.stringify(json, null, 2) + "\n");
        return json;
      }
      console.error(`${what} answered ${res.status}; using snapshot`);
    } catch (e) {
      console.error(`${what} unreachable (${e?.message ?? e}); using snapshot`);
    }
  }
  // A missing source must not silently produce a page with nothing on it —
  // that reads exactly like "we have none".
  if (!existsSync(snapshot)) throw new Error(`no ${what} and no snapshot — cannot build`);
  return JSON.parse(readFileSync(snapshot, "utf8"));
}

/** The map's layer → this page's section. Overrides win. */
function groupFor(p) {
  switch (p.layer) {
    case "economic":
    case "capability":
    case "governance":
    case "product":
      return p.status === "live" ? "products" : "next";
    case "client":
      return p.status === "live" ? "clients" : "next";
    case "demo":
      return "demos";
    default:
      return null; // the map also holds factory test sites and half-day prospects
  }
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

/** "3 days ago" for a stamp, "" when there is none. Coarse on purpose. */
function ago(iso, now) {
  if (!iso) return "";
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} months ago`;
}

/** The one line under a venture that says what last moved on it. */
function nowLine(p, now) {
  const log = p.now?.lastLog;
  const run = p.now?.lastRun;
  const open = p.now?.openRuns ?? 0;
  const parts = [];
  if (open > 0) parts.push(open === 1 ? "1 run in flight" : `${open} runs in flight`);
  if (log?.done) parts.push(`${ago(log.date.includes("T") ? log.date : `${log.date}T12:00:00Z`, now)}: ${log.done}`);
  else if (run) parts.push(`last run ${run.outcome}, ${ago(run.at, now)}`);
  return parts.join(" · ");
}

function rowHtml(v, now) {
  const live = Boolean(v.url) && v.group !== "next";
  const door = v.door ?? (v.url ? v.url.replace(/^https?:\/\//, "") : "not live");
  const doorHtml = live
    ? `<span class="door">${esc(door)} <span class="arrow" aria-hidden="true">&rarr;</span></span>`
    : `<span class="door">${esc(door)}</span>`;
  const line = nowLine(v, now);
  const nowHtml = line ? `<span class="now">${esc(line)}</span>` : "";
  const inner = `<span class="name">${esc(v.name)}</span><span class="what">${esc(v.what)}${nowHtml}</span>${doorHtml}`;
  return live
    ? `      <a class="row" href="${esc(v.url)}">${inner}</a>`
    : `      <div class="row off">${inner}</div>`;
}

function pkgHtml(p, editorial) {
  const what = editorial?.what ?? p.description ?? "";
  const uses = p.adopters === 1 ? "used in 1 app" : `used in ${p.adopters} apps`;
  const npmHref =
    p.install.source === "npm"
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

export function build(map, packages, cfg, now = Date.now()) {
  const ov = cfg.overrides ?? {};
  const ventures = [];
  const seen = new Set();
  for (const p of map.projects) {
    const o = ov[p.slug] ?? {};
    // The map's own purpose line is the default; overrides.json can still
    // shorten or replace it. No line anywhere, no row: a venture nobody has
    // described in one sentence is not ready to be shown.
    const what = o.what ?? p.what;
    if (!what) continue;
    const group = o.group ?? groupFor(p);
    if (!group) continue;
    seen.add(p.slug);
    ventures.push({
      slug: p.slug,
      name: o.name ?? p.name ?? p.slug,
      what,
      url: o.url ?? p.urls?.live ?? null,
      door: o.door,
      group,
      order: o.order ?? 99,
      now: p.now,
    });
  }
  // Extras exist for things the map cannot know yet. Once the map learns
  // about one, the map wins and the extra is skipped — a page must never show
  // the same venture twice, and it must never go stale for having been typed.
  for (const x of cfg.extras ?? []) {
    if (seen.has(x.slug)) continue;
    ventures.push({ order: 0, ...x });
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
${items.map((v) => rowHtml(v, now)).join("\n")}
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
  const inFlight = map.summary?.inFlight ?? 0;
  const navItems = [
    ...GROUPS.filter(([id]) => counts[id] > 0),
    ...(pkgRows ? [["packages", "Packages"]] : []),
  ];
  const pillars = (map.pillars ?? [])
    .map((p) => {
      const v = ventures.find((x) => x.slug === p.slug);
      const name = v?.name ?? p.slug;
      return `<span><b>${esc(name)}</b> ${esc(p.layer)}</span>`;
    })
    .join("");
  const head = readFileSync(join(here, "head.html"), "utf8");
  return `${head}<body>
  <header class="top">
    <div class="wrap">
      <a class="mark" href="#top">bitbaum</a>
      <nav>
${navItems.map(([id, t]) => `        <a href="#${id}">${t}</a>`).join("\n")}
        <a href="map.json">map.json</a>
      </nav>
    </div>
  </header>
  <main class="wrap">
    <div class="hero" id="top">
      <h1>The work, each its own.</h1>
      <p class="lead">${esc(map.thesis ?? "Products, client systems, and the shared packages they are all built from.")}</p>
      <p class="pillars">${pillars}</p>
      <p class="stats"><span><b>${liveCount}</b> live systems</span><span><b>${pkgCount}</b> open-source packages</span><span><b>${inFlight}</b> ${inFlight === 1 ? "run" : "runs"} in flight</span><span><b>1</b> server</span></p>
    </div>
${sections}
${pkgSection}
  </main>
  <footer>
    <div class="wrap">
      <span>Cato. Nothing here is registered. An orangecat.ch name is an address on this box.</span>
      <span>Generated from the <a href="${esc(MAP_URL)}">fleet map</a>${map.generatedAt ? `, ${esc(map.generatedAt.slice(0, 10))}` : ""} &middot; <a href="map.json">map.json</a></span>
    </div>
  </footer>
</body>
</html>
`;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  // --check proves the committed page matches the committed snapshot. It must
  // NOT refetch: the map carries a generatedAt that changes on every call, so
  // a live fetch would make every check fail and the gate would be deleted.
  if (args.has("--check")) args.add("--offline");
  const map = await fetchOrSnapshot(MAP_URL, SNAPSHOT, "fleet map");
  const packages = await fetchOrSnapshot(PACKAGES_URL, PACKAGES_SNAPSHOT, "package registry");
  const cfg = JSON.parse(readFileSync(join(here, "overrides.json"), "utf8"));
  // The page is rendered against a fixed clock in --check so "3 days ago" does
  // not make a fresh generation differ from the committed one by the hour.
  const clock = new Date(map.generatedAt ?? Date.now()).getTime();
  const html = build(map, packages, cfg, clock);
  const target = join(here, "index.html");
  const mapTarget = join(here, "map.json");
  const mapJson = JSON.stringify(map, null, 2) + "\n";
  if (args.has("--check")) {
    const current = existsSync(target) ? readFileSync(target, "utf8") : "";
    const currentMap = existsSync(mapTarget) ? readFileSync(mapTarget, "utf8") : "";
    if (current !== html || currentMap !== mapJson) {
      console.error("index.html / map.json differ from the map — run: node site/generate.mjs");
      process.exit(1);
    }
    console.log("index.html and map.json are in sync with the map");
  } else {
    writeFileSync(target, html);
    writeFileSync(mapTarget, mapJson);
    const n = (html.match(/class="row(?: off)?"/g) || []).length;
    console.log(
      `wrote site/index.html + site/map.json (${n} ventures, ${(packages.packages ?? []).length} packages, map ${map.generatedAt ?? "snapshot"})`,
    );
  }
}
