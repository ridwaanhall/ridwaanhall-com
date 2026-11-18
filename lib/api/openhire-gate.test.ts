import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { openhireEnabled } from "./openhire-gate";

describe("openhireEnabled", () => {
  it("answers only when the matching flag is on", () => {
    assert.equal(openhireEnabled({ is_hiring: true, is_open_to_work: false }, "is_hiring"), true);
    assert.equal(openhireEnabled({ is_hiring: true, is_open_to_work: false }, "is_open_to_work"), false);
    assert.equal(openhireEnabled({ is_hiring: false, is_open_to_work: false }, "is_hiring"), false);
  });

  it("treats a missing profile as off", () => {
    assert.equal(openhireEnabled(null, "is_hiring"), false);
    assert.equal(openhireEnabled(undefined, "is_open_to_work"), false);
  });
});
