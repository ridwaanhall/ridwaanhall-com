import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { imageSourceFor, type ImageSourceInput } from "./image-source";

/** The resting state of every save: nothing chosen, nothing typed, nothing ticked. */
const base: ImageSourceInput = {
  label: "Logo",
  hasFile: false,
  link: "",
  cleared: false,
  existing: "",
};

const decide = (over: Partial<ImageSourceInput>) => imageSourceFor({ ...base, ...over });

describe("imageSourceFor", () => {
  it("uploads when a file was chosen", () => {
    assert.deepEqual(decide({ hasFile: true }), { kind: "upload" });
  });

  it("fetches when a link was pasted", () => {
    assert.deepEqual(decide({ link: "https://example.com/a.png" }), {
      kind: "link",
      link: "https://example.com/a.png",
    });
  });

  it("empties the column when the clear box was ticked", () => {
    assert.deepEqual(decide({ cleared: true, existing: "logo/a.webp" }), { kind: "clear" });
  });

  /*
   * The case the whole module is written around. An empty file input is what a
   * form looks like when the image was left alone, so reading it as "make it
   * empty" blanks the image on every save of any other field on the record.
   */
  it("leaves an untouched field alone, whether or not it holds an image", () => {
    assert.deepEqual(decide({}), { kind: "untouched" });
    assert.deepEqual(decide({ existing: "logo/a.webp" }), { kind: "untouched" });
  });

  /*
   * Only reachable before the bundle arrives: the hydrated control disables
   * whichever input it is not showing, because `hidden` still submits.
   */
  it("refuses a file and a link together rather than picking one", () => {
    const result = decide({ hasFile: true, link: "https://example.com/a.png" });
    assert.equal(result.kind, "error");
    assert.ok(result.kind === "error" && result.error.includes("Logo"));
  });

  it("names the field in every message it returns", () => {
    const result = imageSourceFor({ ...base, label: "Photo", required: true });
    assert.ok(result.kind === "error" && result.error.startsWith("Photo"));
  });

  /* A replacement, not a contradiction -- and the old key goes stale either way. */
  it("lets a new image win over the clear box", () => {
    assert.deepEqual(decide({ hasFile: true, cleared: true, existing: "logo/a.webp" }), {
      kind: "upload",
    });
    assert.deepEqual(decide({ link: "https://example.com/a.png", cleared: true, existing: "logo/a.webp" }), {
      kind: "link",
      link: "https://example.com/a.png",
    });
  });

  describe("a required field", () => {
    it("is satisfied by a file, by a link, or by what it already holds", () => {
      assert.equal(decide({ required: true, hasFile: true }).kind, "upload");
      assert.equal(decide({ required: true, link: "https://example.com/a.png" }).kind, "link");
      assert.equal(decide({ required: true, existing: "blog/a.webp" }).kind, "untouched");
    });

    it("refuses to be cleared", () => {
      const result = decide({ required: true, cleared: true, existing: "blog/a.webp" });
      assert.equal(result.kind, "error");
    });

    it("is a problem when nothing supplies it", () => {
      assert.equal(decide({ required: true }).kind, "error");
    });
  });
});
