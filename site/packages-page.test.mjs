import assert from "node:assert/strict";
import test from "node:test";
import { createPackagePages, uniqueAdopterCount, fillEditorial } from "./packages-page.mjs";
import { publicMap } from "./public-map.mjs";

const { packagesPage, packagePage } = createPackagePages({
  esc: (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"),
  shell: ({ body }) => body,
});
const packages = [
  { slug: "ai-kit", name: "@bitbaum/ai-kit", version: "1.11.0", install: { source: "npm", command: "pnpm add @bitbaum/ai-kit" }, adopters: 14, adopterNames: ["bitbaum", "kivvi"], repo: "https://github.com/bitbaum/ai-kit" },
  { slug: "paykit", name: "@bitbaum/paykit", version: "0.1.0", install: { source: "npm", command: "pnpm add @bitbaum/paykit" }, adopters: 0, adopterNames: [], repo: "https://github.com/bitbaum/paykit" },
];
const config = {
  packages_lede: "Shared packages, with release versions.",
  packageGroups: [{ id: "think", title: "Think", lede: "Tools for model work." }, { id: "value", title: "Get paid" }],
  packages: {
    "ai-kit": { group: "think", what: "Model routing.", why: "{{adopters_word}} apps needed a model." },
    paykit: { group: "value", what: "Payments without custody.", why: "A site should not need a wallet.", how: "Classify the receive string.", fits: "Used by payment surfaces." },
  },
};

test("package cards are whole-card links with data-adopters", () => {
  const html = packagesPage({ packages }, config, []);
  assert.match(html, /href="\/packages\/ai-kit\/"/);
  assert.match(html, /data-adopters="14"/);
  assert.match(html, /Latest npm version 1\.11\.0">npm&nbsp;v1\.11\.0/);
  assert.match(html, /class="pill" aria-label="0 apps use this package">0 apps/);
  assert.doesNotMatch(html, /Explore paykit/);
  assert.doesNotMatch(html, /Developer profile/);
  assert.doesNotMatch(html, /pkg-cover/);
  assert.match(html, /2 distinct adopters in the fleet/);
  assert.match(html, /id="package-search"/);
  assert.match(html, /data-adoption="new"/);
  assert.match(html, /data-adoption="adopted"/);
  assert.match(html, /src="\/packages-filter\.mjs"/);
});

test("package detail links to docs and copies install", () => {
  const html = packagePage(packages[1], config, [], packages);
  assert.match(html, /Latest version/);
  assert.match(html, /v0\.1\.0/);
  assert.match(html, /README &amp; API/);
  assert.match(html, /https:\/\/github\.com\/bitbaum\/paykit#readme/);
  assert.match(html, /activeTab=versions/);
  assert.match(html, /0 apps currently list this package as a dependency/);
  assert.match(html, /js-copy/);
});

test("editorial placeholders expand from adopter counts", () => {
  assert.equal(fillEditorial("{{adopters_word}} apps", 14), "Fourteen apps");
  assert.equal(uniqueAdopterCount(packages), 2);
});

test("publicMap strips changelog and rewrites solo-founder mission", () => {
  const out = publicMap({
    generatedAt: "t",
    thesis: "x",
    pillars: [],
    summary: { projects: 1 },
    projects: [
      {
        slug: "bitbaum",
        name: "bitbaum",
        what: "studio",
        stack: "static",
        status: "live",
        owner: "bitbaum",
        urls: {},
        identity: { mission: "Bitbaum is a solo-founder AI product studio: x" },
        changelog: [{ date: "2026-01-01", done: "OPENAI_API_KEY in /opt/x" }],
        next: "secret",
        now: { openRuns: 1 },
      },
    ],
  });
  assert.equal(out.projects[0].changelog, undefined);
  assert.equal(out.projects[0].next, undefined);
  assert.equal(out.projects[0].now, undefined);
  assert.match(out.projects[0].identity.mission, /more than one person/);
  assert.doesNotMatch(out.projects[0].identity.mission, /solo-founder/);
});
