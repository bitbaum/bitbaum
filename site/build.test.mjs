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
