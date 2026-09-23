import assert from "node:assert/strict";
import test from "node:test";
import { createPackagePages } from "./packages-page.mjs";

const { packagesPage, packagePage } = createPackagePages({
  esc: (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;"),
  shell: ({ body }) => body,
});
const packages = [
  { slug: "ai-kit", name: "@bitbaum/ai-kit", version: "1.11.0", install: { source: "npm", command: "pnpm add @bitbaum/ai-kit" }, adopters: 14, adopterNames: ["bitbaum"], repo: "https://github.com/bitbaum/ai-kit" },
  { slug: "paykit", name: "@bitbaum/paykit", version: "0.1.0", install: { source: "npm", command: "pnpm add @bitbaum/paykit" }, adopters: 0, adopterNames: [], repo: "https://github.com/bitbaum/paykit" },
];
const config = {
  packages_lede: "Shared packages, with release versions.",
  packageGroups: [{ id: "think", title: "Think", lede: "Tools for model work." }, { id: "value", title: "Get paid" }],
  packages: { "ai-kit": { group: "think", what: "Model routing." }, paykit: { group: "value", what: "Payments without custody.", why: "A site should not need a wallet.", how: "Classify the receive string.", fits: "Used by payment surfaces." } },
};

test("package cards show published npm versions and adopter counts", () => {
  const html = packagesPage({ packages }, config, []);
  assert.match(html, /Latest npm version 1\.11\.0">npm&nbsp;v1\.11\.0/);
  assert.match(html, /Latest npm version 0\.1\.0">npm&nbsp;v0\.1\.0/);
  assert.match(html, /class="pill">0 apps<\/span>/);
  assert.match(html, /Explore paykit/);
  assert.match(html, /Developer profile/);
  assert.match(html, /id="package-search"/);
  assert.match(html, /id="package-group"/);
  assert.match(html, /id="package-adoption"/);
  assert.match(html, /id="package-sort"/);
  assert.match(html, /data-description="Tools for model work\."/);
  assert.match(html, /data-adoption="new"/);
  assert.match(html, /data-adoption="adopted"/);
  assert.match(html, /src="\/packages-filter\.mjs"/);
  assert.match(html, /<a href="\/">bitbaum<\/a>/);
});

test("package detail links to canonical docs and version history and tells the truth about adoption", () => {
  const html = packagePage(packages[1], config, [], packages);
  assert.match(html, /Latest npm version/);
  assert.match(html, /v0\.1\.0/);
  assert.match(html, /README &amp; API/);
  assert.match(html, /https:\/\/github\.com\/bitbaum\/paykit#readme/);
  assert.match(html, /activeTab=versions/);
  assert.match(html, /0 apps currently list this package as a dependency/);
});
