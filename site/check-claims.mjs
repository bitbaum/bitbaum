// Do the site's factual claims still match reality?
//
//   node site/check-claims.mjs                      (checks the built dist/)
//   node site/check-claims.mjs https://bitbaum.orangecat.ch
//
// This exists because a claim that was true when it was written went false
// quietly: the site said "MIT, everywhere" while OrangeCat and Loki carried a
// PROPRIETARY licence granting no rights at all — two of the three products it
// invites people to take or join. Nobody lied; the world moved and the prose
// did not. Prose cannot be trusted to notice, so this asks the sources.
//
// Needs `gh` and network. It is a truth gate, not a unit test: run it before
// publishing, and whenever the claims change.
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2];

let fail = 0;
const say = (ok, m) => {
  if (!ok) fail++;
  console.log((ok ? "PASS " : "FAIL ") + m);
};

const gh = (args) => execFileSync("gh", args, { encoding: "utf8", maxBuffer: 8 << 20 });

/** The pages, either from the build output or from the live site. */
async function pageText(path) {
  if (base) {
    const res = await fetch(base + path);
    return res.text();
  }
  const file = join(here, "dist", path === "/" ? "index.html" : path.replace(/^\/|\/$/g, "") + "/index.html");
  return existsSync(file) ? readFileSync(file, "utf8") : "";
}

const home = await pageText("/");
const studio = await pageText("/studio/");
const all = home + studio;
if (!all.trim()) {
  console.error("no pages to check — build first, or pass a base URL");
  process.exit(2);
}

// ── 1. Licences: ask the repos ──────────────────────────────────────────────
const repos = JSON.parse(gh(["repo", "list", "bitbaum", "--limit", "80", "--json", "name,isArchived"]))
  .filter((r) => !r.isArchived)
  .map((r) => r.name);

const licenceOf = (name) => {
  try {
    return JSON.parse(gh(["api", `repos/bitbaum/${name}/license`, "--jq", "{spdx: .license.spdx_id}"])).spdx ?? "NONE";
  } catch {
    return "NONE"; // no licence file at all
  }
};

const licences = Object.fromEntries(repos.map((r) => [r, licenceOf(r)]));
const notMit = Object.entries(licences).filter(([, l]) => l !== "MIT");
const mitCount = repos.length - notMit.length;
console.log(`   (${mitCount} of ${repos.length} repos MIT; not MIT: ${notMit.map(([n]) => n).join(", ") || "none"})`);

// The absolute claim is the dangerous one — it is only sayable if it is true.
const absolute = /MIT,? (everywhere|throughout)|every product and package[^.]*is MIT/i;
const absoluteClaim = absolute.test(all.replace(/<[^>]+>/g, " "));
say(
  !absoluteClaim || notMit.length === 0,
  absoluteClaim
    ? `the site claims MIT everywhere while ${notMit.length} repo(s) are not MIT`
    : "the site makes no blanket MIT claim it cannot keep",
);

// What it DOES claim — that the shared packages are MIT — must hold.
const packages = JSON.parse(readFileSync(join(here, "packages.snapshot.json"), "utf8")).packages ?? [];
const pkgRepos = packages.map((p) => String(p.repo ?? "").split("/").pop()).filter(Boolean);
const pkgNotMit = pkgRepos.filter((r) => licences[r] && licences[r] !== "MIT");
say(pkgNotMit.length === 0, `every shared package is MIT (${pkgRepos.length} checked${pkgNotMit.length ? ": " + pkgNotMit.join(", ") : ""})`);

// If a product is not openly licensed, the page must say so by name.
for (const [name] of notMit.filter(([n]) => ["loki", "orangecat"].includes(n))) {
  const mentioned = new RegExp(`${name}[^<]{0,120}(not openly licensed|public to read|grants no rights)`, "i").test(
    all.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "),
  );
  say(mentioned, `${name} is not MIT, and the site says so rather than implying otherwise`);
}

// ── 2. Origin: the block on the page must be the block in the register ──────
const originSnap = JSON.parse(readFileSync(join(here, "origin.snapshot.json"), "utf8"));
const blocks = (originSnap.repos ?? []).map((r) => r.provenSince?.block).filter(Boolean);
const earliest = Math.min(...blocks);
const shown = all.match(/block (\d{6,})/);
say(!shown || Number(shown[1]) === earliest, `the block on the page is the register's earliest (${shown?.[1] ?? "not shown"} vs ${earliest})`);
say((originSnap.repos ?? []).every((r) => r.provenSince), `every repo in the origin register is stamped (${blocks.length})`);

// ── 3. Money: nothing may be claimed as paid while the ledger is empty ──────
const readings = existsSync(join(here, "readings.snapshot.json"))
  ? JSON.parse(readFileSync(join(here, "readings.snapshot.json"), "utf8"))
  : null;
const paid = readings?.current?.originatorShare?.paid;
if (paid === undefined) {
  console.log("   (no readings snapshot beside the site — skipping the payout claim)");
} else {
  const text = all.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const claimsPaid = /(has been|have been) paid (back )?to originators/i.test(text) && !/nothing has been paid/i.test(text);
  say(paid > 0 || !claimsPaid, `nothing is described as paid to originators while the ledger is empty (paid=${paid})`);
}

console.log(fail ? `\n${fail} FAILED — a claim on the site is not true` : "\nevery checked claim matches its source");
process.exit(fail ? 1 : 0);
