import test from "node:test";
import assert from "node:assert/strict";
import { ventures } from "./build.mjs";

test("project ordering follows the configured readiness-stage order", () => {
  const result = ventures(
    { projects: [{ slug: "alpha" }, { slug: "beta" }] },
    {
      stages: { beta: {}, alpha: {} },
      overrides: {
        alpha: { what: "Alpha", stage: "alpha" },
        beta: { what: "Beta", stage: "beta" },
      },
    },
    { repos: [] },
    { packages: [] },
  );

  assert.deepEqual(result.map((project) => project.slug), ["beta", "alpha"]);
});

test("the map places every shown venture in exactly one loop", async () => {
  const { loopMap } = await import("./loops.mjs");
  const all = [{ slug: "a" }, { slug: "b" }];
  const cfg = (ventures) => ({ loops: { layers: [{ id: "x", loops: ventures.map((v, i) => ({ title: `L${i}`, ventures: v })) }] } });

  const layers = loopMap(all, cfg([["a"], ["b"], []]));
  assert.deepEqual(layers[0].loops.map((l) => l.ventures.map((v) => v.slug)), [["a"], ["b"], []]);

  assert.throws(() => loopMap(all, cfg([["a"]])), /no loop for b/);
  assert.throws(() => loopMap(all, cfg([["a", "b"], ["b"]])), /"b" is in both/);
  assert.throws(() => loopMap(all, cfg([["a", "b", "ghost"]])), /does not show/);
});

test("client work is shown only with consent, and never beside the studio's own", async () => {
  const cfg = {
    overrides: {
      ours: { what: "Ours", stage: "product" },
      agreed: { what: "Agreed", stage: "pilot", client: true },
      unasked: { what: "Unasked", stage: "pilot", client: true },
      legacy: { what: "Legacy", stage: "pilot" },
    },
    extras: [{ slug: "extra", what: "Extra", stage: "pilot", client: true }],
  };
  const map = {
    projects: [
      { slug: "ours", client: null },
      { slug: "agreed", client: { consentedAt: "2026-10-01T00:00:00.000Z" } },
      // Loki leaves this off its map; a stale snapshot might not.
      { slug: "unasked", client: { consentedAt: null } },
      // A snapshot from before the field: judged by its layer.
      { slug: "legacy", layer: "client" },
    ],
  };
  const shown = ventures(map, cfg, { repos: [] }, { packages: [] });
  assert.deepEqual(
    shown.map((v) => [v.slug, v.client]).sort(),
    [["agreed", true], ["ours", false]],
  );

  const { publicMap } = await import("./public-map.mjs");
  const pub = publicMap({ ...map, summary: { projects: 4, clients: 3 } });
  assert.deepEqual(pub.projects.map((p) => p.slug), ["ours", "agreed"]);
  assert.deepEqual(pub.summary, { projects: 2, clients: 1 });

  const { loopMap } = await import("./loops.mjs");
  assert.throws(
    () => loopMap(shown, { loops: { layers: [{ id: "x", loops: [{ title: "L", ventures: ["ours", "agreed"] }] }] } }),
    /client work/,
  );
});

test("the committed overrides and snapshot resolve: no loop cites hidden client work", async () => {
  const { readFileSync } = await import("node:fs");
  const read = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url), "utf8"));
  const shown = ventures(read("./map.snapshot.json"), read("./overrides.json"), read("./origin.snapshot.json"), read("./packages.snapshot.json"));
  const { loopMap } = await import("./loops.mjs");
  assert.doesNotThrow(() => loopMap(shown.filter((v) => !v.client), read("./overrides.json")));
});
