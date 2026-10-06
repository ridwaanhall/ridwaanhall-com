import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { PROJECT_STATUS_COLOR_TOKENS } from "@/lib/data/project-status";

import { STATUS_DOT, statusDot } from "./status-colors";

describe("STATUS_DOT", () => {
  it("covers exactly the tokens a status row may carry", () => {
    assert.deepEqual(Object.keys(STATUS_DOT).sort(), [...PROJECT_STATUS_COLOR_TOKENS].sort());
  });

  it("falls back to the neutral dot for a token it does not know", () => {
    assert.equal(statusDot("chartreuse"), STATUS_DOT.zinc);
    assert.equal(statusDot(null), STATUS_DOT.zinc);
  });
});
