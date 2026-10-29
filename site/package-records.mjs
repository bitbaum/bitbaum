import { existsSync, readFileSync, writeFileSync } from "node:fs";

/** Public, source-pinned package documentation; network failures are not missing files. */
export async function collectPackageRecords(packages, fetcher = fetch) {
  const entries = {};
  async function read(url, optional = false, json = false) {
    const headers = { Accept: "application/vnd.github+json" };
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    if (token && new URL(url).hostname === "api.github.com") headers.Authorization = `Bearer ${token}`;
    const response = await fetcher(url, { signal: AbortSignal.timeout(15000), headers });
    if (optional && response.status === 404) return null;
    if (!response.ok) throw new Error(`Package documentation source returned ${response.status}: ${url}`);
    return json ? response.json() : response.text();
  }
  // Bound public API traffic and memory. Every file for a package uses one commit.
  for (const pkg of packages.packages ?? []) {
    if (!/^https:\/\/github\.com\/bitbaum\/[a-z0-9-]+$/i.test(pkg.repo ?? "")) throw new Error(`Untrusted package repository: ${pkg.slug}`);
    const repo = pkg.repo.replace("https://github.com/", "");
    const info = await read(`https://api.github.com/repos/${repo}`, false, true);
    if (info.private !== false || (info.visibility && info.visibility !== "public")) throw new Error(`Refusing non-public package documentation: ${pkg.slug}`);
    const head = await read(`https://api.github.com/repos/${repo}/commits/HEAD`, false, true);
    if (!/^[a-f0-9]{40}$/.test(head.sha ?? "")) throw new Error(`Missing documentation source commit: ${pkg.slug}`);
    const raw = `https://raw.githubusercontent.com/${repo}/${head.sha}`;
    const [readme, changelog, releases, commits] = await Promise.all([
      read(`${raw}/README.md`, true),
      read(`${raw}/CHANGELOG.md`, true),
      read(`https://api.github.com/repos/${repo}/releases?per_page=5`, false, true),
      read(`https://api.github.com/repos/${repo}/commits?sha=${head.sha}&per_page=8`, false, true),
    ]);
    if (!Array.isArray(commits)) throw new Error(`Invalid source history: ${pkg.slug}`);
    if (!Array.isArray(releases)) throw new Error(`Invalid release history: ${pkg.slug}`);
    entries[pkg.slug] = {
      repo: pkg.repo,
      commit: head.sha,
      committedAt: head.commit?.committer?.date ?? null,
      readme,
      changelog,
      commits: commits.map((entry) => ({ sha: entry.sha, date: entry.commit?.committer?.date ?? null, subject: entry.commit?.message?.split("\n")[0] ?? "Source change", url: `${pkg.repo}/commit/${entry.sha}` })),
      releases: releases.filter((release) => !release.draft).map((release) => ({
        name: release.name || release.tag_name,
        tag: release.tag_name,
        publishedAt: release.published_at,
        prerelease: Boolean(release.prerelease),
        body: release.body || "",
        url: release.html_url,
      })),
    };
  }
  return { formatVersion: 1, entries };
}

export async function loadPackageRecords(packages, { snapshot, offline = false, requireFresh = false, fetcher = fetch }) {
  if (!offline) {
    try {
      const records = await collectPackageRecords(packages, fetcher);
      writeFileSync(snapshot, JSON.stringify(records, null, 2) + "\n");
      return records;
    } catch (error) {
      if (requireFresh) throw error;
      console.error(`Package documentation unavailable; local snapshot only: ${error.message}`);
    }
  }
  if (!existsSync(snapshot)) throw new Error("No package documentation snapshot; run an online build first");
  const records = JSON.parse(readFileSync(snapshot, "utf8"));
  for (const pkg of packages.packages ?? []) {
    const record = records.entries?.[pkg.slug];
    if (!record || record.repo !== pkg.repo || !/^[a-f0-9]{40}$/.test(record.commit ?? "")) throw new Error(`Missing or mismatched documentation snapshot: ${pkg.slug}`);
  }
  return records;
}
