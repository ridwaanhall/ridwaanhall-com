/**
 * Whether an Openhire API route may answer. The page and the Markdown twin
 * already 404 when the matching profile flag is off; the API reads the same
 * flag so it cannot serve what the site says is not offered. A missing profile
 * counts as off.
 */
export type OpenhireFlag = "is_hiring" | "is_open_to_work";

export function openhireEnabled(
  about: Partial<Record<OpenhireFlag, boolean>> | null | undefined,
  flag: OpenhireFlag,
): boolean {
  return about?.[flag] === true;
}
