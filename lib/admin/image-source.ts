/**
 * Which of the ways into an image field this submission actually used.
 *
 * An image field has two doors now -- a file the browser posts and a link the
 * server fetches -- on top of the clear box and the case that matters most,
 * which is nobody having touched it at all. Four inputs, five outcomes, and the
 * combinations between them are exactly the shape that rots quietly: an untouched
 * field written as empty blanks an image every time some other field on the
 * record is saved, and that failure is invisible until somebody notices a photo
 * has gone.
 *
 * So the decision is a function of its inputs, tested as a matrix offline, and
 * `lib/admin/images.ts` is left doing the I/O. That module is `server-only` --
 * it uploads -- so nothing in it can be reached by `npm test`, which is the same
 * reason `lib/email/guestbook-plan.ts` exists apart from the mail it plans.
 */

export type ImageSource =
  /** A file was chosen. Upload it. */
  | { kind: "upload" }
  /** A link was pasted. Fetch it, then store what comes back. */
  | { kind: "link"; link: string }
  /** The clear box was ticked. Empty the column. */
  | { kind: "clear" }
  /**
   * Nothing was supplied, which means the field was not edited -- **not** that
   * it should be emptied. An empty file input is the resting state of every
   * save, so reading it as "make it empty" blanks the image on every unrelated
   * edit.
   */
  | { kind: "untouched" }
  | { kind: "error"; error: string };

export type ImageSourceInput = {
  /** Names the field in whatever message comes back. */
  label: string;
  /** A file was chosen and has bytes in it. */
  hasFile: boolean;
  /** Whatever was in the link box, already trimmed. */
  link: string;
  /** The clear box was ticked. */
  cleared: boolean;
  /** The storage key the record holds today, or `""`. */
  existing: string;
  required?: boolean;
};

export function imageSourceFor({
  label,
  hasFile,
  link,
  cleared,
  existing,
  required,
}: ImageSourceInput): ImageSource {
  /*
   * Both doors at once is refused rather than resolved.
   *
   * It is only reachable before the bundle arrives -- once the control hydrates
   * it disables whichever input its switch is not showing, because a `hidden`
   * form control still submits and only a `disabled` one does not. Picking a
   * winner here would mean a save that silently threw away one of two things
   * somebody deliberately supplied, and they would have no way to tell which.
   */
  if (hasFile && link) {
    return {
      kind: "error",
      error: `${label} has both a file and a link. Use one or the other.`,
    };
  }

  // A new image beats the clear box: supplying one and asking to remove the old
  // one is a replacement, and the old key becomes stale either way.
  if (hasFile) return { kind: "upload" };
  if (link) return { kind: "link", link };

  if (cleared) {
    if (required) return { kind: "error", error: `${label} is required.` };
    return { kind: "clear" };
  }

  // Nothing supplied and nothing stored. Only a problem where the column says so.
  if (required && !existing) return { kind: "error", error: `${label} is required.` };

  return { kind: "untouched" };
}
