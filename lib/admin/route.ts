import {
  ADMIN_ENTRIES_BY_KEY,
  ADMIN_SECTIONS_BY_KEY,
  sectionTabs,
  type AdminEntry,
  type AdminSection,
} from "@/lib/admin/registry";

/**
 * What `/admin/<model>/<sub>` names.
 *
 * The second segment carries a record id for an ordinary model and a tab key
 * for a section, and Next cannot tell those apart -- both are
 * `/admin/[*]/[*]`. So one function decides, and every route under that
 * segment asks it rather than parsing the URL again with slightly different
 * rules.
 *
 * Plain data in, plain data out: no database, no `server-only`, so the check
 * harnesses and the unit suite can both read it.
 */
export type AdminRoute =
  | { kind: "record"; entry: AdminEntry; id: string }
  | { kind: "tab"; section: AdminSection; entry: AdminEntry };

export function resolveAdminRoute(model: string, sub: string): AdminRoute | null {
  const section = ADMIN_SECTIONS_BY_KEY.get(model);
  if (section) {
    // A section's second segment is one of *its* tabs. Another section's tab
    // is a 404, not a redirect: `/admin/taxonomy/work-mode` was never a URL
    // anything here produced.
    const entry = sectionTabs(section.key).find((tab) => tab.key === sub);
    return entry ? { kind: "tab", section, entry } : null;
  }

  const entry = ADMIN_ENTRIES_BY_KEY.get(model);
  // A sectioned entry is refused at the top level. It is still in the
  // registry, so without this line `/admin/tag/<id>` keeps answering beside
  // `/admin/taxonomy/tag/<id>`.
  if (!entry || entry.section) return null;

  return { kind: "record", entry, id: sub };
}
