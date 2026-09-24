// Do the site's factual claims still match reality?
//
//   node site/check-claims.mjs                      (checks the built dist/)
//   node site/check-claims.mjs https://bitbaum.orangecat.ch
//
// Needs `gh` and network. It is a truth gate, not a unit test: run it before
// publishing, and whenever the claims change.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { uniqueAdopterCount } from "./packages-page.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2];

let fail = 0;
const say = (ok, m) => {
  if (!ok) fail++;
  console.log((ok ? "PASS " : "FAIL ") + m);
};

const gh = (args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 8 << 20 });

async function pageText(path) {
  if (base) {
    const res = await fetch(base + path);
    return res.text();
  }
  const file = join(here, "dist", path === "/" ? "index.html" : path.replace(/^\/|\/$/g, "") + "/index.html");
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

const home = await pageText("/");
const work = await pageText("/work/");
const studio = await pageText("/studio/");
const packagesHtml = await pageText("/packages/");
const all = home + work + studio + packagesHtml;
if (!all.trim()) {
  console.error("no pages to check — build first, or pass a base URL");
  process.exit(2);
}

/** Client-owned repos: owner ≠ bitbaum and kind starts with client- in apps.conf. */
function clientReposFromAppsConf() {
  const roots = [process.env.DEV_ROOT, join(homedir(), "dev")].filter(Boolean);
  const paths = roots.flatMap((r) => [
    join(r, "fleetcrown/scripts/hetzner/apps.conf"),
    join(r, "loki/scripts/hetzner/apps.conf"),
  ]);
  const file = paths.find((p) => existsSync(p));
  if (!file) return null;
  const out = new Set();
  for (const line of readFileSync(file, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const cols = line.split("|");
    if (cols.length < 8) continue;
    const [name, , , repoPath, , , owner, kind] = cols;
    if (!kind?.startsWith("client")) continue;
    // Client-shaped rows are never the studio's to license, even when owner is still "-".
    out.add(name);
    const dir = String(repoPath ?? "").split("/").pop();
    if (dir && dir !== ".") out.add(dir);
  }
  return out;
}

const CLIENT_REPOS = clientReposFromAppsConf() ?? new Set([
  "aoz-begleitung",
  "reparaturbonus-zh",
  "s-ink",
  "vitareba",
  "printcraft",
  "annushka",
]);
if (clientReposFromAppsConf()) console.log(`   (client repos from apps.conf: ${[...CLIENT_REPOS].sort().join(", ")})`);

const listed = JSON.parse(
  gh(["repo", "list", "bitbaum", "--limit", "80", "--json", "name,isArchived,isFork,visibility"]),
).filter((r) => !r.isArchived);

const repos = listed
  .filter((r) => !r.isFork && r.visibility === "PUBLIC" && !CLIENT_REPOS.has(r.name))
  .map((r) => r.name);
const exempt = listed.filter((r) => !repos.includes(r.name)).map((r) => r.name);
if (exempt.length) console.log(`   (not the studio's to license, skipped: ${exempt.join(", ")})`);

const licenceOf = (name) => {
  try {
    return JSON.parse(gh(["api", `repos/bitbaum/${name}/license`, "--jq", "{spdx: .license.spdx_id}"])).spdx ?? "NONE";
  } catch {
    return "NONE";
  }
};

const licences = Object.fromEntries(repos.map((r) => [r, licenceOf(r)]));
const notMit = Object.entries(licences).filter(([, l]) => l !== "MIT");
const mitCount = repos.length - notMit.length;
console.log(`   (${mitCount} of ${repos.length} published repos MIT; not MIT: ${notMit.map(([n]) => n).join(", ") || "none"})`);

const absolute = /MIT,? (everywhere|throughout)|every product and package[^.]*is MIT/i;
const absoluteClaim = absolute.test(all.replace(/<[^>]+>/g, " "));
say(
  !absoluteClaim || notMit.length === 0,
  absoluteClaim && notMit.length
    ? `the site claims MIT everywhere while ${notMit.length} repo(s) are not: ${notMit.map(([n]) => n).join(", ")}`
    : absoluteClaim
      ? `the blanket MIT claim holds — all ${repos.length} published repos are MIT`
      : "the site makes no blanket MIT claim it cannot keep",
);

const packages = JSON.parse(readFileSync(join(here, "packages.snapshot.json"), "utf8")).packages ?? [];
const editorial = JSON.parse(readFileSync(join(here, "overrides.json"), "utf8"));
const featured = editorial.home?.featuredPackages ?? [];
const featuredRendered = [...home.matchAll(/data-package="([a-z0-9-]+)"/g)].map((m) => m[1]);
say(
  featured.length > 0 && new Set(featured).size === featured.length && featured.every((slug) => packages.some((p) => p.slug === slug)) &&
    JSON.stringify(featuredRendered) === JSON.stringify(featured),
  `homepage shows exactly its configured distinct featured packages (${featured.join(", ")})`,
);
say(!home.includes('id="work-grid"') && work.includes('id="work-grid"'), "full work catalogue is on /work/, not duplicated on the homepage");
say(home.includes("/widget.js") && work.includes("/widget.js") && studio.includes("/widget.js"), "Loki feedback widget is included by the shared page chrome");
const widget = JSON.parse(readFileSync(join(here, "loki-feedback.json"), "utf8"));
say(home.includes(`${widget.origin}/widget.js`) && home.includes(`data-fc-project="${widget.token}"`), "homepage widget points at the configured Loki project");
const plainAll = all.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
say(!/\b(?:10%|10 percent|a tenth)\b[^.]{0,180}(?:revenue|originator|product)/i.test(plainAll), "no unsupported revenue-share promise is published");
const workPlain = work.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
say(/Solon/.test(workPlain) && /in development/.test(workPlain) && /Causius/.test(workPlain) && /Skif/.test(workPlain), "development and not-built projects are present in the staged catalogue");
say(!/Built from \d+ shared packages|every product is built from/i.test(home), "homepage does not imply every product uses every package");
const pkgRepos = packages.map((p) => String(p.repo ?? "").split("/").pop()).filter(Boolean);
const pkgNotMit = pkgRepos.filter((r) => licences[r] && licences[r] !== "MIT");
say(pkgNotMit.length === 0, `every shared package is MIT (${pkgRepos.length} checked${pkgNotMit.length ? ": " + pkgNotMit.join(", ") : ""})`);

for (const [name] of notMit.filter(([n]) => ["loki", "orangecat"].includes(n))) {
  const mentioned = new RegExp(`${name}[^<]{0,120}(not openly licensed|public to read|grants no rights)`, "i").test(
    all.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "),
  );
  say(mentioned, `${name} is not MIT, and the site says so rather than implying otherwise`);
}

const originSnap = JSON.parse(readFileSync(join(here, "origin.snapshot.json"), "utf8"));
const blocks = (originSnap.repos ?? []).map((r) => r.provenSince?.block).filter(Boolean);
const earliest = Math.min(...blocks);
const swhCount = (originSnap.repos ?? []).filter((r) => r.swh?.snapshot).length;
const shown = all.match(/block (\d{6,})/);
say(!shown || Number(shown[1]) === earliest, `the block on the page is the register's earliest (${shown?.[1] ?? "not shown"} vs ${earliest})`);
say((originSnap.repos ?? []).every((r) => r.provenSince), `every repo in the origin register is stamped (${blocks.length})`);
say(
  studio.includes(`${originSnap.repos.length} repositories`) && studio.includes(`${swhCount} have a Software Heritage snapshot`),
  `origin copy matches the register (${originSnap.repos.length} tracked, ${swhCount} archived in Software Heritage)`,
);

const readings = existsSync(join(here, "readings.snapshot.json"))
  ? JSON.parse(readFileSync(join(here, "readings.snapshot.json"), "utf8"))
  : null;
const paid = readings?.current?.originatorShare?.paid;
if (paid === undefined) {
  say(false, "readings snapshot exists for the numbers shown on the homepage");
} else {
  const text = all.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const claimsPaid = /(has been|have been) paid (back )?to originators/i.test(text) && !/nothing has been paid/i.test(text);
  say(paid > 0 || !claimsPaid, `nothing is described as paid to originators while the ledger is empty (paid=${paid})`);
  const current = readings.current;
  say(
      studio.includes(`${current.date} readings`) && studio.includes(`${current.downloads.lastMonth.toLocaleString("en-US")} package downloads`) &&
      studio.includes(`CHF ${Number(current.clients?.mrrChf ?? 0).toLocaleString("en-US")} monthly client revenue`) &&
      studio.includes("including our own CI installs"),
    `studio readings match Fleet's dated register (${current.date}) and disclose CI downloads`,
  );
}

const plain = all.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
say(!/Nothing on this site is typed by hand/i.test(plain), "studio does not claim nothing is typed by hand");
say(!/\b0\b[^.]*manual steps between merge and deploy/i.test(plain), "hire does not claim 0 manual deploy steps");
say(!/\bsolo-founder\b/i.test(plain), "pages do not use solo-founder framing");

const unique = uniqueAdopterCount(packages);
const eyebrow = packagesHtml.match(/(\d+) distinct adopters in the fleet/);
say(
  eyebrow && Number(eyebrow[1]) === unique,
  `packages eyebrow unique adopters match the registry (${eyebrow?.[1] ?? "missing"} vs ${unique})`,
);
say(!/uses across the fleet/i.test(packagesHtml), "packages page does not sum dependency edges as 'uses'");
say(!/\{\{adopters(_word)?\}\}/.test(all), "no unexpanded {{adopters}} placeholders remain");

const mapPath = base ? null : join(here, "dist", "map.json");
if (mapPath && existsSync(mapPath)) {
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  const sample = map.projects?.[0] ?? {};
  say(!("changelog" in sample) && !("next" in sample) && !("now" in sample), "published map.json has no changelog/next/now");
  const bitbaum = (map.projects ?? []).find((p) => p.slug === "bitbaum");
  say(!bitbaum || !/solo-founder/i.test(bitbaum.identity?.mission ?? ""), "published map.json rewrites bitbaum solo-founder mission");
}

console.log(fail ? `\n${fail} FAILED — a claim on the site is not true` : "\nevery checked claim matches its source");
process.exit(fail ? 1 : 0);
