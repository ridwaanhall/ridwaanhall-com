import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveCategoryParam } from "./category-param";

const options = [
  { slug: "web-app", label: "Web App" },
  { slug: "data", label: "Data" },
];

test("a slug stays a slug", () => assert.equal(resolveCategoryParam("web-app", options), "web-app"));
test("an old label link maps to its slug, any case", () => {
  assert.equal(resolveCategoryParam("Web App", options), "web-app");
  assert.equal(resolveCategoryParam("web app", options), "web-app");
});
test("a slug wins over a label that spells the same", () =>
  assert.equal(resolveCategoryParam("data", [{ slug: "data", label: "Other" }, { slug: "x", label: "data" }]), "data"));
test("unknown and empty values pass through", () => {
  assert.equal(resolveCategoryParam("nope", options), "nope");
  assert.equal(resolveCategoryParam("", options), "");
});
