#!/usr/bin/env node
// bitbaum.orangecat.ch — the studio's front door, generated.
//
// What the site is FOR: bringing more people into the work. A visitor who has
// met Cato, found a repo, installed a package or read an article should be
// able to see what exists, find the part that concerns them, and take a
// concrete next step — install it, read its source, open a PR, or join the
// studio waitlist. So every page ends in an action, and every claim
// is something that can be checked: a live URL, a public repo, a screenshot a
// machine took, an adopter list derived from real manifests.
//
// What it is NOT: a list anyone types. Ventures come from the fleet map
// (Loki's register: what exists, where it runs, what state it is in), packages
// and their adopters from fleet's derived registry, origin dates from the
// proof register. This repo owns presentation only: overrides.json says the
// stage a venture is at, its field tags, its one line and its story.
//
// Pages: /  /work/  /<slug>/  /packages/  /studio/  — static HTML in site/dist/,
// served by Caddy's file_server with clean directory URLs.
//
//   node site/build.mjs            fetch the sources, write site/dist/
//   node site/build.mjs --require-fresh  fail if any source must fall back to a snapshot
//   node site/build.mjs --offline  build from the committed snapshots
//   node site/build.mjs --check    exit 1 if site/dist/ is stale
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { MARK_HEADER, MARK_FAVICON } from "./brand-mark.mjs";
import { createPackagePages } from "./packages-page.mjs";
import { publicMap } from "./public-map.mjs";
import { fig } from "./art.mjs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSync } from "esbuild";

const here = dirname(fileURLToPath(import.meta.url));
const DIST = join(here, "dist");
const args = new Set(process.argv.slice(2));
const packagesSha = process.env.FLEET_PACKAGES_SHA;
if (packagesSha && !/^[a-f0-9]{40}$/i.test(packagesSha)) {
  throw new Error("FLEET_PACKAGES_SHA must be a full 40-character Git commit SHA");
}
const packagesUrl = process.env.FLEET_PACKAGES_URL ?? (packagesSha
  ? `https://raw.githubusercontent.com/bitbaum/fleet/${packagesSha}/registers/packages.json`
  : "https://raw.githubusercontent.com/bitbaum/fleet/main/registers/packages.json");

const SOURCES = {
  map: [process.env.FLEET_MAP_URL ?? "https://loki.orangecat.ch/api/fleet/map", "map.snapshot.json", "fleet map"],
  packages: [packagesUrl, "packages.snapshot.json", "package registry"],
  origin: [process.env.FLEET_ORIGIN_URL ?? "https://raw.githubusercontent.com/bitbaum/fleet/main/registers/origin.json", "origin.snapshot.json", "origin register"],
  readings: [process.env.FLEET_READINGS_URL ?? "https://raw.githubusercontent.com/bitbaum/fleet/main/registers/readings.json", "readings.snapshot.json", "fleet readings"],
};
const SITE = "https://bitbaum.orangecat.ch";
const GITHUB = "https://github.com/bitbaum";
const CONTRIBUTING = "https://github.com/bitbaum/.github/blob/main/CONTRIBUTING.md";
const HIRE = "/hire/";
const ARTICLES = "https://orangecat.ch/articles";

async function fetchOrSnapshot([url, file, what]) {
  const snapshot = join(here, file);
  if (!args.has("--offline")) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json = await res.json();
        writeFileSync(snapshot, JSON.stringify(json, null, 2) + "\n");
        return json;
      }
      if (args.has("--require-fresh")) throw new Error(`${what} answered ${res.status}; --require-fresh forbids publishing from a snapshot`);
      console.error(`${what} answered ${res.status}; using snapshot`);
    } catch (e) {
      if (args.has("--require-fresh")) throw new Error(`${what} could not be fetched; --require-fresh forbids publishing from a snapshot: ${e?.message ?? e}`);
      console.error(`${what} unreachable (${e?.message ?? e}); using snapshot`);
    }
  }
  // A missing source must not silently produce a page with nothing on it.
  if (!existsSync(snapshot)) throw new Error(`no ${what} and no snapshot — cannot build`);
  return JSON.parse(readFileSync(snapshot, "utf8"));
}

// ── helpers ─────────────────────────────────────────────────────────────────
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthYear = (iso) => (iso ? `${MONTHS[new Date(iso).getUTCMonth()]} ${new Date(iso).getUTCFullYear()}` : "");
const host = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const MARK = MARK_HEADER();
const ARROW = `<span class="arrow" aria-hidden="true">&rarr;</span>`;
const LOKI_FEEDBACK = JSON.parse(readFileSync(join(here, "loki-feedback.json"), "utf8"));
if (!/^https:\/\//.test(LOKI_FEEDBACK.origin) || !/^fcw_[a-f0-9]{32}$/.test(LOKI_FEEDBACK.token)) {
  throw new Error("site/loki-feedback.json must contain an HTTPS Loki origin and public widget token");
}
// The pictures are drawn, not photographed: every full-screen section holds
// a scene from site/scenes.mjs, each about what its section says. Stock photos
// said nothing about building systems; a tree that is a neuron does.
const SCENES = ["neuron", "seed", "rings", "mycelium"];

/**
 * A full-screen section: one drawn scene, one statement, one way forward. The
 * text sits bottom-left where the scrim is darkest, so it stays readable
 * whatever the scene is doing and whatever theme the reader chose. `under`
 * slides the first section beneath the header.
 */
function fullBleed({ scene, id, under = false, strong = false, body }) {
  const life = SCENE_LIFE[scene] ?? "";
  if (!SCENES.includes(scene)) throw new Error(`scene ${scene} is not one of ${SCENES.join(", ")} (site/scenes.mjs)`);
  return `    <section class="bleed bleed-scene${under ? " bleed-under" : ""}"${id ? ` id="${esc(id)}"` : ""}${under ? " data-lodge" : ""}>
      <canvas class="scene-canvas" data-scene="${scene}" aria-hidden="true"></canvas>${life ? `\n${life}` : ""}
      <div class="bleed-scrim${strong ? " strong" : ""}" aria-hidden="true"></div>
      <div class="wrap bleed-body">
${body}
      </div>
    </section>`;
}

// What lives in each scene. Few figures per screen, each with room around it:
// the plain of "build it yourself" belongs to Dalí — the soft watch on its
// stone, spilled clockwork, the long-legged elephant far off, ergot on the
// rye, a hummingbird at the grown tree; the partners' meadow to the herd and
// what fruits from the network — the deer, Heidi's cow and Diplodoctor's
// diplodocus (both doors), mushrooms, a fern unrolling, and something vast
// passing in the fog behind. A dream of a past that never happened.
const SCENE_LIFE = {
  seed: `      <div class="horizon-life" aria-hidden="true">${fig("elephant", "walker")}${fig("watch-block")}${fig("gear-l", "gear g-big")}${fig("gear-s", "gear g-small")}</div>
      <div class="foreground" aria-hidden="true">${fig("rye-a")}${fig("rye-c")}${fig("rye-b")}</div>
      <div class="hummingbird" hidden aria-hidden="true">${fig("hummingbird")}</div>`,
  // Links sit in the scene, so this container is not aria-hidden; the two
  // doors carry their own labels and the rest is decorative.
  mycelium: `      <div class="horizon-life">${fig("fog-giant", "in-fog")}${fig("deer")}${fig("mushrooms-3", "shroom s1")}${fig("cow", "", { href: "/heidi/", label: "Heidi" })}${fig("mushroom-1", "shroom s2")}${fig("diplodocus", "", { href: "/diplodoctor/", label: "Diplodoctor" })}${fig("mushrooms-2", "shroom s3")}</div>
      <div class="foreground" aria-hidden="true">${fig("fiddlehead")}${fig("fern")}</div>`,
};

// The hero's far horizon, small in the haze: a La Mancha windmill turning its
// sails, and Don Quixote on Rocinante with his lance levelled at it, Sancho
// behind on his donkey.
const HORIZON_LIFE = `      <div class="horizon-life" aria-hidden="true">${fig("sancho")}${fig("quixote")}${fig("windmill")}</div>`;

// The White Rabbit, late, by the burrow in the Lodge floor.
const RABBIT = `      <div class="rabbit" aria-hidden="true"><div class="rabbit-hop">${fig("rabbit")}</div></div>`;
const DRAGONFLY = `<div class="dragonfly" hidden aria-hidden="true">${fig("dragonfly")}</div>`;

/**
 * The home hero, through the looking-glass: no photograph, a tree drawn live
 * as one line (site/scenes.mjs) over its disobedient reflection, the Lodge
 * floor, a clock that runs backwards, and the headline written again in the
 * glass — the way Carroll printed Jabberwocky. Everything but the copy is
 * aria-hidden decoration; without JavaScript the floor and copy still stand.
 */
