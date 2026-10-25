import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { compareVersions, parseVersion, type Version } from "./commits";
import { History } from "./history";

const raw = JSON.parse(readFileSync(new URL("./history.json", import.meta.url), "utf8"));

describe("the release history", () => {
  const releases = History.parse(raw);
  const versions = releases.map((release) => parseVersion(release.version) as Version);

  it("is valid against the schema the import endpoint uses", () => {
    assert.ok(releases.length > 0);
  });

  it("gives every version once, rising with its date", () => {
    assert.equal(new Set(releases.map((release) => release.version)).size, releases.length);
    for (let i = 1; i < releases.length; i++) {
      assert.ok(compareVersions(versions[i], versions[i - 1]) > 0, `${releases[i].version} follows ${releases[i - 1].version}`);
      assert.ok(Date.parse(releases[i].released_at) >= Date.parse(releases[i - 1].released_at), `${releases[i].version} is not dated before its predecessor`);
    }
  });

  /*
   * The eras the majors stand for: the scaffold, the Django site with its
   * content in code, the same site on a database, and the Next.js rebuild.
   * Each starts at .0.0 and the last Django release is a 2.x.
   */
  it("starts each era at its major", () => {
    const first = (major: number) => releases[versions.findIndex(([m]) => m === major)]?.version;
    assert.equal(releases[0].version, "0.1.0");
    assert.equal(first(1), "1.0.0");
    assert.equal(first(2), "2.0.0");
    assert.equal(first(3), "3.0.0");
    assert.equal(releases.at(-1)?.version, "3.0.0");
    assert.equal(versions.at(-2)?.[0], 2);
  });

  it("chains each window to the one before it", () => {
    assert.equal(releases[0].previous_sha, "");
    for (let i = 1; i < releases.length; i++) assert.equal(releases[i].previous_sha, releases[i - 1].commit_sha);
  });

  it("says how many commits each release covers", () => {
    for (const release of releases) assert.match(release.summary, /\d+ commits\.$/, release.version);
  });

  it("stops short of the automatic releases, which the workflow records itself", () => {
    assert.ok(versions.every(([major]) => major < 4));
  });
});
