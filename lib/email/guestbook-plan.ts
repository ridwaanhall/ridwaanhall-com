/**
 * Who a new guestbook message emails, and what each of those replies to.
 *
 * Pure on purpose. The dispatch rules are the part of the guestbook's mail with
 * real branching -- three emails, five exceptions between them -- and they used
 * to be interleaved with loading rows and calling Resend, which left them
 * reachable only by posting a real message. Here they are a function of their
 * inputs, so `guestbook-plan.test.ts` covers the whole matrix offline and
 * `guestbook-notify.ts` is left doing nothing but I/O.
 *
 * **Roles decide, not addresses.** The previous rule asked whether the poster's
 * address appeared in `CONTACT_EMAIL_RECIPIENT`, which is the owner's *inbox*
 * and has no reason to match the address they signed in with -- so in practice
 * it never fired and the owner was emailed about their own posts. `is_author`
 * and `is_co_author` on `guest_profile` are what actually say who somebody is,
 * they are read from the database on every request, and they are already loaded
 * by the time this is called.
 *
 * The two roles are deliberately not interchangeable:
 *
 *   - an **author** is the site's owner, so notifying them of their own post is
 *     telling them what they just did
 *   - a **co-author** is somebody else, so the owner still wants to know they
 *     posted -- they just do not need a receipt for their own message
 *
 * A reply notification ignores roles entirely. Being told that somebody
 * answered you is news whoever you are, and the only thing that suppresses it
 * is replying to yourself.
 */

export type DispatchKind = "owner" | "confirm" | "reply";

/** One email to send: everything the envelope needs except the body. */
export type Dispatch = {
  kind: DispatchKind;
  to: string[];
  replyTo?: string[];
};

export type PlanInput = {
  sender: { email: string; isAuthor: boolean; isCoAuthor: boolean };
  /** The author of the message being replied to, when this is a reply. */
  parentAuthor?: { email: string };
  /** `CONTACT_EMAIL_RECIPIENT`, already split. */
  owners: string[];
};

/** Trimmed, non-empty, de-duplicated — an envelope field is not a free-for-all. */
function addresses(list: string[]): string[] {
  return [...new Set(list.map((address) => address.trim()).filter(Boolean))];
}

export function planGuestbookEmails({ sender, parentAuthor, owners }: PlanInput): Dispatch[] {
  const to = addresses(owners);
  const senderEmail = sender.email.trim();
  const parentEmail = parentAuthor?.email.trim() ?? "";

  const plan: Dispatch[] = [];

  // 1. Tell the owner. Not when the author posted: that is their own message.
  //    A co-author's post is somebody else's, so it still goes out.
  if (!sender.isAuthor && to.length > 0) {
    plan.push({
      kind: "owner",
      to,
      // Answering the notification answers the poster. Omitted rather than sent
      // empty when the account carries no address — a Reply-To of nothing is
      // worse than none, because the client shows a blank recipient instead of
      // falling back to From.
      ...(senderEmail ? { replyTo: [senderEmail] } : {}),
    });
  }

  // 2. Confirm to whoever posted. Skipped for both roles: neither needs a
  //    receipt for a message they wrote on their own site.
  if (!sender.isAuthor && !sender.isCoAuthor && senderEmail) {
    plan.push({
      kind: "confirm",
      to: [senderEmail],
      ...(to.length > 0 ? { replyTo: to } : {}),
    });
  }

  // 3. Tell whoever was answered — roles included. Replying to yourself needs
  //    no email, and neither does a parent whose account has no address.
  if (parentEmail && parentEmail !== senderEmail) {
    plan.push({
      kind: "reply",
      to: [parentEmail],
      // Never the replier: the two readers are strangers to each other, and the
      // body renders no address for the same reason.
      ...(to.length > 0 ? { replyTo: to } : {}),
    });
  }

  return plan;
}