function glassHero({ kicker, lines, lede, actions }) {
  const text = lines.join("<br>");
  return `    <section class="bleed bleed-under bleed-lodge glass" data-lodge data-cat-perch>
      <div class="lodge-floor" aria-hidden="true"></div>
      <canvas class="scene-canvas" data-scene="neuron" aria-hidden="true"></canvas>
      <div class="glass-horizon" aria-hidden="true"></div>
${HORIZON_LIFE}
      <div class="floor-plane"><a class="burrow" href="#start" aria-label="Follow the white rabbit" data-label="Follow the white rabbit &darr;"><span class="burrow-mouth" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="${SPIRAL}"/></svg></span></a></div>
${RABBIT}
      ${DRAGONFLY}
      <div class="wrap bleed-body">
        <div class="bleed-copy rise">
          <span class="kicker">${kicker}</span>
          <div class="glass-title">
            <h1 class="headline-caps">${text}</h1>
          </div>
          <p class="bleed-lede">${lede}</p>
          <div class="bleed-actions">
${actions}
          </div>
        </div>
      </div>
    </section>`;
}

// Loki's spiral, used as the rabbit hole between chapters. An Archimedean
// spiral from the rim inwards, generated rather than pasted so it stays one line.
const SPIRAL = (() => {
  const pts = [];
  for (let th = 0; th <= Math.PI * 2 * 4.25; th += 0.12) {
    const r = 46 * (1 - th / (Math.PI * 2 * 4.6));
    pts.push(`${(50 + r * Math.cos(th - Math.PI / 2)).toFixed(2)} ${(50 + r * Math.sin(th - Math.PI / 2)).toFixed(2)}`);
  }
  return `M${pts.join(" L")}`;
})();
// The cat: OrangeCat's, very small and very round, with its tail curled into
// Loki's spiral. lodge.mjs chooses where it sits (in the tree it is the
// Cheshire cat); it is a real link to OrangeCat's page.
const CAT = `  <a class="cat" href="/orangecat/" hidden aria-label="OrangeCat" data-label="OrangeCat &rarr;">${fig("cat")}</a>`;

// The egg the fox hatches from, and the fox. lodge.mjs runs the hatching; the
// bottom half of the shell stays where it was.
const EGG = `  <div class="egg" hidden aria-hidden="true">${fig("egg", "egg-whole")}${fig("egg-bottom", "egg-half")}${fig("egg-top", "egg-cap")}</div>`;
const FOX = `  <div class="fox" hidden aria-hidden="true">${fig("fox", "fox-run")}${fig("kit", "fox-kit")}</div>`;

// Now and then a whale swims across the sky, and in fog something vast
// passes behind the page. Fixed to the sky, behind every word.
const SKY_LIFE = `  <div class="sky-life" aria-hidden="true"><div class="whale" hidden>${fig("whale")}</div><div class="fog-walker" hidden>${fig("fog-neck")}</div></div>`;

const RABBIT_HOLE = `    <div class="rabbit-hole" aria-hidden="true"><svg viewBox="0 0 100 100"><path d="${SPIRAL}"/></svg></div>`;

// Which widget modes this site asks for. Chat is opt-in per embed (Loki's
// widget/surface-modes.ts) and it is the one the homepage's Ask box opens.
if (!/^(report|chat|watch)(,(report|chat|watch))*$/.test(LOKI_FEEDBACK.modes ?? "")) {
  throw new Error("site/loki-feedback.json must list the widget modes, e.g. \"chat,report\"");
}

// ── the ventures: register facts + presentation + what they are built from ──
export function ventures(map, cfg, origin, packages) {
  const byRepo = new Map((origin?.repos ?? []).map((r) => [r.repo.split("/")[1], r]));
  const alias = cfg.adopterAliases ?? {};
  // Invert the registry: which packages does each venture use? The registry
  // names adopters by repository, so an alias map carries the few that differ.
  const uses = new Map();
  for (const p of packages?.packages ?? []) {
    for (const a of p.adopterNames ?? []) {
      const slug = alias[a] ?? a;
      if (!uses.has(slug)) uses.set(slug, []);
      uses.get(slug).push(p.slug);
    }
  }
  const out = [];
  const seen = new Set();
  const build = (o, p = {}) => {
    const repoName = p.urls?.repo ? p.urls.repo.split("/").pop() : null;
    const org = repoName ? byRepo.get(repoName) : null;
    const url = o.url ?? p.urls?.live ?? null;
    const slug = o.slug ?? p.slug;
    return {
      slug,
      name: o.name ?? p.name ?? slug,
      what: o.what,
      homeLine: o.homeLine ?? null,
      story: o.story ?? "",
      stage: o.stage,
      tags: o.tags ?? [],
      pillar: o.pillar ?? null,
      pillarRole: o.pillarRole ?? null,
      stack: o.stack ?? null,
      // Who built it. Every project so far is the studio's; a partner's work
      // carries the partner's name, so the portfolio shows who built what.
      builtBy: o.builtBy ?? "bitbaum studio",
      // What the product is FOR, from its Loki profile (the SSOT, edited where
      // the product is built) — so the page grows as the product does. An
      // editorial override wins where the profile has fallen behind.
      identity: { ...(p.identity ?? {}), ...(o.identity ?? {}) },
      roadmap: (p.roadmap ?? []).filter((r) => r?.title),
      for: o.for ?? null,
      order: o.order ?? 99,
      status: p.status ?? (url ? "live" : ""),
      url,
      repo: p.urls?.repo ?? o.repo ?? null,
      since: org?.firstCommit?.date ?? p.since ?? null,
      shot: o.shot !== false && Boolean(url),
      uses: (uses.get(slug) ?? []).sort(),
      // Where else this project exists. The fleet map has carried these two
      // since it was published and this generator discarded them, so "which
      // projects have a profile where" was a question only the raw JSON could
      // answer. Loki is deliberately not here: every project on the map is a
      // Loki project by construction (35 of 35) and its project pages need a
      // session — a column that is always true and never clickable tells a
      // reader nothing.
      profiles: {
        orangecat: p.urls?.orangecat ?? null,
        solon: p.urls?.solon ?? null,
      },
    };
  };
  for (const p of map.projects ?? []) {
    const o = cfg.overrides?.[p.slug];
    if (!o?.what || !o.stage) continue;
    seen.add(p.slug);
    out.push(build({ ...o, slug: p.slug }, p));
  }
  for (const x of cfg.extras ?? []) {
    if (seen.has(x.slug) || !x.what || !x.stage) continue;
    out.push(build(x));
  }
  // The stage order is owned by overrides.json alongside its labels, filters
  // and definitions. The pager follows the same sequence as the work grid.
  const stageRank = new Map(Object.keys(cfg.stages ?? {}).map((stage, index) => [stage, index]));
  return out.sort((a, b) => (stageRank.get(a.stage) ?? Number.MAX_SAFE_INTEGER) - (stageRank.get(b.stage) ?? Number.MAX_SAFE_INTEGER) || a.order - b.order || a.name.localeCompare(b.name));
}

// apps.conf `live` means the process is SERVED. It is not a release claim, and
// rendering it as one is the mistake this table exists to not make: nothing
// here is finished enough to hand over without a caveat, OrangeCat included,
// so the public word is beta. "Live" is reserved for something we would be
// comfortable releasing, and today that is nothing.
const STATUS_TEXT = { live: "beta", demo: "demo", validating: "validating", prospect: "not built", unverified: "concept", "not live": "not live" };
function pill(v) {
  if (v.stage === "next") return `<span class="pill">not built</span>`;
  if (v.stage === "concept") return `<span class="pill">concept</span>`;
  if (v.stage === "development") return `<span class="pill">in development</span>`;
  const text = STATUS_TEXT[v.status] ?? v.status;
  // Keyed on the STATUS, not the rendered word — so renaming the word cannot
  // silently drop the accent that marks a thing you can actually open.
  return text ? `<span class="pill ${v.status === "live" ? "beta" : ""}">${esc(text)}</span>` : "";
}

