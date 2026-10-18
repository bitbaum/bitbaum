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
  // A venture the site does not show (client work Loki withholds) is left
  // out of its loop instead of failing the build and freezing the old pages.
  assert.deepEqual(
    loopMap(all, cfg([["a", "b", "ghost"]]))[0].loops[0].ventures.map((v) => v.slug),
    ["a", "b"],
  );
});

test("a venture typed 'not built' whose address answers is never shown as not built", async () => {
  const { shownStage, isRunning, probeAll } = await import("./live.mjs");
  const map = {
    projects: [
      { slug: "up", urls: { live: "https://up.example" } },
      { slug: "down", urls: { live: "https://down.example" } },
      { slug: "beta", urls: { live: "https://beta.example" } },
    ],
  };
  const cfg = {
    stages: { product: {}, development: {}, next: {} },
    overrides: {
      up: { what: "Up", stage: "next" },
      down: { what: "Down", stage: "next" },
      beta: { what: "Beta", stage: "product" },
    },
  };
  const fetcher = async (url) => ({ status: url.includes("down") ? 503 : 200 });
  const live = await probeAll(map.projects.map((p) => p.urls.live), fetcher);
  assert.deepEqual(live["https://up.example"], { status: 200, running: true });
  assert.deepEqual(live["https://down.example"], { status: 503, running: false });

  const shown = Object.fromEntries(ventures(map, cfg, { repos: [] }, { packages: [] }, live).map((v) => [v.slug, v]));
  assert.equal(shown.up.stage, "development", "an answering address lifts 'not built' to in development");
  assert.equal(shown.up.stageTyped, "next", "the typed stage is kept, so the build can name the stale line");
  assert.equal(shown.down.stage, "next", "a site that does not answer keeps its typed stage");
  assert.equal(shown.beta.stage, "product", "a stage is only raised, never lowered");

  const unprobed = ventures(map, cfg, { repos: [] }, { packages: [] });
  assert.equal(unprobed.find((v) => v.slug === "up").stage, "next", "no probe data, no change");

  assert.equal(shownStage("product", false), "product");
  assert.ok(isRunning(200) && isRunning(307) && isRunning(401) && isRunning(403));
  assert.ok(!isRunning(0) && !isRunning(404) && !isRunning(502) && !isRunning(503));
});
