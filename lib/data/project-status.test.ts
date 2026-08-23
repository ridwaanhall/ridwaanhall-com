import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  PROJECT_STATUS,
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_DISPLAY,
  projectStatusColor,
  projectStatusDisplay,
  projectStatusLabel,
  projectStatusRank,
} from "./project-status";

const ALL = Object.values(PROJECT_STATUS);

describe("the vocabulary", () => {
  it("gives every status a display label and a colour", () => {
    for (const status of ALL) {
      assert.ok(PROJECT_STATUS_DISPLAY[status], `no label for ${status}`);
      assert.ok(PROJECT_STATUS_COLORS[status], `no colour for ${status}`);
    }
  });

  it("names no status the vocabulary does not have", () => {
    for (const key of [...Object.keys(PROJECT_STATUS_DISPLAY), ...Object.keys(PROJECT_STATUS_COLORS)]) {
      assert.ok(ALL.includes(key as never), `${key} is not a status`);
    }
  });
});

describe("projectStatusRank", () => {
  it("ranks a known status by its place in the lifecycle", () => {
    assert.notEqual(projectStatusRank(PROJECT_STATUS.COMPLETED), projectStatusRank(PROJECT_STATUS.DESIGN));
  });

  it("is case-insensitive, since the value comes from a column", () => {
    assert.equal(projectStatusRank("COMPLETED"), projectStatusRank("completed"));
  });

  /*
   * An unknown status sorts after every known one rather than before them --
   * a new value added in the admin appears at the end of the list, not the top.
   */
  it("sorts an unknown or absent status after every known one", () => {
    const known = ALL.map((status) => projectStatusRank(status));
    const unknown = projectStatusRank("something-new");
    for (const rank of known) assert.ok(unknown > rank, `${unknown} should exceed ${rank}`);
    assert.equal(projectStatusRank(null), unknown);
    assert.equal(projectStatusRank(undefined), unknown);
  });
});

describe("projectStatusLabel", () => {
  it("title-cases the raw value for the admin", () => {
    assert.equal(projectStatusLabel("development_in_progress"), "Development In Progress");
    assert.equal(projectStatusLabel("on_hold"), "On Hold");
    assert.equal(projectStatusLabel("design"), "Design");
  });
});

describe("projectStatusDisplay", () => {
  /*
   * Deliberately shorter than `projectStatusLabel`: the badge is editorial
   * wording on the public site, the label is the raw value tidied for the admin.
   */
  it("uses the badge's editorial wording, not the admin's", () => {
    assert.equal(projectStatusDisplay("development_in_progress"), "In Development");
    assert.notEqual(projectStatusDisplay("development_in_progress"), projectStatusLabel("development_in_progress"));
  });

  it("is case-insensitive", () => {
    assert.equal(projectStatusDisplay("COMPLETED"), "Completed");
  });

  it("title-cases an unknown status rather than rendering nothing", () => {
    assert.equal(projectStatusDisplay("awaiting_budget"), "Awaiting Budget");
  });

  it("renders nothing for an absent status", () => {
    assert.equal(projectStatusDisplay(null), "");
    assert.equal(projectStatusDisplay(undefined), "");
    assert.equal(projectStatusDisplay(""), "");
  });
});

describe("projectStatusColor", () => {
  it("gives a known status its own colour", () => {
    assert.equal(projectStatusColor(PROJECT_STATUS.COMPLETED), PROJECT_STATUS_COLORS[PROJECT_STATUS.COMPLETED]);
  });

  it("is case-insensitive", () => {
    assert.equal(projectStatusColor("COMPLETED"), projectStatusColor("completed"));
  });

  /*
   * Always a class string, never undefined: an unstyled badge on the public
   * site is the failure this guards against.
   */
  it("falls back to a neutral treatment for an unknown or absent status", () => {
    const fallback = projectStatusColor(null);
    assert.ok(fallback.length > 0);
    assert.equal(projectStatusColor("awaiting_budget"), fallback);
    assert.equal(projectStatusColor(undefined), fallback);
    assert.equal(projectStatusColor(""), fallback);
  });
});
