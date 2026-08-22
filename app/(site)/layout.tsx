import { notFound } from "next/navigation";

import { SiteShell } from "@/components/layout/site-shell";
import { getAboutData } from "@/lib/data/about";

/**
 * The public site's chrome.
 *
 * `about` is fetched once here and handed to the shell, rather than each page
 * fetching it. Django's BaseView cached it on the view instance for the same
 * reason -- several places need it per request and it used to be free.
 */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const about = await getAboutData();
  // Every page in this group renders the profile block; without a Profile row
  // there is no site to show, which is the same conclusion BaseView reached
  // when get_about_data() raised.
  if (!about) notFound();

  return <SiteShell about={about}>{children}</SiteShell>;
}
