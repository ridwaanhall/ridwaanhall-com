import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AdminLink } from "@/components/layout/admin-link";
import { SiteShell } from "@/components/layout/site-shell";
import { getAboutData } from "@/lib/data/about";

/**
 * The public site's chrome.
 *
 * `about` is fetched once here and handed to the shell, rather than each page
 * fetching it. Django's BaseView cached it on the view instance for the same
 * reason -- several places need it per request and it used to be free.
 *
 * The admin link is the one thing here that depends on who is asking, so it
 * arrives as an already-suspended element rather than as a flag: this layout
 * stays fully cacheable and the link streams into the shell. Awaiting the staff
 * check here instead would make every page on the site dynamic.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const about = await getAboutData();
  // Every page in this group renders the profile block; without a Profile row
  // there is no site to show, which is the same conclusion BaseView reached
  // when get_about_data() raised.
  if (!about) notFound();

  return (
    <SiteShell
      about={about}
      adminLink={
        /*
         * The key is not decoration, and it is not there because anything
         * reorders. This element is created here and rendered as one of several
         * siblings inside `SidebarFooter` -- in two places, since the rail and
         * the drawer both render one -- which is a children array as far as
         * React's validation is concerned. Without a key it warns about a list
         * child on every page of the site and names this line as the owner.
         */
        <Suspense key="admin-link" fallback={null}>
          <AdminLink />
        </Suspense>
      }
    >
      {children}
    </SiteShell>
  );
}
