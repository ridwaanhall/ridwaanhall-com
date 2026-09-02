import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { planGuestbookEmails, type Dispatch, type DispatchKind } from "./guestbook-plan";

const OWNERS = ["hi@ridwaanhall.com"];

const visitor = { email: "ada@example.com", isSuperuser: false, isStaff: false };
// Superuser implies staff -- the database refuses the other pair.
const owner = { email: "ridwan@example.com", isSuperuser: true, isStaff: true };
const helper = { email: "grace@example.com", isSuperuser: false, isStaff: true };

const kinds = (plan: Dispatch[]): DispatchKind[] => plan.map((d) => d.kind);
const of = (plan: Dispatch[], kind: DispatchKind) => plan.find((d) => d.kind === kind);

describe("planGuestbookEmails — an ordinary visitor", () => {
  const plan = planGuestbookEmails({ sender: visitor, owners: OWNERS });

  it("tells the owner and confirms to the poster", () => {
    assert.deepEqual(kinds(plan), ["owner", "confirm"]);
  });

  /*
   * The half that was missing: the notification carried no Reply-To at all, so
   * answering it went to the send-only `notify@` address rather than to the
   * person who wrote in.
   */
  it("points the owner's reply at the poster", () => {
    assert.deepEqual(of(plan, "owner")?.to, OWNERS);
    assert.deepEqual(of(plan, "owner")?.replyTo, ["ada@example.com"]);
  });

  it("points the poster's reply at the owner", () => {
    assert.deepEqual(of(plan, "confirm")?.to, ["ada@example.com"]);
    assert.deepEqual(of(plan, "confirm")?.replyTo, OWNERS);
  });
});

describe("planGuestbookEmails — roles", () => {
  /*
   * A superuser is the site's owner. Telling them about their own post is
   * telling them what they just did, and a receipt is no better.
   */
  it("sends nothing at all when the owner posts", () => {
    const plan = planGuestbookEmails({ sender: owner, owners: OWNERS });
    assert.deepEqual(plan, []);
  });

  /*
   * Staff is somebody else, so the owner does want to know. The receipt is what
   * they do not need -- and because superuser implies staff, the rule that
   * suppresses it here suppresses it above too, without naming both roles.
   */
  it("notifies the owner about a staff post, but sends them no receipt", () => {
    const plan = planGuestbookEmails({ sender: helper, owners: OWNERS });
    assert.deepEqual(kinds(plan), ["owner"]);
    assert.deepEqual(of(plan, "owner")?.replyTo, ["grace@example.com"]);
  });
});

describe("planGuestbookEmails — replies", () => {
  it("tells the person who was answered", () => {
    const plan = planGuestbookEmails({
      sender: visitor,
      parentAuthor: { email: "grace@example.com" },
      owners: OWNERS,
    });
    assert.deepEqual(kinds(plan), ["owner", "confirm", "reply"]);
    assert.deepEqual(of(plan, "reply")?.to, ["grace@example.com"]);
  });

  /*
   * The privacy rule, and the reason the body renders no address for the
   * replier either: these two readers are strangers, and a Reply-To of the
   * replier would hand each of them the other's address.
   */
  it("routes that reply back to the owner, never to the replier", () => {
    const plan = planGuestbookEmails({
      sender: visitor,
      parentAuthor: { email: "grace@example.com" },
      owners: OWNERS,
    });
    assert.deepEqual(of(plan, "reply")?.replyTo, OWNERS);
    assert.ok(!JSON.stringify(of(plan, "reply")).includes("ada@example.com"));
  });

  it("says nothing when somebody replies to themselves", () => {
    const plan = planGuestbookEmails({
      sender: visitor,
      parentAuthor: { email: "ada@example.com" },
      owners: OWNERS,
    });
    assert.deepEqual(kinds(plan), ["owner", "confirm"]);
  });

  /*
   * Roles suppress the receipt, not the news. An owner who is answered still
   * hears about it, or replies to their own guestbook messages go unnoticed.
   */
  it("still tells the owner that somebody answered them", () => {
    const plan = planGuestbookEmails({
      sender: visitor,
      parentAuthor: { email: "ridwan@example.com" },
      owners: OWNERS,
    });
    assert.deepEqual(of(plan, "reply")?.to, ["ridwan@example.com"]);
  });

  /* And the owner replying to a visitor is news to that visitor. */
  it("tells a visitor when the owner answers them, sending the owner nothing", () => {
    const plan = planGuestbookEmails({
      sender: owner,
      parentAuthor: { email: "ada@example.com" },
      owners: OWNERS,
    });
    assert.deepEqual(kinds(plan), ["reply"]);
    assert.deepEqual(of(plan, "reply")?.to, ["ada@example.com"]);
  });

  it("skips the reply when the parent's account carries no address", () => {
    const plan = planGuestbookEmails({
      sender: visitor,
      parentAuthor: { email: "" },
      owners: OWNERS,
    });
    assert.deepEqual(kinds(plan), ["owner", "confirm"]);
  });
});

describe("planGuestbookEmails — missing addresses", () => {
  /*
   * An account can carry no address: GitHub only returns one when the user has
   * made it public. The owner is still told; there is simply nobody to point
   * the reply at, and an empty Reply-To shows the reader a blank recipient
   * rather than falling back to From.
   */
  it("notifies the owner without a Reply-To when the poster has no address", () => {
    const plan = planGuestbookEmails({
      sender: { email: "", isSuperuser: false, isStaff: false },
      owners: OWNERS,
    });
    assert.deepEqual(kinds(plan), ["owner"]);
    assert.equal(of(plan, "owner")?.replyTo, undefined);
  });

  it("sends nothing to the owner when no owner address is configured", () => {
    const plan = planGuestbookEmails({ sender: visitor, owners: [] });
    assert.deepEqual(kinds(plan), ["confirm"]);
    assert.equal(of(plan, "confirm")?.replyTo, undefined);
  });

  it("trims and de-duplicates the owner list", () => {
    const plan = planGuestbookEmails({
      sender: visitor,
      owners: [" hi@ridwaanhall.com ", "hi@ridwaanhall.com", ""],
    });
    assert.deepEqual(of(plan, "owner")?.to, ["hi@ridwaanhall.com"]);
  });
});
