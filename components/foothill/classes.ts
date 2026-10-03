/**
 * Class strings more than one component shares.
 *
 * A plain module on purpose: a constant exported from a `"use client"` file
 * reaches a server component as a client reference rather than as the string,
 * and typechecks while doing it.
 */

/** A row in the account menu -- the admin link and the sign-out button alike. */
export const ACCOUNT_ROW =
  "flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-[14px] text-ink transition-colors hover:bg-raise";

/** The quiet, text-only button: mono label, underline on hover. */
export const TEXT_BUTTON =
  "fh-mono inline-flex cursor-pointer items-center gap-2 text-[12px] tracking-[0.08em] text-mute uppercase transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-50";

/** The one solid button style: ink on paper, inverted. */
export const SOLID_BUTTON =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[15px] font-medium text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40";

/** The outlined counterpart, for the second action beside a solid one. */
export const LINE_BUTTON =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-[15px] text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40";

/** A text field: a single rule underneath, no box. */
export const FIELD =
  "w-full border-0 border-b border-line bg-transparent px-0 py-3 text-[17px] text-ink outline-none transition-colors placeholder:text-mute focus:border-ink";

/** The small mono label above a section, a field or a column. */
export const EYEBROW = "fh-mono text-[11px] tracking-[0.16em] text-mute uppercase";
