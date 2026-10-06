import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Footer } from "@/components/foothill/footer";
import { SiteShell } from "@/components/foothill/site-shell";
import { AccountPanel, AccountPanelSkeleton } from "@/components/layout/account-panel";
import { getAboutData } from "@/lib/data/about";

/**
 * The public site's chrome.
 *
 * `about` is fetched once here and handed to the shell, rather than each page
 * fetching it: several places need it per request, and the layout is the one
 * place that renders for all of them.
 *
 * The account panel is the one thing here that depends on who is asking, so it
 * arrives as an already-suspended element rather than as a flag: this layout
 * stays fully cacheable and the panel streams into the shell. Awaiting the
 * session here instead would make every page on the site dynamic.
 *
 * The key is there because the navbar renders this element in two places --
 * the bar and the mobile menu -- each inside a children array, and React
 * warns about an unkeyed list child on every page without it.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const about = await getAboutData();
  // Every page in this group renders the profile, so without a Profile row
  // there is no site to show. `notFound()` rather than an empty shell: half a
  // layout around a page that cannot be right is worse than saying so.
  if (!about) notFound();

  return (
    <SiteShell
      about={about}
      account={
        <Suspense key="account-panel" fallback={<AccountPanelSkeleton />}>
          <AccountPanel />
        </Suspense>
      }
      footer={<Footer about={about} />}
    >
      {children}
    </SiteShell>
  );
}
