import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { MAX_DEPTH, buildThread, maskEmail, type ThreadMessage } from "./guestbook-tree";

/** A message with only the fields the threading actually reads spelled out. */
function message(id: string, timestamp: string, replyToId: string | null = null): ThreadMessage {
  return {
    id,
    message: `body ${id}`,
    timestamp,
    isPinned: false,
    userId: `user-${id}`,
    fullName: `Name ${id}`,
    profileImage: null,
    isAuthor: false,
    isCoAuthor: false,
    coAuthorOrder: 0,
    email: "",
    replyTo: replyToId
      ? {
          id: replyToId,
          message: `body ${replyToId}`,
          userId: `user-${replyToId}`,
          fullName: `Name ${replyToId}`,
          profileImage: null,
          isAuthor: false,
          isCoAuthor: false,
          coAuthorOrder: 0,
          email: "",
        }
      : null,
    replies: [],
    depth: 0,
    showReplyTo: false,
  };
}

const at = (n: number) => `2026-01-0${n}T00:00:00.000Z`;
const ids = (nodes: ThreadMessage[]) => nodes.map((node) => node.id);

describe("maskEmail", () => {
  it("keeps enough to be recognisable and hides the rest", () => {
    assert.equal(maskEmail("ridwaanhall@example.com"), "ri********l@example.com");
  });

  it("masks the short locals by their own rules", () => {
    assert.equal(maskEmail("ab@example.com"), "a*@example.com");
    assert.equal(maskEmail("abc@example.com"), "a*c@example.com");
    assert.equal(maskEmail("abcd@example.com"), "a**d@example.com");
  });

  it("leaves a single-character local alone, since masking it hides nothing", () => {
    assert.equal(maskEmail("a@example.com"), "a@example.com");
  });

  it("never widens or shrinks the address", () => {
    for (const address of ["ab@x.com", "abcdefgh@x.com", "a.very.long.name@example.co.uk"]) {
      assert.equal(maskEmail(address).length, address.length, address);
    }
  });

  it("passes through anything that is not an address", () => {
    assert.equal(maskEmail(""), "");
    assert.equal(maskEmail("not-an-email"), "not-an-email");
  });

  it("never reveals the local part it masked", () => {
    const masked = maskEmail("ridwaanhall@example.com");
    assert.ok(!masked.includes("ridwaanhall"));
    assert.ok(masked.endsWith("@example.com"));
  });
});

describe("buildThread", () => {
  it("returns roots oldest first", () => {
    const roots = buildThread([message("c", at(3)), message("a", at(1)), message("b", at(2))]);
    assert.deepEqual(ids(roots), ["a", "b", "c"]);
  });

  it("nests a reply under the message it answers", () => {
    const roots = buildThread([message("a", at(1)), message("b", at(2), "a")]);
    assert.deepEqual(ids(roots), ["a"]);
    assert.deepEqual(ids(roots[0].replies), ["b"]);
    assert.equal(roots[0].replies[0].depth, 1);
  });

  it("does not caption a reply the tree already places", () => {
    const roots = buildThread([message("a", at(1)), message("b", at(2), "a")]);
    assert.equal(roots[0].replies[0].showReplyTo, false);
  });

  /*
   * `getThread` reads the whole guestbook, so nothing produces an orphan today.
   * The branch is kept -- and tested -- because the alternative to handling one
   * is a renderer that drops a message for having named a parent it could not
   * find: the reply becomes a root and keeps a caption naming who it answered.
   */
  it("promotes a reply naming a message that is not in the set, and captions it", () => {
    const orphan = message("b", at(2), "not-fetched");
    const roots = buildThread([orphan]);
    assert.deepEqual(ids(roots), ["b"]);
    assert.equal(roots[0].depth, 0);
    assert.equal(roots[0].showReplyTo, true);
  });

  /*
   * `reply_to` is an unbounded self-FK and the panel is one column at 375px.
   * Past the cap a reply attaches to its grandparent, so it sits beside its
   * parent rather than further right -- and is captioned, because the tree no
   * longer shows who it answered.
   */
  it("stops indenting at the depth cap, attaching beside the parent instead", () => {
    const chain = [
      message("a", at(1)),
      message("b", at(2), "a"),
      message("c", at(3), "b"),
      message("d", at(4), "c"),
      message("e", at(5), "d"),
    ];
    const roots = buildThread(chain);

    const depths: number[] = [];
    const walk = (nodes: ThreadMessage[]) => {
      for (const node of nodes) {
        depths.push(node.depth);
        walk(node.replies);
      }
    };
    walk(roots);

    assert.ok(Math.max(...depths) < MAX_DEPTH, `depth ${Math.max(...depths)} reached the cap`);
  });

  it("captions a reply that was flattened off the message it actually answered", () => {
    const chain = [
      message("a", at(1)),
      message("b", at(2), "a"),
      message("c", at(3), "b"),
      message("d", at(4), "c"),
    ];
    buildThread(chain);
    const flattened = chain.find((m) => m.id === "d")!;
    assert.equal(flattened.showReplyTo, true);
  });

  it("keeps every message, wherever it ends up", () => {
    const messages = [
      message("a", at(1)),
      message("b", at(2), "a"),
      message("c", at(3), "b"),
      message("d", at(4), "c"),
      message("e", at(5), "missing"),
    ];
    const roots = buildThread(messages);

    const seen: string[] = [];
    const walk = (nodes: ThreadMessage[]) => {
      for (const node of nodes) {
        seen.push(node.id);
        walk(node.replies);
      }
    };
    walk(roots);

    assert.deepEqual(seen.sort(), ["a", "b", "c", "d", "e"]);
  });

  /*
   * A parent is only ever taken from messages already placed, walking oldest
   * first, so no `reply_to` value can build a cycle. Without that, the
   * recursive renderer recurses until it dies.
   */
  it("cannot be made to build a cycle, however the rows point at each other", () => {
    const a = message("a", at(1), "b");
    const b = message("b", at(2), "a");
    const roots = buildThread([a, b]);

    const seen = new Set<string>();
    const walk = (nodes: ThreadMessage[], depth = 0) => {
      assert.ok(depth < 10, "recursed too far — a cycle was built");
      for (const node of nodes) {
        assert.ok(!seen.has(node.id), `${node.id} appears twice`);
        seen.add(node.id);
        walk(node.replies, depth + 1);
      }
    };
    walk(roots);
    assert.equal(seen.size, 2);
  });

  it("orders two messages claiming the same instant deterministically", () => {
    const same = "2026-01-01T00:00:00.000Z";
    const first = buildThread([message("b", same), message("a", same)]);
    const second = buildThread([message("a", same), message("b", same)]);
    assert.deepEqual(ids(first), ids(second));
  });

  it("returns nothing for an empty thread", () => {
    assert.deepEqual(buildThread([]), []);
  });

  it("orders replies oldest first, like the roots", () => {
    const roots = buildThread([
      message("a", at(1)),
      message("c", at(3), "a"),
      message("b", at(2), "a"),
    ]);
    assert.deepEqual(ids(roots[0].replies), ["b", "c"]);
  });
});
