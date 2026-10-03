/**
 * Class strings more than one component shares: the type scale, and the few
 * controls that are not `ActionLink`.
 *
 * A plain module on purpose: a constant exported from a `"use client"` file
 * reaches a server component as a client reference rather than as the string,
 * and typechecks while doing it.
 *
 * The scale has five steps and every heading on the site is one of them. The
 * display cut sits tight at size and opens up as it shrinks; running text is
 * the sans at 17px. Labels are sentence case at reading weight -- no tracked
 * capitals above every heading.
 */

/** A page's title. */
export const H1 =
  "font-display text-[clamp(2.4rem,1.4rem+3.6vw,4.5rem)] leading-[0.96] font-medium tracking-[-0.042em] text-ink";

/** A section's title. */
export const H2 =
  "font-display text-[clamp(1.8rem,1.3rem+2vw,3rem)] leading-[1] font-medium tracking-[-0.036em] text-ink";

/** A card's or an entry's title. */
export const H3 =
  "font-display text-[clamp(1.2rem,1.08rem+0.5vw,1.5rem)] leading-[1.15] font-medium tracking-[-0.022em] text-ink";

/** The paragraph under a title. */
export const LEAD = "text-[clamp(1.075rem,1rem+0.35vw,1.3rem)] leading-[1.5] text-mute";

/** Small supporting text: dates, places, counts beside a title. */
export const META = "text-[14px] leading-snug text-mute";

/** The label above a field or a short group -- sentence case, not a kicker. */
export const EYEBROW = "text-[14px] font-medium text-ink";

/** A row in the account menu -- the admin link and the sign-out button alike. */
export const ACCOUNT_ROW =
  "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-left text-[14px] text-ink transition-colors hover:bg-raise";

/** The quiet text-only button: a word and an icon, underline on hover. */
export const TEXT_BUTTON =
  "inline-flex cursor-pointer items-center gap-2 text-[14px] font-medium text-mute transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";

/** The one solid button style: ink on paper, inverted. */
export const SOLID_BUTTON =
  "group inline-flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-full bg-ink px-6 text-[15px] font-medium text-paper transition-[background-color,transform] duration-300 hover:bg-[color-mix(in_oklab,var(--fh-ink)_86%,var(--fh-sulfur-mark))] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";

/** The outlined counterpart, for the second action beside a solid one. */
export const LINE_BUTTON =
  "group inline-flex h-12 cursor-pointer items-center justify-center gap-2.5 rounded-full border border-line px-6 text-[15px] font-medium text-ink transition-[border-color,transform] duration-300 hover:border-ink active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40";

/** A round icon-only control: search, theme, menu, close. */
export const ICON_BUTTON =
  "group inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-raise";

/** A text field: a thin rounded box that firms up on hover and focus. */
export const FIELD =
  "mt-2 w-full rounded-md border border-line bg-transparent px-3.5 py-2.5 text-[16px] text-ink outline-none transition-colors placeholder:text-mute hover:border-mute focus:border-ink";