// ── page chrome ─────────────────────────────────────────────────────────────
function shell({ title, description, path, body, nav, script, image }) {
  // A link to this site is how almost anyone arrives, so the card a share
  // renders is part of the page: a venture shows its own screenshot, every
  // other page the studio card (site/og.mjs).
  const ogImage = `${SITE}${image ?? "/og/studio.png"}`;
  // The header carries four destinations and one action; everything else is
  // in the menu (phones) and the footer. Solon's pattern, which reads well:
  // six links wrapped onto two rows made the phone header 164px tall.
  // Three destinations and one action, as on Solon. A visitor comes to get
  // something built; "Start a project" is where every path begins.
  const items = [
    ["/work/", "The work"],
    ["/partners/", "Partners"],
    ["/hire/", "Studio"],
  ];
  const cur = (href) => (nav === href ? ' aria-current="page"' : "");
  const themeSwitch = `<div class="theme" role="group" aria-label="Colour theme">
        <button type="button" data-set-theme="light" title="Light" aria-label="Light">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.4"/><path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.3 5.3l1.9 1.9M16.8 16.8l1.9 1.9M18.7 5.3l-1.9 1.9M7.2 16.8l-1.9 1.9"/></svg>
        </button>
        <button type="button" data-set-theme="system" title="Match system" aria-label="Match system">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.8" y="4.4" width="18.4" height="12.6" rx="1.6"/><path d="M8.6 20.4h6.8"/></svg>
        </button>
        <button type="button" data-set-theme="dark" title="Dark" aria-label="Dark">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 14.3A8.6 8.6 0 1 1 9.7 3.5a6.9 6.9 0 0 0 10.8 10.8z"/></svg>
        </button>
      </div>`;
  // One map of the site, rendered twice: as the phone menu and as the footer.
  // Two hand-kept lists drift; this cannot.
  const sections = [
    ["Explore", [["/work/", "The work"], ["/partners/", "Partners"], ["/studio/", "About bitbaum"], [ARTICLES, "Writing ↗"]]],
    ["Build with us", [["/partners/#join", "Become a partner"], ["/packages/", "Packages (for developers)"], [GITHUB, "GitHub ↗"], [CONTRIBUTING, "Contributing ↗"]]],
    ["The studio", [[HIRE, "Engagements and rates"], [`${HIRE}#waitlist`, "Join the waitlist"]]],
  ];
  const sectionLinks = (links) =>
    links.map(([href, t]) => `<a href="${esc(href)}"${cur(href)}${href.startsWith("http") ? ' rel="noopener"' : ""}>${esc(t)}</a>`).join("\n          ");
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "bitbaum",
    url: SITE,
    address: { "@type": "PostalAddress", addressLocality: "Zürich", addressCountry: "CH" },
    sameAs: [GITHUB],
  });
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:site_name" content="bitbaum">
<meta property="og:type" content="website">
<meta property="og:image" content="${ogImage}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${ogImage}">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#000000" media="(prefers-color-scheme: dark)">
<script type="application/ld+json">${jsonLd}<\/script>
<script>
  // Tiny FOUC guard only — theme UI lives in /theme.mjs.
  (function () {
    try {
      var saved = localStorage.getItem("theme") || "system";
      var dark = saved === "dark" || (saved === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
      document.documentElement.dataset.theme = saved;
    } catch (e) {
      document.documentElement.classList.toggle("dark", matchMedia("(prefers-color-scheme: dark)").matches);
    }
  })();
<\/script>
<link rel="icon" href="/logo-mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="/tokens.css">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
  <canvas class="sky" aria-hidden="true"></canvas>
${SKY_LIFE}
  <svg class="defs" width="0" height="0" aria-hidden="true" focusable="false"><filter id="ripple"><feTurbulence type="fractalNoise" baseFrequency="0.006 0.09" numOctaves="2" seed="7"/><feDisplacementMap in="SourceGraphic" scale="22"/></filter><filter id="ripple-soft"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.12" numOctaves="1" seed="3"/><feDisplacementMap in="SourceGraphic" scale="6"/></filter></svg>
  <a class="skip" href="#main">Skip to content</a>
  <header class="top" data-header>
    <div class="wrap">
      <a class="mark" href="/">${MARK}bitbaum</a>
      <nav class="top-links" aria-label="Site">
${items.map(([href, t]) => `        <a href="${href}"${cur(href)}>${t}</a>`).join("\n")}
      </nav>
      <a class="btn primary top-cta" href="/#start">Start a project ${ARROW}</a>
      <button type="button" class="menu-btn" aria-expanded="false" aria-controls="site-menu" aria-label="Open menu" data-menu-toggle>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="menu-open" d="M4 7h16M4 12h16M4 17h16"/><path class="menu-close" d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </div>
  </header>
${body}
  <footer>
    <div class="wrap">
      <div class="foot-cols">
        <div class="foot-brand">
          <a class="mark" href="/">${MARK}bitbaum</a>
          <p>AI-native products on infrastructure that is open by construction. Built in Zürich.</p>
          ${themeSwitch}
        </div>
${sections.map(([title, links]) => `        <nav aria-label="${esc(title)}">
          <h2 class="label">${esc(title)}</h2>
          ${sectionLinks(links)}
        </nav>`).join("\n")}
      </div>
      <p class="foot-note">bitbaum is built in Zürich, in the open. Nothing here is registered as a company; an orangecat.ch name is an address on one server.</p>
    </div>
  </footer>
  <div class="site-menu" id="site-menu" hidden>
    <div class="wrap">
      <div class="menu-actions">
        <a class="btn primary" href="/#start">Start a project ${ARROW}</a>
        <a class="btn secondary" href="/#ask">Ask anything ${ARROW}</a>
      </div>
${sections.map(([title, links]) => `      <nav aria-label="${esc(title)}">
        <h2 class="label">${esc(title)}</h2>
        ${sectionLinks(links)}
      </nav>`).join("\n")}
      <div class="menu-theme"><span class="label">Theme</span>${themeSwitch}</div>
    </div>
  </div>
  <script type="module" src="/theme.mjs"><\/script>
  <script type="module" src="/nav.mjs"><\/script>
${CAT}
${path === "/" ? "" : `${EGG}\n${FOX}`}
  <script type="module" src="/sky.mjs"><\/script>
  <script type="module" src="/lodge.mjs"><\/script>
${script ?? ""}${body.includes("data-scene") ? `\n  <script type="module" src="/scenes.mjs"><\/script>\n  <script type="module" src="/creatures.mjs"><\/script>` : ""}
  <script src="${esc(LOKI_FEEDBACK.origin)}/widget.js" data-fc-project="${esc(LOKI_FEEDBACK.token)}" data-fc-modes="${esc(LOKI_FEEDBACK.modes)}" async><\/script>
</body>
</html>
`;
}

// ── cards ───────────────────────────────────────────────────────────────────
function card(v, filterable = false) {
  const img = v.shot
    ? `        <div class="shot"><img src="/shots/${esc(v.slug)}.jpg" alt="${esc(v.name)} — screenshot" loading="lazy" width="1280" height="800"></div>\n`
    : "";
  // Who built it (and for whom) — the portfolio says who made what. Something
  // not built has no builder to credit.
  const credit = [v.stage !== "next" && v.builtBy ? `by ${esc(v.builtBy)}` : "", v.for ? `for ${esc(v.for)}` : ""].filter(Boolean).join(" · ");
  const sub = credit ? `<span class="card-by">${credit}</span>` : "";
  const meta = filterable ? `data-stage="${esc(v.stage)}" data-tags="${esc(v.tags.map(slugify).join(" "))}" data-name="${esc(v.name)}" data-host="${esc(host(v.url ?? ""))}" data-since="${esc(v.since ?? "")}"` : "";
  return `      <a class="card${v.shot ? "" : " text"}" href="/${esc(v.slug)}/"${meta ? ` ${meta}` : ""}>
${img}        <div class="card-body">
          <div class="card-top"><span class="card-name">${esc(v.name)}</span>${pill(v)}</div>
          <span class="card-what">${esc(v.what)}</span>${sub ? `\n          ${sub}` : ""}
        </div>
      </a>`;
}

const { pkgCard, packagesPage, packagePage, shownPackages } = createPackagePages({ esc, shell });

// ── the work: one grid, two facets ──────────────────────────────────────────
//
// Four sections by commercial honesty was the right TRUTH and the wrong
// NAVIGATION: someone looking for health tools had to read all four. So the
// stage becomes a facet rather than a heading — the honesty survives as a
// definition under the filter and as a pill on every card — and the field
// becomes a second facet. Without JavaScript every card is visible, which is
// the correct fallback for a list.
function workSection(all, cfg) {
  const stages = Object.entries(cfg.stages ?? {}).filter(([k]) => all.some((v) => v.stage === k));
  const tags = (cfg.tagOrder ?? []).filter((t) => all.some((v) => v.tags.includes(t)));
  const chip = (facet, value, label, n, title) =>
    `<button type="button" class="chip" data-facet="${facet}" data-value="${esc(value)}" aria-pressed="false"${title ? ` title="${esc(title)}"` : ""}>${esc(label)}<span class="chip-n">${n}</span></button>`;
  // Vertical filters beside the grid: the projects are the page, the filters
  // are a tool beside them — not two rows of chips and a legend stacked on top
  // of the first card. On a phone the same panel folds shut above the grid.
  return `    <section class="section work-section" id="work">
      <div class="wrap work-layout">
        <aside class="work-side" aria-label="Filter the work">
          <details class="work-filters-box" id="work-filters-box">
            <summary class="work-filters-summary">Filter the work</summary>
            <div class="filters" id="work-filters" hidden>
              <label class="filter-search">Search<input id="work-search" type="search" placeholder="Product, purpose or address" autocomplete="off"></label>
              <div class="filter-group"><span class="label">Stage</span><div class="chips vertical">
${stages.map(([k, st]) => `                ${chip("stage", k, st.plural, all.filter((v) => v.stage === k).length, st.lede)}`).join("\n")}
              </div></div>
              <div class="filter-group"><span class="label">Field</span><div class="chips vertical">
${tags.map((t) => `                ${chip("field", slugify(t), t, all.filter((v) => v.tags.includes(t)).length)}`).join("\n")}
              </div></div>
              <label class="filter-sort">Sort by<select id="work-sort"><option value="studio">Studio order</option><option value="name">Name</option><option value="newest">Newest</option></select></label>
              <button type="button" class="clear" id="clear-filters" hidden>Clear filters</button>
              <details class="stage-help"><summary>What the stages mean</summary>
                <dl class="legend">
${stages.map(([, st]) => `                  <div><dt>${esc(st.plural)}</dt><dd>${esc(st.lede)}</dd></div>`).join("\n")}
                </dl>
              </details>
            </div>
          </details>
        </aside>
        <div class="work-main">
          <p class="work-count"><span id="work-count">${all.length} of ${all.length}</span> projects</p>
          <div class="grid work-grid" id="work-grid">
${all.map((v) => card(v, true)).join("\n")}
          </div>
          <p class="empty" id="work-empty" hidden>Nothing at that intersection yet. <button type="button" class="linkish" data-clear>Clear the filter</button> to see everything.</p>
        </div>
      </div>
    </section>`;
}

const FILTER_SCRIPT = `  <script type="module" src="/work-filter.mjs"></script>`;
// The site's chat (site/chat/chat.tsx): @bitbaum/chatkit, bundled once into
// /chat.js and mounted wherever a page renders chatMount(). The fleet's one
// chat — mic, 16px, stop, retry, who is speaking — instead of forms.
const CHAT_SCRIPT = `  <link rel="stylesheet" href="/chatkit.css">
  <script type="module" src="/chat.js"></script>`;

/**
 * "The studio is at capacity — build it yourself." The same three products the
 * studio builds with, offered to the visitor: build with Loki, earn with
 * OrangeCat, decide with Solon. Shared by the homepage and /hire/, so the
 * invitation reads the same wherever someone meets the closed door.
 */
function buildYourselfBand(all, hire, { heading = true } = {}) {
  const by = new Map(all.map((v) => [v.slug, v]));
  const paths = [
    ["loki", "Build it", "Describe what you want; a fleet of AI agents builds, tests and ships it, and you approve what goes live. The system that built everything on this site."],
    ["orangecat", "Earn from it", "Sell it and get paid: pay links, services and backing, settled in Bitcoin straight to your wallet. Nobody holds your money but you."],
    ["solon", "Decide it together", "Run it with others: proposals and one-click votes for a team, a co-op or a community, with a record everyone can see."],
  ].filter(([slug]) => by.get(slug)?.url);
  const offers = hire?.offers ?? [];
  const from = offers[0] ? `${esc(offers[0].name)} ${esc(offers[0].price)}${offers[0].unit ? ` ${esc(offers[0].unit)}` : ""}` : "";
  return `    <section class="section build-band" id="build-yourself">
      <div class="wrap">
        ${heading ? `<div class="section-head">
          <div class="stack-head"><span class="eyebrow">${esc(hire?.availability?.shortLine ?? "The studio")}</span><h2 class="display-2">Build it yourself — with the same system.</h2></div>
          <p class="lede">The studio is full, but the tools it builds with are open. Loki, OrangeCat and Solon cover every part of an idea: making it, earning from it, and running it with other people.</p>
        </div>` : ""}
        <div class="build-paths">
${paths.map(([slug, verb, line]) => {
    const v = by.get(slug);
    return `          <a class="build-path" href="${esc(v.url)}">
            <span class="label">${esc(verb)}</span>
            <span class="build-path-name">${esc(v.name)}</span>
            <span class="build-path-line">${esc(line)}</span>
            <span class="build-path-go">Open ${esc(host(v.url))} ${ARROW}</span>
          </a>`;
  }).join("\n")}
        </div>
        <p class="build-wait">Rather have the studio build it? ${from ? `Engagements start at ${from}; ` : ""}<a class="textlink" href="${HIRE}">see rates</a> and <a class="textlink" href="${HIRE}#waitlist">join the waitlist</a> to hear first when a slot opens.</p>
      </div>
    </section>`;
}

/** Where the chat mounts. Without JavaScript it says so and points onward. */
function chatMount({ title, starters }) {
  return `<div class="chat-mount" data-chat data-origin="${esc(LOKI_FEEDBACK.origin)}" data-token="${esc(LOKI_FEEDBACK.token)}" data-title="${esc(title)}" data-starters="${esc(JSON.stringify(starters))}">
          <p class="caption">The chat needs JavaScript. <a class="textlink" href="/work/">Browse every project</a> or <a class="textlink" href="${HIRE}#waitlist">join the waitlist</a>.</p>
        </div>`;
}

// ── pages ───────────────────────────────────────────────────────────────────
export function homePage(all, packages, cfg, origin, readings, hire) {
  const ventureBySlug = new Map(all.map((v) => [v.slug, v]));
  const alias = cfg.adopterAliases ?? {};
  const packageBySlug = new Map((packages.packages ?? []).map((p) => [p.slug, p]));
  const pkgCount = (packages.packages ?? []).length;
  const home = cfg.home ?? {};
  const flagshipSlugs = home.flagshipProjects ?? [];
  const packageSlugs = home.featuredPackages ?? [];
  const unique = (items) => items.length > 0 && new Set(items).size === items.length;
  if (!unique(flagshipSlugs) || flagshipSlugs.some((slug) => !ventureBySlug.has(slug))) {
    throw new Error("home.flagshipProjects must name distinct projects in the fleet map");
  }
  if (!unique(packageSlugs) || packageSlugs.some((slug) => !packageBySlug.has(slug))) {
    throw new Error("home.featuredPackages must name distinct packages in Fleet's package registry");
  }
  const flagships = flagshipSlugs.map((slug) => ventureBySlug.get(slug));
  const featuredPackages = packageSlugs.map((slug) => packageBySlug.get(slug));
  const stageLinks = Object.entries(cfg.stages ?? {})
    .filter(([stage]) => all.some((v) => v.stage === stage))
    .map(([stage, definition]) => {
      const count = all.filter((v) => v.stage === stage).length;
      return `<a class="stage-link" href="/work/#work?stage=${encodeURIComponent(stage)}"><span class="stage-count">${count}</span><span>${esc(definition.plural)}</span></a>`;
    }).join("\n");
  // The portfolio, shown rather than counted: running products and pilots
  // beyond the three flagships, each with its screenshot.
  const featuredWork = all
    .filter((v) => ["product", "pilot"].includes(v.stage) && !flagshipSlugs.includes(v.slug) && v.shot)
    .slice(0, 6);
  // Packages are for developers; on a portfolio they are one line, not a section.
  const pkgLine = featuredPackages
    .map((p) => `<a class="textlink" href="/packages/${esc(p.slug)}/" data-package="${esc(p.slug)}">${esc(p.slug)}</a>`)
    .join(", ");
  // The front desk: the site's chat, where the Cat and Loki answer from the
  // public fleet map.
  const ask = home.ask;
  if (!ask?.headline || !ask.lede || !(ask.starters?.length >= 2)) {
    throw new Error("home.ask needs a headline, a lede and at least two starters");
  }
  const askSection = `    <section class="section ask-section" id="ask">
      <div class="wrap ask">
        <div class="ask-copy">
          <span class="kicker quiet">${esc(ask.eyebrow ?? "Ask")}</span>
          <h2 class="headline-caps section-title">${esc(ask.headline)}</h2>
          <p class="lede">${esc(ask.lede)}</p>
        </div>
        ${chatMount({ title: "", starters: ask.starters })}
      </div>
    </section>`;
  const by = (slug) => ventureBySlug.get(slug);
  const studioOffer = (hire?.offers ?? [])[0];
  const studioFrom = studioOffer ? `From ${esc(studioOffer.price)}${studioOffer.unit ? ` ${esc(studioOffer.unit)}` : ""}` : "Published rates";
  const studioOpen = hire?.availability?.state !== "closed";
  // "How do you want it built?" — the one decision on the page, cheapest first.
  // The studio is not a separate world: it is the third answer, honestly
  // marked when it is full.
  const paths = [
    {
      n: "01", key: "self", title: "Build it yourself",
      price: "Free to start", when: "Start now", open: true,
      body: "Describe what you want. A fleet of AI agents builds it and you approve what ships — then sell it with OrangeCat and run it with others in Solon.",
      cta: "Start with Loki", href: by("loki")?.url ?? "https://loki.orangecat.ch/",
    },
    {
      n: "02", key: "partner", title: "Hire a partner",
      price: "Less than the studio", when: "Partners are joining", open: false,
      body: "Approved builders who work with the same tools, show their work here, and set their own prices. You hire them directly.",
      cta: "Meet the partners", href: "/partners/",
    },
    {
      n: "03", key: "studio", title: "The bitbaum studio",
      price: studioFrom, when: studioOpen ? "Taking projects" : "Fully booked", open: studioOpen,
      body: "Bespoke, production-grade work: built, run and handed over so a normal team can keep it going.",
      cta: studioOpen ? "Talk to the studio" : "Join the waitlist", href: `${HIRE}#waitlist`,
    },
  ];
  const pathCards = paths.map((pth) => `          <a class="path" href="${esc(pth.href)}" data-path="${pth.key}">
            <span class="path-n">${pth.n}</span>
            <span class="path-title">${esc(pth.title)}</span>
            <span class="path-meta"><span class="path-price">${esc(pth.price)}</span><span class="path-when${pth.open ? " open" : ""}">${esc(pth.when)}</span></span>
            <span class="path-body">${esc(pth.body)}</span>
            <span class="path-cta">${esc(pth.cta)} ${ARROW}</span>
          </a>`).join("\n");
  const tools = flagships.map((v) => {
    if (!v.pillar || !v.homeLine) throw new Error(`home flagship ${v.slug} needs a pillar and concise homeLine`);
    return `          <a class="tool" href="/${esc(v.slug)}/" data-stack-project="${esc(v.slug)}">
            ${v.shot ? `<span class="tool-shot"><img src="/shots/${esc(v.slug)}.jpg" alt="" loading="lazy" width="1280" height="800"></span>` : ""}
            <span class="tool-copy"><span class="label">${esc(v.pillar)}</span>${pill(v)}</span>
            <span class="tool-name">${esc(v.name)}</span>
            <span class="tool-line">${esc(v.homeLine)}</span>
          </a>`;
  }).join("\n");
  const body = `  <main id="main" class="home-page">
${glassHero({
    kicker: "AI-native product studio &middot; Zürich",
    lines: ["One trunk.", "Many products."],
    lede: "We build software products — and the tools that let anyone build their own.",
    actions: `            <a class="btn-frame-accent" href="#start">Start a project ${ARROW}</a>
            <a class="btn-frame" href="/work/">See the work</a>`,
  })}

    <section class="section paths-section" id="start">
      <div class="wrap">
        <span class="kicker quiet">Start a project</span>
        <h2 class="headline-caps section-title">How do you want it built?</h2>
        <div class="paths">
${pathCards}
        </div>
      </div>
    </section>

${fullBleed({ scene: "seed", id: "build-yourself", body: `        <div class="bleed-copy">
          <span class="kicker">Build it yourself</span>
          <h2 class="headline-caps">Make it yourself.<br>Today.</h2>
          <p class="bleed-lede">The studio is full; its tools are not. The same three products it builds with are open to you — make it, earn from it, run it with other people.</p>
          <div class="bleed-actions">
            <a class="btn-frame-accent" href="${esc(by("loki")?.url ?? "https://loki.orangecat.ch/")}">Start with Loki ${ARROW}</a>
            <a class="btn-frame" href="#tools">How the tools fit</a>
          </div>
        </div>` })}

    <section class="section tools-section" id="tools">
      <div class="wrap">
        <span class="kicker quiet">The tools</span>
        <h2 class="headline-caps section-title">Build. Earn. Decide.</h2>
        <div class="tools">
${tools}
        </div>
      </div>
    </section>

${RABBIT_HOLE}

    <section class="section" id="work-preview">
      <div class="wrap">
        <div class="home-section-head">
          <div><span class="kicker quiet">The work</span><h2 class="headline-caps section-title">Built here, running now</h2></div>
          <a class="textlink" href="/work/">All ${all.length} projects ${ARROW}</a>
        </div>
        <div class="grid home-work-grid">
${featuredWork.map((v) => card(v, false)).join("\n")}
        </div>
        <p class="home-section-note">Every project is labelled by the stage it is really at: <span class="stage-inline">${stageLinks}</span></p>
      </div>
    </section>

${fullBleed({ scene: "rings", id: "studio", body: `        <div class="bleed-copy">
          <span class="kicker">The studio &middot; ${esc(studioOpen ? "Taking projects" : "Fully booked")}</span>
          <h2 class="headline-caps">Built for you.<br>Built to last.</h2>
          <p class="bleed-lede">${esc(hire?.lede ?? "")} ${esc(studioFrom)}.</p>
          <div class="bleed-actions">
            <a class="btn-frame-accent" href="${HIRE}#waitlist">${esc(studioOpen ? "Talk to the studio" : "Join the waitlist")} ${ARROW}</a>
            <a class="btn-frame" href="${HIRE}">Rates and how it works</a>
          </div>
        </div>` })}

${fullBleed({ scene: "mycelium", id: "join", strong: true, body: `        <div class="bleed-copy">
          <span class="kicker">Partners</span>
          <h2 class="headline-caps">Build here.</h2>
          <p class="bleed-lede">Approved builders take the work the studio cannot — with the same tools, under their own name, at their own price. The customer hires them directly.</p>
          <div class="bleed-actions">
            <a class="btn-frame-accent" href="/partners/#join">Become a partner ${ARROW}</a>
            <a class="btn-frame" href="/partners/">Meet the partners</a>
          </div>
        </div>` })}

${RABBIT_HOLE}

${askSection}

    <section class="dev-band">
      <div class="wrap">
        <p><span class="label">For developers</span> The ${pkgCount} MIT packages behind these products — ${pkgLine} and more. <a class="textlink" href="/packages/">Explore packages ${ARROW}</a></p>
      </div>
    </section>
  </main>`;
  return shell({
    title: "bitbaum — one trunk, many products",
    description: "An AI-native product studio building tools for agent-led work, economic participation and shared governance. Explore Loki, OrangeCat and Solon.",
    path: "/", body, nav: "/", script: CHAT_SCRIPT,
  });
}

