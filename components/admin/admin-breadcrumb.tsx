"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronIcon } from "@/components/admin/admin-icons";
import {
  ADMIN_ENTRIES_BY_KEY,
  ADMIN_SECTIONS_BY_KEY,
  adminPath,
  sectionTabs,
} from "@/lib/admin/registry";

/**
 * Where you are, across a URL space that is nearly flat.
 *
 * Almost every screen is `/admin/<key>` -- one segment, because every model
 * name in this project is unique and an area segment would carry no
 * information. The Settings vocabularies are the exception: each is a tab on a
 * section page, so its URL is `/admin/<section>/<key>` -- two segments meaning
 * something quite different from the two of `/admin/<model>/<id>`. So the
 * first segment is asked of `ADMIN_SECTIONS_BY_KEY` before it is read as a
 * model -- a section key names no model, and read as one it resolves to
 * nothing, which would stop the trail dead at Admin on every Settings screen.
 *
 * Either shape leaves the *interface* with nothing saying which of nine areas
 * a screen belongs to, which the rail answers only while the rail is expanded.
 * The registry already knows, so the trail says it.
 *
 * A client component because it reads the path, and it is the whole reason the
 * topbar hands it down rather than rendering it: `AdminTopbar` stays a server
 * component with its sign-out server action intact.
 *
 * The group is text rather than a link. There is no page for an area -- the
 * index lists everything at once -- so a crumb pointing at one would either
 * 404 or lie about where it goes. The section crumb is text for a narrower
 * reason: a section's page *is* its first tab, so a link there would go
 * sideways to a sibling rather than up.
 */
export function AdminBreadcrumb() {
  const pathname = usePathname();
  const [, , first, second, third] = pathname.split("/");
  const section = first ? ADMIN_SECTIONS_BY_KEY.get(first) : undefined;
  const entry = section
    ? sectionTabs(section.key).find((tab) => tab.key === second)
    : first
      ? ADMIN_ENTRIES_BY_KEY.get(first)
      : undefined;
  // A section spends a segment on itself, so the record id is one further
  // along. Reading the same position for both is what would make
  // `/admin/taxonomy/tag` claim to be a tag being edited.
  const tail = section ? third : second;

  // A key with no registry entry is a 404 the page itself renders; the trail
  // stops at "Admin" rather than inventing a name for it.
  const model = entry ? { href: adminPath(entry) as Route, label: entry.labelPlural } : null;
  // A singleton's screen *is* its record, so there is nothing below it.
  const leaf = model && tail && !entry?.singleton ? (tail === "new" ? "New" : "Edit") : null;

  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
      <Crumb href={model ? "/admin" : undefined}>Admin</Crumb>

      {entry && (
        <>
          <Separator />
          {/* Not a link: an area has no page of its own. */}
          <span className="hidden shrink-0 text-zinc-600 sm:inline">{entry.group}</span>
          <Separator className="hidden sm:inline-flex" />
          {section && (
            <>
              <span className="hidden shrink-0 text-zinc-600 sm:inline">{section.label}</span>
              <Separator className="hidden sm:inline-flex" />
            </>
          )}
          <Crumb href={leaf ? model?.href : undefined}>{model?.label}</Crumb>
        </>
      )}

      {leaf && (
        <>
          <Separator />
          <Crumb>{leaf}</Crumb>
        </>
      )}
    </nav>
  );
}

function Separator({ className }: { className?: string }) {
  return (
    <ChevronIcon
      aria-hidden="true"
      height={12}
      width={12}
      className={`shrink-0 text-zinc-700 ${className ?? ""}`}
    />
  );
}

/** A link when there is somewhere to go, and the current page when there is not. */
function Crumb({ href, children }: { href?: Route; children: React.ReactNode }) {
  if (!href) {
    return (
      <span aria-current="page" className="truncate text-zinc-300">
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className="shrink-0 text-zinc-500 transition-colors hover:text-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
    >
      {children}
    </Link>
  );
}
