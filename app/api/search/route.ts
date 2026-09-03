import { handle, ok } from "@/lib/api/response";
import { getBlogs, getProjects, sortProjects } from "@/lib/data/content";

/**
 * What the command palette can find, and nothing else.
 *
 * The palette indexed pages, socials and CV links -- everything except the two
 * things the site is mostly made of. It could not find a post or a project.
 *
 * Fetched when the palette is first opened rather than passed down with every
 * page, because the alternative is eighty-odd titles in the Flight payload of
 * every route to serve a panel most readers never open.
 *
 * A title, a slug, and the words worth matching on. Explicitly not the body:
 * `/api/blog?all=1` is measured at 75KB against 12KB for the summaries, and a
 * palette that matched prose would still only be able to show a title.
 */
export const GET = handle(async () => {
  const [posts, projects] = await Promise.all([getBlogs(), getProjects()]);

  return ok({
    posts: posts.map((post) => ({
      title: post.title,
      slug: post.slug,
      // Lower-cased here so the client compares against a query it has already
      // lower-cased, rather than re-walking every entry on each keystroke.
      keywords: [post.description, post.category, ...post.tags].join(" ").toLowerCase(),
    })),
    projects: sortProjects(projects).map((entry) => ({
      title: entry.title,
      slug: entry.slug,
      keywords: [entry.headline, entry.category, ...entry.tags].join(" ").toLowerCase(),
    })),
  });
});