// ── partners ────────────────────────────────────────────────────────────────
//
// The second answer to "how do you want it built?": approved builders who use
// the same tools, under their own name and price. site/partners.json is the
// list you approve — it is empty until the first real partner is approved, and
// the page says so rather than showing anyone who is not real.
const PARTNERS = JSON.parse(readFileSync(join(here, "partners.json"), "utf8"));

function partnerCard(pt) {
  const open = pt.availability === "available";
  return `          <article class="partner">
            <div class="partner-top"><span class="partner-name">${esc(pt.name)}</span><span class="path-when${open ? " open" : ""}">${esc(open ? "Available" : pt.availability === "limited" ? "Limited" : `Fully booked${pt.nextOpening ? ` · opens ${pt.nextOpening}` : ""}`)}</span></div>
            <span class="partner-line">${esc(pt.headline ?? "")}</span>
            ${pt.rate ? `<span class="path-price">${esc(pt.rate)}</span>` : ""}
            <div class="bleed-actions"><a class="btn primary" href="${esc(pt.url)}">${esc(open ? `Ask ${pt.name}` : "Join the waitlist")} ${ARROW}</a></div>
          </article>`;
}

export function partnersPage() {
  const steps = [
    ["Apply", "Tell us what you build and show work you have shipped — in the chat below, in your own words."],
    ["Get approved", "The studio looks at your work. Approved partners are listed here with their projects, rates and availability."],
    ["Take the work", "Customers hire you directly and pay you directly. You build with Loki, OrangeCat and Solon — the same tools the studio uses. The studio takes no cut."],
  ];
  const body = `  <main id="main">
${fullBleed({ scene: "mycelium", under: true, strong: true, body: `        <div class="bleed-copy rise">
          <span class="kicker">Partners</span>
          <h1 class="headline-caps">Build here.</h1>
          <p class="bleed-lede">The studio is full. Approved partner builders take the work it cannot — with the same tools, under their own name, at their own price.</p>
          <div class="bleed-actions">
            <a class="btn-frame-accent" href="#join">Become a partner ${ARROW}</a>
            <a class="btn-frame" href="#partners">Find a partner</a>
          </div>
        </div>` })}

    <section class="section" id="partners">
      <div class="wrap">
        <span class="kicker quiet">Partners</span>
        <h2 class="headline-caps section-title">${PARTNERS.length ? "Hire a partner" : "The first partners are joining"}</h2>
${PARTNERS.length
    ? `        <div class="partners">\n${PARTNERS.map(partnerCard).join("\n")}\n        </div>`
    : `        <p class="lede">No partner is listed yet — every one is approved by hand, and none has been approved. Until then you can build it yourself today, or join the studio's waitlist.</p>
        <div class="bleed-actions quiet-actions">
          <a class="btn primary" href="https://loki.orangecat.ch/">Build it yourself ${ARROW}</a>
          <a class="btn secondary" href="${HIRE}#waitlist">Join the studio's waitlist</a>
        </div>`}
      </div>
    </section>

    <section class="section" id="how">
      <div class="wrap">
        <span class="kicker quiet">How partnering works</span>
        <h2 class="headline-caps section-title">Three steps.</h2>
        <ol class="steps">
${steps.map(([t, b], i) => `          <li><span class="path-n">0${i + 1}</span><span class="step-title">${esc(t)}</span><p>${esc(b)}</p></li>`).join("\n")}
        </ol>
        <p class="caption">Partners are independent. A customer contracts with the partner, not with bitbaum.</p>
      </div>
    </section>

    <section class="section ask-section" id="join">
      <div class="wrap ask">
        <div class="ask-copy">
          <span class="kicker quiet">Become a partner</span>
          <h2 class="headline-caps section-title">Show us what you build.</h2>
          <p class="lede">Tell the chat who you are, what you build and where your work lives. When you are ready, send it to the studio — one email field, no form.</p>
        </div>
        ${chatMount({ title: "", starters: ["I want to become a partner builder", "What do partners need to show?", "How do partners get paid?"] })}
      </div>
    </section>
  </main>`;
  return shell({
    title: "Partners — bitbaum",
    description: "Hire an approved partner builder who works with bitbaum's tools, or apply to become one.",
    path: "/partners/", body, nav: "/partners/", script: CHAT_SCRIPT,
  });
}


