import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cn } from "./cn";

describe("cn", () => {
  it("joins the classes it is given", () => {
    assert.equal(cn("a", "b"), "a b");
  });

  it("drops the falsy branches a conditional produces", () => {
    assert.equal(cn("a", false && "b", null, undefined, "c"), "a c");
  });

  /*
   * The merge is the point: without it, a component's default and a caller's
   * override both land in the class list and which one wins is whichever
   * Tailwind emitted last -- a source-order coincidence, not a decision.
   */
  it("lets a later utility win over an earlier one in the same group", () => {
    assert.equal(cn("p-2", "p-4"), "p-4");
    assert.equal(cn("text-sm", "text-lg"), "text-lg");
  });

  it("leaves utilities from different groups alone", () => {
    const out = cn("p-2", "text-sm");
    assert.ok(out.includes("p-2"));
    assert.ok(out.includes("text-sm"));
  });

  it("returns an empty string when given nothing", () => {
    assert.equal(cn(), "");
    assert.equal(cn(undefined, null, false), "");
  });
});
