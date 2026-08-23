import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { uniqueUsername, usernameCandidates } from "./username";

const free = async () => false;
const taken = (...names: string[]) => async (name: string) => names.includes(name);

describe("usernameCandidates", () => {
  /*
   * A provider handle is something a person chose; a name-derived one is prose
   * turned into an identifier. That is why only the first keeps its case.
   */
  it("takes the provider's handle verbatim, capitals and all", () => {
    assert.equal(usernameCandidates({ handle: "Harindrawahyu" })[0], "Harindrawahyu");
  });

  it("slugifies a name-derived candidate to lower case", () => {
    assert.deepEqual(usernameCandidates({ name: "Dian Pratiwi" }), ["dian", "user"]);
  });

  it("prefers the handle, then the first name, then the email's local part", () => {
    assert.deepEqual(
      usernameCandidates({ handle: "octocat", name: "Dian Pratiwi", email: "dian.p@example.com" }),
      ["octocat", "dian", "dian.p", "user"],
    );
  });

  it("takes only the first word of a name", () => {
    assert.equal(usernameCandidates({ name: "  Ridwan   Halim  " })[0], "ridwan");
  });

  it("drops characters a username may not carry, keeping @.+-_", () => {
    assert.equal(usernameCandidates({ handle: "a!b#c$d" })[0], "abcd");
    assert.equal(usernameCandidates({ email: "first.last+tag@example.com" })[0], "first.last+tag");
  });

  it("turns internal whitespace into a hyphen rather than dropping it", () => {
    assert.equal(usernameCandidates({ handle: "two words" })[0], "two-words");
  });

  it("skips an empty candidate rather than offering a blank", () => {
    assert.deepEqual(usernameCandidates({ handle: "", name: "", email: "" }), ["user"]);
    assert.deepEqual(usernameCandidates({}), ["user"]);
  });

  it("always ends with a candidate, so a name can be derived from nothing at all", () => {
    assert.equal(usernameCandidates({ handle: "!!!", name: "???" }).at(-1), "user");
  });

  it("caps a candidate at the column's limit", () => {
    const long = "a".repeat(400);
    for (const candidate of usernameCandidates({ handle: long })) {
      assert.ok(candidate.length <= 150, `${candidate.length} characters`);
    }
  });
});

describe("uniqueUsername", () => {
  it("takes the first candidate when it is free", async () => {
    assert.equal(await uniqueUsername(["dian", "user"], free), "dian");
  });

  it("suffixes from two, since the unsuffixed name is the first attempt", async () => {
    assert.equal(await uniqueUsername(["dian"], taken("dian")), "dian2");
    assert.equal(await uniqueUsername(["dian"], taken("dian", "dian2")), "dian3");
  });

  /*
   * The rule that is easy to get wrong: later candidates are fallbacks for an
   * *empty* earlier one, never for a taken one. Falling through would name
   * somebody after their first name when their chosen handle was unavailable --
   * a different identity from the one they picked.
   */
  it("suffixes the first candidate rather than falling through to the next", async () => {
    const result = await uniqueUsername(["octocat", "dian"], taken("octocat"));
    assert.equal(result, "octocat2");
    assert.notEqual(result, "dian");
  });

  it("keeps the suffixed name inside the column's limit", async () => {
    const base = "a".repeat(150);
    const result = await uniqueUsername([base], taken(base));
    assert.ok(result.length <= 150, `${result.length} characters`);
    assert.ok(result.endsWith("2"));
  });

  it("falls back to a name when handed no candidates at all", async () => {
    assert.equal(await uniqueUsername([], free), "user");
  });

  /*
   * Bounded rather than `while (true)`: a runaway loop here holds a pooler
   * connection open for the length of a sign-in attempt. The unique constraint
   * is the backstop, so throwing is the honest end.
   */
  it("gives up rather than looping forever when every suffix is taken", async () => {
    await assert.rejects(
      () => uniqueUsername(["dian"], async () => true),
      /Could not derive a free username/,
    );
  });

  it("asks about each candidate once, in order", async () => {
    const asked: string[] = [];
    await uniqueUsername(["dian"], async (name) => {
      asked.push(name);
      return name !== "dian3";
    });
    assert.deepEqual(asked, ["dian", "dian2", "dian3"]);
  });
});