export function workPage(all, cfg) {
  const body = `  <main id="main">
    <section data-lodge class="stage stage-floored hero compact work-hero"><div class="wrap">
      <span class="eyebrow">The work</span>
      <h1 class="display-1">Everything built here, at its real stage.</h1>
      <p class="lede">Products and pilots in use, concepts built to show what is possible, and ideas named but not built — each labelled honestly. Filters live in the address bar, so a filtered view is a link you can send.</p>
    </div></section>
${workSection(all, cfg)}
  </main>`;
  return shell({
    title: "The work — bitbaum",
    description: "Browse Bitbaum projects by readiness stage and field, from running beta products to concepts and projects not yet built.",
    path: "/work/", body, nav: "/work/", script: FILTER_SCRIPT,
  });
}

/**
 * The part of a product page that makes it more than a screenshot: the
 * problem it exists for, what it does about it, where it is heading, what is
 * being built now — and, for the three flagships, everything they do. All of
 * it from the product's Loki profile or its editorial stack block, never typed
 * into this page; an empty field renders nothing rather than a placeholder.
 */
function ventureDepth(v) {
  const id = v.identity ?? {};
  const blocks = [
    ["The problem", id.problem],
    ["What it does", id.solution],
    ["Where it is heading", id.vision],
  ].filter(([, t]) => t && String(t).trim());
  const does = v.stack?.does ?? [];
  const roadmap = (v.roadmap ?? []).slice(0, 5);
  if (!blocks.length && !does.length && !roadmap.length) return "";
  return `    <section class="section venture-depth">
      <div class="wrap">
${blocks.length ? `        <div class="depth-blocks">
${blocks.map(([h, t]) => `          <div class="depth-block"><span class="label">${esc(h)}</span><p>${esc(t)}</p></div>`).join("\n")}
        </div>` : ""}
${does.length ? `        <div class="depth-does">
          <h2 class="display-3">${esc(v.stack.headline ?? `What ${v.name} does`)}</h2>
          <ul>
${does.map((d) => `            <li>${esc(d)}</li>`).join("\n")}
          </ul>
          ${v.stack.connects ? `<p class="depth-connects"><span class="label">In the stack</span> ${esc(v.stack.connects)}</p>` : ""}
        </div>` : ""}
${roadmap.length ? `        <div class="depth-roadmap">
          <span class="label">Being built now</span>
          <ul>
${roadmap.map((r) => {
    const pct = Number(r.progress);
    return `            <li><span>${esc(r.title)}</span>${Number.isFinite(pct) && pct > 0 ? `<span class="depth-progress" role="img" aria-label="${Math.round(pct)}% done"><span style="width:${Math.min(100, Math.round(pct))}%"></span></span>` : ""}</li>`;
  }).join("\n")}
          </ul>
        </div>` : ""}
      </div>
    </section>`;
}

