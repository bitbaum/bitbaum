// Read-only production readiness gate. Never creates a synthetic studio brief.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const { origin } = JSON.parse(readFileSync(new URL("./loki-feedback.json", import.meta.url), "utf8"));
const studioOrigin = "https://bitbaum.orangecat.ch";
async function request(path, init = {}) { return fetch(origin + path, { redirect: "manual", signal: AbortSignal.timeout(10_000), ...init }); }
const directory = await request("/api/studio-partners", { headers: { Origin: studioOrigin } });
assert.equal(directory.status, 200, "Deploy the Loki studio API before publishing these views");
assert.equal(directory.headers.get("access-control-allow-origin"), studioOrigin);
const data = await directory.json(); assert.equal(data.ok, true); assert.ok(Array.isArray(data.partners));
for (const p of data.partners) {
  assert.ok(["available", "limited"].includes(p.availability));
  assert.ok(Object.keys(p).every((k) => ["id", "name", "headline", "url", "rate", "availability"].includes(k)));
}
const preflight = await request("/api/studio-intake", { method: "OPTIONS", headers: { Origin: studioOrigin, "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "Content-Type" } });
assert.equal(preflight.status, 204); assert.equal(preflight.headers.get("access-control-allow-origin"), studioOrigin);
const foreign = await request("/api/studio-intake", { method: "OPTIONS", headers: { Origin: "https://unrelated.ch" } });
assert.equal(foreign.status, 403); assert.equal(foreign.headers.get("access-control-allow-origin"), null);
const opaque = await request("/api/studio-portal/00000000-0000-4000-8000-000000000000", { headers: { Origin: studioOrigin, Authorization: `Bearer spt_${"A".repeat(43)}` } });
assert.equal(opaque.status, 404, "Unknown request must stay opaque; a 500 signals a missing migration or route failure");
assert.match(opaque.headers.get("cache-control"), /no-store/);
assert.equal(opaque.headers.get("access-control-allow-origin"), studioOrigin);
console.log("PASS deployed studio API: public directory, exact-origin CORS, guest route and database access without creating a brief");
