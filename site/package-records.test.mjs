import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectPackageRecords, loadPackageRecords } from "./package-records.mjs";

const sha = "a".repeat(40);
const packages = { packages: [{ slug: "kit", repo: "https://github.com/bitbaum/kit" }] };
function source(requests, changelogStatus = 404) {
  return async (url) => {
    requests.push(url);
    if (url === "https://api.github.com/repos/bitbaum/kit") return Response.json({ private: false, visibility: "public" });
    if (url.endsWith("/commits/HEAD")) return Response.json({ sha, commit: { committer: { date: "2026-10-26T12:00:00Z" } } });
    if (url.endsWith("/README.md")) return new Response("# Kit\n\n## Usage\n\nUse the kit.");
    if (url.endsWith("/CHANGELOG.md")) return new Response("missing", { status: changelogStatus });
    if (url.includes("/commits?")) return Response.json([{ sha, commit: { committer: { date: "2026-10-26" }, message: "Verified source change" } }]);
    if (url.includes("/releases?")) return Response.json([{ name: "v1.0.0", tag_name: "v1.0.0", published_at: "2026-10-25", body: "Real change", html_url: "https://github.com/bitbaum/kit/releases/tag/v1.0.0" }]);
    throw new Error(`Unexpected source: ${url}`);
  };
}

test("package records pin every documentation file to one exact commit", async () => {
  const requests = [];
  const result = await collectPackageRecords(packages, source(requests));
  assert.equal(result.entries.kit.commit, sha);
  assert.equal(result.entries.kit.changelog, null);
  assert.equal(result.entries.kit.releases[0].body, "Real change");
  for (const url of requests.filter((url) => url.includes("raw.githubusercontent"))) assert.ok(url.includes(`/${sha}/`));
});

test("a failed changelog fetch is not reported as no changelog", async () => {
  await assert.rejects(collectPackageRecords(packages, source([], 503)), /503/);
});

test("documentation only comes from registered public Bitbaum repositories", async () => {
  for (const repo of ["https://attacker.example/kit", "https://github.com/other/kit", "https://github.com/bitbaum/kit/../../private"]) {
    await assert.rejects(collectPackageRecords({ packages: [{ slug: "kit", repo }] }, () => { throw new Error("must not fetch"); }), /Untrusted/);
  }
});

test("publishing fails closed on a source failure and preserves its snapshot", async () => {
  const dir = mkdtempSync(join(tmpdir(), "package-records-"));
  try {
    const snapshot = join(dir, "records.json");
    const original = JSON.stringify(await collectPackageRecords(packages, source([])));
    writeFileSync(snapshot, original);
    await assert.rejects(loadPackageRecords(packages, { snapshot, requireFresh: true, fetcher: async () => { throw new Error("offline"); } }), /offline/);
    assert.equal(readFileSync(snapshot, "utf8"), original);
    const cached = await loadPackageRecords(packages, { snapshot, offline: true });
    assert.equal(cached.entries.kit.commit, sha);
    await assert.rejects(loadPackageRecords({ packages: [{ slug: "other", repo: "https://github.com/bitbaum/other" }] }, { snapshot, offline: true }), /Missing or mismatched/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("private package documentation is refused before fetching any content", async () => {
  const requests = [];
  await assert.rejects(collectPackageRecords(packages, async (url) => {
    requests.push(url);
    return Response.json({ private: true, visibility: "private" });
  }), /Refusing non-public/);
  assert.equal(requests.length, 1);
});