/**
 * A venture's profiles on the other two pillars, as anchors.
 *
 * Named rather than inlined because the flagship list counts them and the venture
 * page renders them, and those two must not disagree about what "has a
 * profile" means.
 */
export function profileLinks(v) {
  const p = v.profiles ?? {};
  return [
    p.orangecat ? `<a href="${esc(p.orangecat)}">OrangeCat</a>` : null,
    p.solon ? `<a href="${esc(p.solon)}">Solon</a>` : null,
  ].filter(Boolean);
}

export function venturePage(v, all, cfg, contact) {
  const i = all.indexOf(v);
  const prev = all[(i - 1 + all.length) % all.length];
  const next = all[(i + 1) % all.length];
  const stage = cfg.stages?.[v.stage];
  const facts = [
    ["Stage", (stage?.title ?? v.stage) + (v.for ? `, for ${v.for}` : "")],
    ["Status", v.stage === "next" ? "Named, not built" : v.status === "live" ? "Beta — running, not released" : v.status === "demo" ? "Demo, mock data" : v.status === "validating" ? "Validating" : v.status || "—"],
    v.tags.length ? ["Field", v.tags.map((t) => `<a href="/work/#work?field=${esc(slugify(t))}">${esc(t)}</a>`).join(", ")] : null,
    v.since ? ["Since", monthYear(v.since)] : null,
    v.url ? ["Address", `<a href="${esc(v.url)}">${esc(host(v.url))}</a>`] : null,
    v.repo ? ["Source", `<a href="${esc(v.repo)}">${esc(v.repo.replace("https://github.com/", ""))}</a>`] : null,
    // Two of the three pillars, from the product's side: where it is funded and
    // found, and where its rules are decided. Absent ones are simply not listed
    // — a venture page is not the place to publish a gap; the register is
    // (fleet: scripts/ci/product-identity-audit.mjs).
    profileLinks(v).length ? ["Profiles", profileLinks(v).join(", ")] : null,
  ].filter(Boolean);
  // The other direction of "what uses these packages": from a product, to the
  // shared code it is made of.
  const built = v.uses.length
    ? `        <div class="uses"><span class="label">Built from</span><div class="chips">${v.uses.map((s) => `<a href="/packages/${esc(s)}/">${esc(s)}</a>`).join("")}</div></div>`
    : "";
  const body = `  <main id="main">
    <section data-lodge class="stage stage-floored venture-hero">
      <div class="wrap">
        <span class="eyebrow${v.status === "live" ? "" : " quiet"}">${esc(stage?.title ?? v.stage)}${v.pillar ? ` &middot; ${esc(v.pillar)}` : ""}${v.for ? ` &middot; for ${esc(v.for)}` : ""}</span>
        <h1 class="display-1">${esc(v.name)}</h1>
        <p class="lede">${esc(v.what)}</p>
        <div class="actions">
          ${v.url ? `<a class="btn primary" href="${esc(v.url)}">Open ${esc(host(v.url))} ${ARROW}</a>` : ""}
          ${v.repo ? `<a class="btn secondary" href="${esc(v.repo)}">Source</a>` : ""}
          ${contact ? `<a class="btn secondary" href="#ask">Ask about ${esc(v.name)}</a>` : ""}
        </div>
      </div>
    </section>
${v.shot ? `    <div class="wrap"><div class="venture-shot"><img src="/shots/${esc(v.slug)}.jpg" alt="${esc(v.name)} — screenshot of ${esc(host(v.url))}" width="1280" height="800"></div></div>` : ""}
    <section class="wrap venture-body">
      <div class="prose">
        ${v.story ? `<p>${esc(v.story)}</p>` : ""}
        ${stage ? `<p class="caption"><strong>${esc(stage.plural)}:</strong> ${esc(stage.lede)}</p>` : ""}
        ${v.shot ? `<p class="caption">The image is a screenshot of ${esc(host(v.url))}, taken by a machine when this site was built. If the product changed, so did the picture.</p>` : ""}
      </div>
      <div class="venture-facts">
${facts.map(([k, val]) => `        <div><span class="label">${esc(k)}</span><span>${val}</span></div>`).join("\n")}
${built}
      </div>
    </section>
${ventureDepth(v)}
${contact ? `    <section class="section" id="ask">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Ask about ${esc(v.name)}</h2>
          <p class="lede">Ask anything about ${esc(v.name)} — the Cat and Loki answer right away from the project catalogue. Want a person instead? Send them the conversation.</p>
        </div>
        ${chatMount({
          title: "",
          starters: [`What is ${v.name}?`, `Is ${v.name} ready to use?`, `How could ${v.name} work for my organisation?`],
        })}
      </div>
    </section>` : ""}
    <div class="wrap"><div class="pager"><a href="/${esc(prev.slug)}/">&larr; ${esc(prev.name)}</a><a href="/work/#work?stage=${encodeURIComponent(v.stage)}">All ${esc((stage?.plural ?? "").toLowerCase())}</a><a href="/${esc(next.slug)}/">${esc(next.name)} &rarr;</a></div></div>
  </main>`;
  return shell({ title: `${v.name} — ${v.what}`, description: v.story || v.what, path: `/${v.slug}/`, body, image: v.shot ? `/shots/${v.slug}.jpg` : undefined, script: contact ? CHAT_SCRIPT : undefined });
}

