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
