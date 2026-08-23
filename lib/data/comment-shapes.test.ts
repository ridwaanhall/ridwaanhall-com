import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { COMMENTABLE, MAX_COMMENT_LENGTH, canDeleteComment, isCommentable } from "./comment-shapes";

describe("isCommentable", () => {
  it("accepts the two things a comment can attach to", () => {
    for (const label of Object.keys(COMMENTABLE)) assert.equal(isCommentable(label), true);
  });

  it("rejects anything else, so a target cannot be invented from a URL", () => {
    for (const label of ["", "user", "account", "blog_post_", "BLOG_POST"]) {
      assert.equal(isCommentable(label), false, `expected ${JSON.stringify(label)} to be rejected`);
    }
  });
});

describe("canDeleteComment", () => {
  const mine = { userId: "me", isDeleted: false };
  const theirs = { userId: "them", isDeleted: false };
  const reader = { userId: "me", isAuthor: false, isCoAuthor: false };
  const author = { userId: "me", isAuthor: true, isCoAuthor: false };
  const coAuthor = { userId: "me", isAuthor: false, isCoAuthor: true };

  it("lets someone delete their own", () => {
    assert.equal(canDeleteComment(mine, reader), true);
  });

  it("does not let an ordinary reader delete someone else's", () => {
    assert.equal(canDeleteComment(theirs, reader), false);
  });

  it("lets an author or co-author moderate anyone's", () => {
    assert.equal(canDeleteComment(theirs, author), true);
    assert.equal(canDeleteComment(theirs, coAuthor), true);
  });

  it("offers nothing to a signed-out reader", () => {
    assert.equal(canDeleteComment(mine, null), false);
    assert.equal(canDeleteComment(theirs, null), false);
  });

  /*
   * The tombstone is the end state. Offering the control again would suggest
   * there is something left to remove.
   */
  it("never offers to delete an already-deleted comment, even to an author", () => {
    const gone = { userId: "them", isDeleted: true };
    assert.equal(canDeleteComment(gone, author), false);
    assert.equal(canDeleteComment({ userId: "me", isDeleted: true }, reader), false);
  });
});

describe("MAX_COMMENT_LENGTH", () => {
  it("is a positive bound the form and the action can share", () => {
    assert.ok(Number.isInteger(MAX_COMMENT_LENGTH) && MAX_COMMENT_LENGTH > 0);
  });
});