export function studioPage(all, packages, origin, readings) {
  const pkgCount = (packages.packages ?? []).length;
  const block = (origin?.repos ?? []).map((r) => r.provenSince?.block).filter(Boolean).sort((a, b) => a - b)[0];
  const reading = readings?.current;
  const body = `  <main id="main">
    <section data-lodge class="stage stage-floored hero compact">
      <div class="wrap">
        <span class="eyebrow">The studio</span>
        <h1 class="display-1">Bit, and Baum.</h1>
        <p class="lede">Bit for software. Baum, German for tree, for the shape: many branches from one trunk. The trunk is what lets a small group ship like a large one — and what lets the next person start in the middle rather than at the beginning.</p>
        <div class="actions">
          <a class="btn primary" href="/#join">Build with us ${ARROW}</a>
          <a class="btn secondary" href="/work/">See the work</a>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap"><div class="prose">
        <h2>What bitbaum is</h2>
        <p>Bitbaum is a product studio building AI-native software. OrangeCat, Loki and Solon are public beta products. Other projects are labelled on the <a href="/work/">work catalogue</a> by what can be verified: pilot, in development, concept, or not built.</p>
        <h2>Why the stack is what it is</h2>
        <p><a href="/orangecat/">OrangeCat</a> is the economic product, with payment links and Bitcoin settlement. <a href="/loki/">Loki</a> is the engineering control plane for dispatching work to agents, following sessions and reviewing changes. <a href="/solon/">Solon</a> is the governance product: proposals, one-click votes under rules a group chose, and a public record — in beta, with its governance agent being built alongside the first pilot groups.</p>
        <h2>How the work gets done</h2>
        <p>The studio publishes ${pkgCount} MIT-licensed packages for specific jobs: model routing, email, content, forms, rate limits, lists, threads and more. They are not all used by every product. Each <a href="/packages/">package profile</a> links to its source, current version and apps that list it as a dependency. Agents can do implementation work in Loki; people set the goals, review changes and remain responsible for what ships.</p>
        <h2>What is true</h2>
        <p>The project list and package adopters come from public registers; stage descriptions and short summaries are editorial and are kept here for review. The work catalogue distinguishes projects built for real organisations from demos and things that are not built.</p>
        <h2>Open by construction</h2>
        <p>The shared packages are MIT-licensed. Work built for someone else stays theirs. Contributor terms live in <a href="${CONTRIBUTING}">bitbaum/.github</a>. The <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">origin register</a> tracks <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">${origin?.repos?.length ?? 0} repositories</a>, of which <a href="https://archive.softwareheritage.org/">${origin?.repos?.filter((r) => r.swh?.snapshot).length ?? 0} have a Software Heritage snapshot</a>${block ? `; the <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">earliest recorded proof is anchored at Bitcoin block ${block}</a>` : ""}.</p>
        <h2>Numbers, in the open</h2>
        <p>Fleet's <a href="https://github.com/bitbaum/fleet/blob/main/registers/readings.json">${esc(reading?.date ?? "latest")} readings</a> report <a href="https://github.com/bitbaum">${Number(reading?.stars ?? 0)} GitHub stars</a> and <a href="https://www.npmjs.com/org/bitbaum">${Number(reading?.downloads?.lastMonth ?? 0).toLocaleString("en-US")} package downloads over 30 days</a> (including our own CI installs). The same dated register reports <a href="https://github.com/bitbaum/fleet/blob/main/registers/readings.json">CHF ${Number(reading?.clients?.mrrChf ?? 0).toLocaleString("en-US")} monthly client revenue</a>. These are readings, not forecasts; the source and date are linked.</p>
        <h2>Work with the studio</h2>
        <p>Fractional CTO and contract engineering, Zürich. Rates, scope and the waitlist are on the <a href="${HIRE}">hire page</a>. The code is on <a href="${GITHUB}">GitHub</a>.</p>
      </div></div>
    </section>
  </main>`;
  return shell({ title: "The studio — bitbaum", description: "What Bitbaum builds, how its projects differ in readiness, and where the public numbers come from.", path: "/studio/", body, nav: "/studio/" });
}

// ── hire ────────────────────────────────────────────────────────────────────
//
// The page the primary button on every other page points at, so it is the one
// page that must not read as a different company. It lived on GitHub Pages in
// its own design, under a personal name and a superseded GitHub handle, with
// no way to make contact — a prospect's only link was a profile page.
//
// Rates, method and answers are editorial (site/hire.json). The evidence is
// NOT: the live-work list is derived from the same register as the rest of the
// site, which is why the old hand-typed one could quote a host that had been
// retired for two days.
// Requests go to Loki's feedback inbox — the one inbound surface in the fleet
// that is cross-origin safe, rate-limited, deduped, notified AND triaged in a
// real UI (/feedback). The token is public ON PURPOSE (widget_tokens schema).
const REQUEST_ENDPOINT = "https://loki.orangecat.ch/api/feedback";

/** A field. `kind` is text | email | textarea | select. */
const field = (f) => {
  const id = `f-${f.form}-${f.name}`;
  const label = `<label for="${id}">${esc(f.label)}${f.required ? "" : ` <span class="opt">optional</span>`}</label>`;
  const req = f.required ? " required" : "";
  if (f.kind === "textarea")
    return `<p class="field wide">${label}<textarea id="${id}" name="${esc(f.name)}" rows="4" placeholder="${esc(f.placeholder ?? "")}"${req}></textarea></p>`;
  if (f.kind === "select")
    return `<p class="field">${label}<select id="${id}" name="${esc(f.name)}"${req}>${f.options
      .map((o) => `<option value="${esc(o)}">${esc(o)}</option>`)
      .join("")}</select></p>`;
  return `<p class="field"><label for="${id}">${esc(f.label)}${f.required ? "" : ` <span class="opt">optional</span>`}</label><input id="${id}" type="${f.kind}" name="${esc(f.name)}" autocomplete="${esc(f.autocomplete ?? "on")}" placeholder="${esc(f.placeholder ?? "")}"${req}></p>`;
};

/** The intake form. Every door on this site is one of these. */
function requestForm({ id, fields, cta, note }) {
  return `        <form class="signup js-request" id="form-${esc(id)}" data-form="${esc(id)}" data-endpoint="${esc(REQUEST_ENDPOINT)}" novalidate>
${fields.map((f) => `          ${field({ ...f, form: id })}`).join("\n")}
          <div class="hp" aria-hidden="true">
            <label>Website<input type="text" name="website" tabindex="-1" autocomplete="off"></label>
          </div>
          <p class="field wide submit"><button class="btn primary" type="submit">${esc(cta)} ${ARROW}</button></p>
        </form>
        <p class="form-status" role="status"></p>
${note ? `        <p class="caption">${note}</p>` : ""}`;
}

function requestScript() {
  return `  <script type="module" src="/request.mjs" data-endpoint="${esc(LOKI_FEEDBACK.origin)}/api/feedback" data-token="${esc(LOKI_FEEDBACK.token)}"><\/script>`;
}

const slug = (name) =>
  String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function hirePage(all, cfg, hire, packages, origin) {
  const running = all.filter((v) => v.status === "live" && v.stage !== "next");
  const proven = (origin?.repos ?? []).filter((r) => r.provenSince).length;
  const pkgCount = (packages.packages ?? []).length;
  const body = `  <main id="main">
${fullBleed({ scene: "rings", under: true, body: `        <div class="bleed-copy rise">
          <span class="kicker">${esc(hire.eyebrow)}</span>
          <h1 class="headline-caps long">${esc(hire.title)}</h1>
          <p class="bleed-lede">${esc(hire.lede)}</p>
          <p class="bleed-notice">${esc(hire.availability.line)}</p>
          <div class="bleed-actions">
            <a class="btn-frame-accent" href="#waitlist">${esc(hire.availability.cta)} ${ARROW}</a>
            <a class="btn-frame" href="#build-yourself">Build it yourself now</a>
          </div>
        </div>` })}

    <section class="section studio-facts">
      <div class="wrap">
        <div class="hero-facts">
          <a href="#shipped"><b>${running.length}</b> systems built and running</a>
          <a href="/packages/"><b>${pkgCount}</b> packages published open source</a>
          <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json"><b>${proven}</b> repositories with proven origin</a>
        </div>
        <p class="caption">Every number here is checkable: the systems are listed below with their addresses, the packages are on npm, and the origin proofs are <a href="https://github.com/bitbaum/fleet/blob/main/registers/origin.json">in a public register</a>.</p>
      </div>
    </section>

${buildYourselfBand(all, hire)}

    <section class="section" id="engagements">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Engagements and rates</h2>
          <p class="lede">Published rather than quoted on request, so you can qualify yourself before writing a single email. Fixed-scope work is confirmed in writing before it starts.</p>
        </div>
        <div class="grid">
${hire.offers.map((o) => `          <a class="card text" href="#waitlist" data-engagement="${esc(o.name)}">
            <div class="card-body">
              <div class="card-top"><span class="card-name">${esc(o.name)}</span><span class="pill">${esc(o.shape)}</span></div>
              <span class="price">${esc(o.price)}${o.unit ? `<span class="price-unit">${esc(o.unit)}</span>` : ""}</span>
              <span class="card-what">${esc(o.what)}</span>
              <div class="pkg-links"><span>Request this &rarr;</span></div>
            </div>
          </a>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="shipped">
      <div class="wrap">
        <div class="section-head">
          <div class="row"><h2 class="display-2">${running.length} systems running right now</h2><a class="textlink" href="/work/">Everything, filterable &rarr;</a></div>
          <p class="lede">Not screenshots from finished engagements — running services you can open in a new tab, on infrastructure that is public.</p>
        </div>
        <div class="grid four">
${running.map((v) => card(v)).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="how">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">How we work</h2>
          <p class="lede">Four commitments that hold whether the engagement is two weeks or two years.</p>
        </div>
        <div class="grid two">
${hire.method.map((m) => `          <div class="method">
              <span class="card-name">${esc(m.title)}</span>
              <span class="card-what">${esc(m.what)}</span>
          </div>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="questions">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">Questions people actually ask</h2>
        </div>
        <div class="qa">
${hire.faq.map((f) => `          <details>
            <summary>${esc(f.q)}</summary>
            <p>${esc(f.a)}</p>
          </details>`).join("\n")}
        </div>
      </div>
    </section>

    <section class="section" id="waitlist">
      <div class="wrap">
        <div class="section-head">
          <h2 class="display-2">${esc(hire.availability.cta)}</h2>
          <p class="lede">${esc(hire.waitlist.lede)}</p>
        </div>
        <div class="grid">
${hire.waitlist.promises.map((w) => `          <article class="card text">
            <div class="card-body">
              <span class="card-name">${esc(w.title)}</span>
              <span class="card-what">${esc(w.what)}</span>
            </div>
          </article>`).join("\n")}
        </div>
${requestForm({
  id: "waitlist",
  cta: hire.availability.cta,
  note: esc(hire.contact.line),
  fields: [
    { name: "name", label: "Your name", kind: "text", autocomplete: "name", required: true },
    { name: "email", label: "Email", kind: "email", autocomplete: "email", placeholder: "you@yourcompany.ch", required: true },
    { name: "org", label: "Company or organisation", kind: "text", autocomplete: "organization" },
    { name: "engagement", label: "Which engagement", kind: "select", options: ["Not sure yet", ...hire.offers.map((o) => o.name)] },
    { name: "timeline", label: "When you need it", kind: "select", options: ["Not urgent", "This quarter", "Next quarter", "As soon as there is capacity"] },
    { name: "what", label: "What you are building, and what is in the way", kind: "textarea", placeholder: "A sentence or two is plenty.", required: true },
  ],
})}
      </div>
    </section>
  </main>`;
  return shell({
    title: "Hire the studio — bitbaum",
    description: `${hire.eyebrow}. ${hire.lede}`,
    path: "/hire/", body, nav: "/hire/", script: requestScript(),
  });
}

// ── build ───────────────────────────────────────────────────────────────────
export function render({ map, packages, origin, readings, cfg, hire }) {
  const all = ventures(map, cfg, origin, packages);
  const files = new Map();
  files.set("index.html", homePage(all, packages, cfg, origin, readings, hire));
  files.set("work/index.html", workPage(all, cfg));
  files.set("partners/index.html", partnersPage());
  files.set("packages/index.html", packagesPage(packages, cfg, all));
  files.set("packages-filter.mjs", readFileSync(join(here, "packages-filter.mjs"), "utf8"));
  files.set("work-filter.mjs", readFileSync(join(here, "work-filter.mjs"), "utf8"));
  // The chat island: chatkit + React bundled once for every page that mounts it.
  const bundle = buildSync({
    entryPoints: [join(here, "chat", "chat.tsx")],
    bundle: true,
    minify: true,
    format: "esm",
    jsx: "automatic",
    target: "es2020",
    define: { "process.env.NODE_ENV": '"production"' },
    write: false,
    logLevel: "warning",
  });
  files.set("chat.js", bundle.outputFiles[0].text);
  files.set("chatkit.css", readFileSync(join(here, "..", "node_modules", "@bitbaum", "chatkit", "styles.css"), "utf8"));
  const listkitDist = join(here, "..", "node_modules", "listkit", "dist");
  if (!existsSync(join(listkitDist, "index.js"))) throw new Error("missing listkit browser modules — run: pnpm install");
  files.set("vendor/listkit/LICENSE", readFileSync(join(here, "..", "node_modules", "listkit", "LICENSE"), "utf8"));
  for (const name of readdirSync(listkitDist).filter((name) => name.endsWith(".js"))) {
    files.set(`vendor/listkit/${name}`, readFileSync(join(listkitDist, name), "utf8"));
  }
  const shown = shownPackages(packages, cfg);
  for (const p of shown) files.set(`packages/${p.slug}/index.html`, packagePage(p, cfg, all, shown));
  files.set("studio/index.html", studioPage(all, packages, origin, readings));
  files.set("hire/index.html", hirePage(all, cfg, hire, packages, origin));
  for (const v of all) files.set(`${v.slug}/index.html`, venturePage(v, all, cfg, hire?.contact?.email));
  files.set("map.json", JSON.stringify(publicMap(map), null, 2) + "\n");
  // Every page the build writes is in the sitemap, because the sitemap is
  // derived from the same map of files — a page cannot exist and be missing.
  const pages = [...files.keys()].filter((f) => f.endsWith("index.html")).map((f) => `${SITE}/${f.replace(/index\.html$/, "")}`).sort();
  files.set("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}\n</urlset>\n`);
  files.set("robots.txt", `User-agent: *\nAllow: /\nDisallow: /map.json\n\nSitemap: ${SITE}/sitemap.xml\n`);
  files.set("theme.mjs", readFileSync(join(here, "theme.mjs"), "utf8"));
  files.set("request.mjs", readFileSync(join(here, "request.mjs"), "utf8"));
  files.set("nav.mjs", readFileSync(join(here, "nav.mjs"), "utf8"));
  files.set("scenes.mjs", readFileSync(join(here, "scenes.mjs"), "utf8"));
  files.set("sky.mjs", readFileSync(join(here, "sky.mjs"), "utf8"));
  files.set("lodge.mjs", readFileSync(join(here, "lodge.mjs"), "utf8"));
  files.set("creatures.mjs", readFileSync(join(here, "creatures.mjs"), "utf8"));
  return { all, files };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  if (args.has("--check")) args.add("--offline");
  const map = await fetchOrSnapshot(SOURCES.map);
  const packages = await fetchOrSnapshot(SOURCES.packages);
  const origin = await fetchOrSnapshot(SOURCES.origin);
  const readings = await fetchOrSnapshot(SOURCES.readings);
  const cfg = JSON.parse(readFileSync(join(here, "overrides.json"), "utf8"));
  const hire = JSON.parse(readFileSync(join(here, "hire.json"), "utf8"));
  const { all, files } = render({ map, packages, origin, readings, cfg, hire });
  const pageCount = [...files.keys()].filter((file) => file.endsWith("index.html")).length;

  // A shot the page references must exist: a broken image on a product page
  // is worse than no product page.
  for (const v of all) {
    if (v.shot && !existsSync(join(DIST, "shots", `${v.slug}.jpg`))) {
      console.error(`missing shot for ${v.slug} — run: node site/shots.mjs ${v.slug}`);
      process.exit(1);
    }
  }
  // The share card every non-venture page points at must exist, for the same
  // reason a screenshot must: a broken image is worse than none.
  if (!existsSync(join(DIST, "og", "studio.png"))) {
    console.error("missing share card dist/og/studio.png — run: node site/og.mjs");
    process.exit(1);
  }
  // A tag no chip offers is a card nobody can filter to.
  const known = new Set(cfg.tagOrder ?? []);
  for (const v of all) {
    for (const t of v.tags) {
      if (!known.has(t)) { console.error(`${v.slug}: tag "${t}" is not in tagOrder`); process.exit(1); }
    }
  }

  if (args.has("--check")) {
    let stale = 0;
    for (const [rel, html] of files) {
      const p = join(DIST, rel);
      if (!existsSync(p) || readFileSync(p, "utf8") !== html) { console.error(`stale: dist/${rel}`); stale++; }
    }
    if (readFileSync(join(here, "styles.css"), "utf8") !== (existsSync(join(DIST, "styles.css")) ? readFileSync(join(DIST, "styles.css"), "utf8") : "")) { console.error("stale: dist/styles.css"); stale++; }
    {
      const src = join(here, "..", "node_modules", "@bitbaum", "design-tokens", "tokens.css");
      const want = existsSync(src) ? readFileSync(src, "utf8").replace(/url\(\.\/fonts\//g, "url(/fonts/") : "";
      const have = existsSync(join(DIST, "tokens.css")) ? readFileSync(join(DIST, "tokens.css"), "utf8") : "";
      if (want !== have) { console.error("stale: dist/tokens.css — the design tokens moved"); stale++; }
    }
    if (stale) { console.error(`site/dist is behind the sources — run: node site/build.mjs`); process.exit(1); }
    console.log(`site/dist is in sync (${pageCount} pages, ${files.size} generated files)`);
  } else {
    for (const [rel, html] of files) {
      mkdirSync(dirname(join(DIST, rel)), { recursive: true });
      writeFileSync(join(DIST, rel), html);
    }
    // Pages for ventures that no longer exist must not linger.
    for (const d of readdirSync(DIST, { withFileTypes: true })) {
      if (d.isDirectory() && !["shots", "fonts", "packages", "work", "studio", "hire", "og", "vendor", "partners", "art"].includes(d.name) && !all.some((v) => v.slug === d.name)) rmSync(join(DIST, d.name), { recursive: true });
    }
    cpSync(join(here, "styles.css"), join(DIST, "styles.css"));
    // Same rule, fewer generations — a favicon that cannot drift from the logo.
    writeFileSync(join(DIST, "logo-mark.svg"), MARK_FAVICON() + "\n");
    cpSync(join(here, "fonts"), join(DIST, "fonts"), { recursive: true });
    cpSync(join(here, "art"), join(DIST, "art"), { recursive: true, filter: (f) => !f.endsWith(".json") });
    // @bitbaum/design-tokens — the same SSOT OrangeCat, Loki and Solon consume.
    const tokensDir = join(here, "..", "node_modules", "@bitbaum", "design-tokens");
    if (!existsSync(join(tokensDir, "tokens.css"))) {
      console.error("missing @bitbaum/design-tokens — run: pnpm install");
      process.exit(1);
    }
    // The package's tokens.css asks for ./fonts/*; dist serves it from the root,
    // so the URLs are rewritten once here rather than duplicating the faces.
    writeFileSync(
      join(DIST, "tokens.css"),
      readFileSync(join(tokensDir, "tokens.css"), "utf8").replace(/url\(\.\/fonts\//g, "url(/fonts/"),
    );
    cpSync(join(tokensDir, "fonts"), join(DIST, "fonts"), { recursive: true });
    console.log(`wrote site/dist: ${pageCount} pages (${all.length} ventures, ${(packages.packages ?? []).length} packages), map ${map.generatedAt ?? "snapshot"}`);
    const orphans = all.filter((v) => v.uses.length === 0 && v.stage !== "next" && v.stage !== "concept").map((v) => v.slug);
    if (orphans.length) console.log(`  no shared packages recorded for: ${orphans.join(", ")}`);
  }
}
