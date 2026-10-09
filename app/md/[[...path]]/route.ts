import { getAboutData } from "@/lib/data/about";
import {
  aboutTwin,
  blogTwin,
  contactTwin,
  cvTwin,
  dashboardTwin,
  guestbookTwin,
  homeTwin,
  legalTwin,
  openhireTwin,
  postTwin,
  projectTwin,
  projectsTwin,
  render,
  type Twin,
} from "@/lib/markdown/pages";
import { markdown, missing } from "@/lib/markdown/respond";

/**
 * Every page's Markdown twin, from one handler.
 *
 * `proxy.ts` rewrites `/about.md` -- and any page asked for with
 * `Accept: text/markdown` -- to `/md/about`, so the address a reader or an
 * agent uses is the page's own plus `.md`, and nothing here is reachable
 * under a path anybody has to know about. The home page is `/index.md`.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params;
  const about = await getAboutData();
  if (!about) return missing();

  const [first, second] = path.length === 1 && path[0] === "index" ? [] : path;
  let twin: Twin | null = null;

  if (!first) twin = await homeTwin(about);
  else if (!second) {
    if (first === "projects") twin = await projectsTwin();
    else if (first === "blog") twin = await blogTwin();
    else if (first === "about") twin = await aboutTwin(about);
    else if (first === "cv") twin = await cvTwin();
    else if (first === "dashboard") twin = dashboardTwin(about);
    else if (first === "guestbook") twin = await guestbookTwin();
    else if (first === "contact") twin = contactTwin(about);
    else if (first === "openhire") twin = await openhireTwin(about);
    else if (first === "privacy-policy") twin = await legalTwin("privacy-policy");
    else if (first === "terms") twin = await legalTwin("terms-and-conditions");
  } else if (path.length === 2) {
    if (first === "projects") twin = await projectTwin(second);
    else if (first === "blog") twin = await postTwin(second, about);
    else if (first === "legal") twin = await legalTwin(second);
  }

  return twin ? markdown(render(twin), twin.page ?? twin.path) : missing();
}
