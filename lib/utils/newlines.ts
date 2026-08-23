/**
 * Line breaks, as one kind.
 *
 * A browser submitting a form normalises every line break in every field value
 * to CRLF -- not only in a `<textarea>`, and whatever the value contained when
 * it was typed. Stored text here uses LF, so anything written back without this
 * differs from what was read in every single line, which turns opening a record
 * and pressing Save into a rewrite of the whole column.
 *
 * That was a live bug in the admin's twenty-seven textarea fields before it was
 * a shared function. It is here rather than private to one form because the
 * guestbook needs the same guarantee and for the same reason: its composer is a
 * `<textarea>`, and a message is stored as typed.
 *
 * The lone `\r` case is not theoretical padding -- a value can carry one on its
 * own, and left alone it renders as a line break in some places and as nothing
 * at all in others.
 */
export function normaliseNewlines(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}
