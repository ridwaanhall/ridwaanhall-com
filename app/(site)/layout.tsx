import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AccountPanel, AccountPanelSkeleton } from "@/components/layout/account-panel";
import { SiteShell } from "@/components/layout/site-shell";
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
 * **Two of them, one per placement.** The navbar's opens downward from a control
 * the width of an avatar; the drawer's opens upward across a column and names the
 * reader in two lines. One element cannot be both, and rendering a single one in
 * both places is what forced them to be the same shape. The second costs
 * nothing: the identity and staff reads behind it are both memoised per request,
 * so the pair resolves off one of each.
 *
 * The keys are not decoration, and they are not there because anything reorders.
 * Each is created here and rendered as one of several siblings inside the navbar
 * or the drawer, which is a children array as far as React's validation is
 * concerned. Without a key it warns about a list child on every page of the site
 * and names this line as the owner.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const about = await getAboutData();
  // Every page in this group renders the profile block, so without a Profile
  // row there is no site to show. `notFound()` rather than an empty shell:
  // half a layout around a page that cannot be right is worse than saying so.
  if (!about) notFound();

  return (
    <SiteShell
      about={about}
      navbarAccount={
        <Suspense key="account-navbar" fallback={<AccountPanelSkeleton />}>
          <AccountPanel variant="navbar" />
        </Suspense>
      }
      drawerAccount={
        <Suspense key="account-drawer" fallback={<AccountPanelSkeleton />}>
          <AccountPanel variant="drawer" />
        </Suspense>
      }
    >
      {children}
    </SiteShell>
  );
}
