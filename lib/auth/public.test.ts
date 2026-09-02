import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NO_PUBLIC_ACCESS, publicCapabilities, type PublicFlags } from "@/lib/auth/public";
import { roleFor } from "@/lib/auth/roles";

/**
 * The public site's rules, offline.
 *
 * The half of the permission model that had no rules at all until now: posting
 * a comment or a guestbook message was gated on "is there a session", and the
 * only public permissions that existed were about moderating other people.
 *
 * Asserted as a matrix rather than case by case, because the interesting
 * failures here are combinations -- an inactive superuser, a staff account with
 * commenting switched off -- and a test that walks the happy path for each role
 * separately is exactly the shape that misses them.
 */

function flags(overrides: Partial<PublicFlags> = {}): PublicFlags {
  return {
    isActive: true,
    isStaff: false,
    isSuperuser: false,
    canComment: true,
    canGuestbook: true,
    ...overrides,
  };
}

/** Superuser implies staff -- `account_superuser_is_staff` refuses the pair. */
const superuser = flags({ isSuperuser: true, isStaff: true });
const staff = flags({ isStaff: true });
const reader = flags();

describe("publicCapabilities", () => {
  it("lets an ordinary reader post, and nothing more", () => {
    const can = publicCapabilities(reader);
    assert.deepEqual(can, {
      comment: true,
      guestbook: true,
      moderateComments: false,
      pin: false,
      deleteMessages: false,
    });
  });

  it("lets staff moderate comments and pin", () => {
    const can = publicCapabilities(staff);
    assert.equal(can.moderateComments, true);
    assert.equal(can.pin, true);
  });

  /*
   * The one asymmetry, and it is inherited rather than invented: deleting a
   * guestbook message was author-only while pinning and comment moderation were
   * author-or-co-author. It earns its keep -- a guestbook delete is a recursive
   * hard delete with no tombstone.
   */
  it("reserves deleting a guestbook message for a superuser", () => {
    assert.equal(publicCapabilities(staff).deleteMessages, false);
    assert.equal(publicCapabilities(superuser).deleteMessages, true);
  });

  it("gives a superuser everything staff has, since the roles nest", () => {
    const above = publicCapabilities(superuser);
    for (const [name, value] of Object.entries(publicCapabilities(staff))) {
      if (value) assert.equal(above[name as keyof typeof above], true, name);
    }
  });

  it("still lets staff and a superuser post like anybody else", () => {
    for (const who of [staff, superuser]) {
      assert.equal(publicCapabilities(who).comment, true);
      assert.equal(publicCapabilities(who).guestbook, true);
    }
  });
});

describe("publicCapabilities — the two switches", () => {
  it("refuses commenting without refusing the guestbook", () => {
    const can = publicCapabilities(flags({ canComment: false }));
    assert.equal(can.comment, false);
    assert.equal(can.guestbook, true);
  });

  it("refuses the guestbook without refusing commenting", () => {
    const can = publicCapabilities(flags({ canGuestbook: false }));
    assert.equal(can.guestbook, false);
    assert.equal(can.comment, true);
  });

  /*
   * A switch is about posting, not about moderating. Taking commenting away
   * from a staff account must not quietly cost them the moderation their role
   * carries, or the two settings would interfere in a way nobody expects.
   */
  it("leaves moderation alone when the posting switches are off", () => {
    const can = publicCapabilities(flags({ isStaff: true, canComment: false, canGuestbook: false }));
    assert.equal(can.comment, false);
    assert.equal(can.guestbook, false);
    assert.equal(can.moderateComments, true);
    assert.equal(can.pin, true);
  });
});

describe("publicCapabilities — is_active", () => {
  /*
   * `is_active` was documented in three places as "may sign in at all" and read
   * in exactly one -- the admin gate -- so it meant "may reach the admin" and
   * nothing else. A deactivated account could still comment, post and pin.
   */
  it("refuses everything, whatever the switches say", () => {
    const can = publicCapabilities(flags({ isActive: false }));
    assert.deepEqual(can, NO_PUBLIC_ACCESS);
  });

  it("refuses a superuser too, since an inactive account must not write", () => {
    const can = publicCapabilities({ ...superuser, isActive: false });
    assert.deepEqual(can, NO_PUBLIC_ACCESS);
  });

  it("answers no to every capability there is, not merely the ones listed here", () => {
    const can = publicCapabilities(flags({ isActive: false, isStaff: true, isSuperuser: true }));
    for (const [name, value] of Object.entries(can)) assert.equal(value, false, name);
  });
});

describe("roleFor", () => {
  it("names the one role an account holds, most privileged first", () => {
    assert.equal(roleFor(superuser), "superuser");
    assert.equal(roleFor(staff), "staff");
    assert.equal(roleFor(reader), "public");
  });

  /*
   * Public is what everybody has, so it is what is left when neither flag is
   * set -- there is no column for it and nothing to read.
   */
  it("calls an account with no flags public rather than nothing", () => {
    assert.equal(roleFor({ isStaff: false, isSuperuser: false }), "public");
  });

  it("does not depend on is_active, which is about whether, not about which", () => {
    assert.equal(roleFor({ isStaff: true, isSuperuser: false }), "staff");
  });
});
