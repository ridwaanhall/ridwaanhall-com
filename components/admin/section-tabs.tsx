import type { Route } from "next";
import Link from "next/link";

import { adminPath, sectionTabs, type AdminSection } from "@/lib/admin/registry";
import { can } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/staff";
import { cn } from "@/lib/utils/cn";

/**
 * One section's vocabularies, as a strip of links.
 *
 * **Links, not the about page's tabs.** That component mounts every panel at
 * once and switches them in the client, which works because its panels are
 * static prose. These are changelists, each with its own search, filter, sort
 * and page living in the query string -- multiplexing six of those into one
 * URL is a worse interface than six URLs, and it would put a client bundle in
 * front of a server-rendered table.
 *
 * The mark is drawn from `aria-current` in `styles/admin-motion.css`, the same
 * bargain `.admin-nav-item` makes: one source, so a tab cannot look current
 * while telling a screen reader it is not.
 *
 * A server component. It holds no state -- the URL is the state -- which is
 * also what lets it ask who is reading and drop the tabs they cannot open. The
 * rail already hides those screens, so a strip that still offered them would be
 * the one place in the admin naming a screen this account is kept out of. The
 * `requireStaff` is free: memoised per request, and the page above has run it.
 */
export async function SectionTabs({
  section,
  activeKey,
}: {
  section: AdminSection;
  activeKey: string;
}) {
  const actor = await requireStaff();
  const tabs = sectionTabs(section.key).filter((tab) => can(actor, tab.key, "view"));

  return (
    <div className="border-b border-zinc-800">
      <nav
        aria-label={`${section.label} settings`}
        className="-mb-px flex flex-wrap items-center gap-x-1"
      >
        {tabs.map((tab) => {
          const current = tab.key === activeKey;

          return (
            <Link
              key={tab.key}
              href={adminPath(tab) as Route}
              aria-current={current ? "page" : undefined}
              className={cn(
                "admin-tab rounded-t-md px-3 py-2 text-sm whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400",
                current ? "text-zinc-100" : "text-zinc-500 hover:text-zinc-300",
              )}
            >
              {tab.labelPlural}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
