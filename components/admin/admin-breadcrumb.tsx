"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronIcon } from "@/components/admin/admin-icons";
import { ADMIN_ENTRIES_BY_KEY } from "@/lib/admin/registry";

/**
 * Where you are, across a URL space that is deliberately flat.
 *
 * Every screen is `/admin/<key>` -- one segment, because every model name in
 * this project is unique and an area segment would carry no information. That
 * is right for the URL and leaves the *interface* with nothing saying which of
 * eight areas a screen belongs to, which the rail answers only while the rail
 * is expanded. The registry already knows, so the trail says it.
 *
 * A client component because it reads the path, and it is the whole reason the
 * topbar hands it down rather than rendering it: `AdminTopbar` stays a server
 * component with its sign-out server action intact.
 *
 * The group is text rather than a link. There is no page for an area -- the
 * index lists everything at once -- so a crumb pointing at one would either
 * 404 or lie about where it goes.
 */
export function AdminBreadcrumb() {
  const pathname = usePathname();
  const [, , key, tail] = pathname.split("/");
  const entry = key ? ADMIN_ENTRIES_BY_KEY.get(key) : undefined;

  // A key with no registry entry is a 404 the page itself renders; the trail
  // stops at "Admin" rather than inventing a name for it.
  const model = entry ? { href: `/admin/${entry.key}` as Route, label: entry.labelPlural } : null;
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
