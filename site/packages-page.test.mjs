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
  assert.match(html, /Registry npm version 1\.11\.0">npm&nbsp;v1\.11\.0/);
  assert.match(html, /class="pill" aria-label="0 repos declare this package">0 repos/);
  assert.doesNotMatch(html, /Explore paykit/);
  assert.doesNotMatch(html, /Developer profile/);
  assert.doesNotMatch(html, /pkg-cover/);
  // The hero states what the packages are, not how many: a bare count is a
  // number with nothing to read it against.
  assert.match(html, /<span class="eyebrow">Open source &middot; MIT<\/span>/);
  assert.match(html, /id="package-search"/);
  assert.match(html, /data-adoption="new"/);
  assert.match(html, /data-adoption="adopted"/);
  assert.match(html, /src="\/packages-filter\.mjs"/);
});

test("package detail links to docs and copies install", () => {
  const html = packagePage(packages[1], config, [], packages);
  assert.match(html, /Registry release/);
  assert.match(html, /v0\.1\.0/);
  assert.match(html, /README &amp; API/);
  assert.match(html, /https:\/\/github\.com\/bitbaum\/paykit#readme/);
  assert.match(html, /activeTab=versions/);
  assert.match(html, /0 repositories currently list this package as a dependency/);
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

test("package reference renders pinned docs and real changes without claiming deployed adoption", () => {
  const commit = "a".repeat(40);
  const records = {
    commit, committedAt: "2026-10-26T12:00:00Z",
    readme: "# PayKit\n\n## API\n\n[API](docs/api.md) and [unsafe](javascript:alert(1))\n\n```js\nclassify(input)\n```",
    changelog: "# Changelog\n\n## 2026-10-26\n\n- Fixed a real parser defect.",
    releases: [{ name: "v0.1.0", publishedAt: "2026-10-25", body: "Published the parser.", url: "https://github.com/bitbaum/paykit/releases/tag/v0.1.0" }],
  };
  const html = packagePage(packages[1], config, [], packages, records);
  assert.match(html, /API and examples/);
  assert.match(html, /Fixed a real parser defect/);
  assert.match(html, /Published the parser/);
  assert.match(html, new RegExp(`github.com/bitbaum/paykit/blob/${commit}/docs/api.md`));
  assert.doesNotMatch(html, /href="javascript:/);
  assert.match(html, /declaration alone does not verify/);
  assert.match(html, /source commit/);
});

test("Git-distributed packages lead to their own documentation", () => {
  const pkg = { ...packages[1], install: { source: "git", command: "pnpm add github:bitbaum/paykit#abc" } };
  const html = packagePage(pkg, config, [], [pkg]);
  assert.match(html, /class="btn primary" href="https:\/\/github.com\/bitbaum\/paykit#readme">Read documentation/);
  assert.doesNotMatch(html, /See it in OrangeCat/);
});

test("known package consumers link to their reference without exposing unlisted projects", () => {
  const pkg = { ...packages[1], adopters: 2, adopterNames: ["accountkit", "unlisted-sensitive-project"] };
  const html = packagePage(pkg, config, [], [pkg, { slug: "accountkit" }]);
  assert.match(html, /href="\/packages\/accountkit\/"/);
  assert.match(html, /1 other repository/);
  assert.doesNotMatch(html, /unlisted-sensitive-project/);
});
