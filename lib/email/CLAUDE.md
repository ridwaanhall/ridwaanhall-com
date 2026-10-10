# Email

Guidance for working in `lib/email/`. The root `CLAUDE.md` covers everything that applies everywhere.

## Other things worth knowing here

- **An email's dark mode is an overlay, and an inline style outranks a class.**
  `lib/email/layout.ts` writes the light palette inline on every element and
  repaints it from one `<style>` block under `prefers-color-scheme: dark`. Every
  override needs `!important` or the whole dark theme is dead markup, and the
  block must stay **colour only**: a client that strips it — Gmail clipping a
  long message, Outlook, a text-only proxy — has to still receive a complete
  light email, so anything structural in there is what that reader loses.
  `scripts/check-emails.mjs` asserts both directions, and separately that the
  reply notification renders **no address at all**: its `Reply-To` is the owner
  precisely so two visitors never learn each other's addresses.
- **Guestbook mail routes on roles, not on addresses.** `is_superuser` and
  `is_staff` decide who is emailed —
  `lib/email/guestbook-plan.ts` is the whole rule as a pure function, with the
  matrix under test offline. The version before it asked whether the poster's
  address appeared in `CONTACT_EMAIL_RECIPIENT`, which is the owner's *inbox*
  and has no reason to match the address they sign in with, so the exclusion
  never fired. The two roles are not interchangeable: a superuser's own post
  notifies nobody, a staff member's still notifies the owner — and because
  superuser implies staff, the rule that suppresses the receipt covers both
  without naming both.
