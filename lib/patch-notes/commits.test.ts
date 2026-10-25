import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  defaultTitle,
  formatVersion,
  groupByKind,
  latestVersion,
  nextVersion,
  parseCommit,
  releaseMarkdown,
  type Entry,
  type Version,
} from "./commits";

const FIRST: Version = [4, 0, 0];
const entry = (kind: Entry["kind"], body = "x"): Entry => ({ kind, scope: "", body, sha: "" });

describe("parseCommit", () => {
  it("reads the repository's emoji form, scope and all", () => {
    assert.deepEqual(parseCommit("✨feat(admin): Add a backup screen\n\nBody.", "abc"), {
      kind: "feature",
      scope: "admin",
      body: "Add a backup screen",
      sha: "abc",
    });
  });

  it("files every type in CONTRIBUTING.md, emoji with a variation selector included", () => {
    assert.equal(parseCommit("♻️refactor(cv): Split the loader")?.kind, "refactor");
    assert.equal(parseCommit("⚡perf: Cache the feed")?.kind, "performance");
    assert.equal(parseCommit("🔒security(deps): Upgrade next")?.kind, "security");
    assert.equal(parseCommit("👷ci: Add a workflow")?.kind, "chore");
    assert.equal(parseCommit("🔥chore(blog): Remove an endpoint")?.kind, "chore");
    assert.equal(parseCommit("📝docs(rls): Record a trigger")?.kind, "docs");
  });

  it("takes a commit with no emoji too", () => {
    assert.equal(parseCommit("fix: Keep the strip six columns")?.kind, "fix");
  });

  it("marks a breaking change by the bang or by the footer", () => {
    assert.equal(parseCommit("✨feat(ui)!: A new site")?.kind, "breaking");
    assert.equal(parseCommit("✨feat(ui): A new site\n\nBREAKING CHANGE: every URL moved")?.kind, "breaking");
  });

  it("keeps a subject that follows no convention, as written", () => {
    assert.deepEqual(parseCommit("Update README.md"), { kind: "other", scope: "", body: "Update README.md", sha: "" });
  });

  it("leaves out merges and anything asking to be skipped", () => {
    assert.equal(parseCommit("Merge pull request #12 from x/y"), null);
    assert.equal(parseCommit("Merge branch 'main' into feature/x"), null);
    assert.equal(parseCommit("🔧chore: Bump a pin [skip release]"), null);
  });
});

describe("versions", () => {
  it("compares numerically, not as text", () => {
    assert.deepEqual(latestVersion(["4.9.0", "4.10.0", "not-a-version", "4.2.7"]), [4, 10, 0]);
    assert.equal(latestVersion([]), null);
  });

  it("bumps by the most significant change in the push", () => {
    assert.equal(formatVersion(nextVersion([4, 1, 3], [entry("fix"), entry("docs")], FIRST)), "4.1.4");
    assert.equal(formatVersion(nextVersion([4, 1, 3], [entry("fix"), entry("feature")], FIRST)), "4.2.0");
    assert.equal(formatVersion(nextVersion([4, 1, 3], [entry("feature"), entry("breaking")], FIRST)), "5.0.0");
  });

  it("starts at the first version when nothing came before", () => {
    assert.equal(formatVersion(nextVersion(null, [entry("fix")], FIRST)), "4.0.0");
  });
});

describe("a release's text", () => {
  it("titles itself from its most important line", () => {
    assert.equal(defaultTitle([entry("fix", "keep it"), entry("feature", "add patch notes")]), "Add patch notes, and 1 more");
    assert.equal(defaultTitle([entry("fix", "keep it")]), "Keep it");
    assert.equal(defaultTitle([]), "Maintenance");
  });

  it("groups in the fixed order and drops empty kinds", () => {
    const groups = groupByKind([entry("chore"), entry("feature"), entry("fix"), entry("feature")]);
    assert.deepEqual(groups.map(([kind, list]) => [kind, list.length]), [["feature", 2], ["fix", 1], ["chore", 1]]);
  });

  it("writes the summary, then a section per kind with scope and short hash", () => {
    const md = releaseMarkdown({
      summary: "A new site.",
      entries: [{ kind: "feature", scope: "admin", body: "Add backups", sha: "0123456789abcdef" }],
    });
    assert.equal(md, "A new site.\n\n## New\n\n- **admin**: Add backups (0123456)");
  });
});
