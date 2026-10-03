import { CardGrid } from "@/components/foothill/cards";
import { postCard, projectCard } from "@/components/foothill/rows";
import { SearchForm } from "@/components/foothill/search-form";
import type { BlogPost, Project } from "@/lib/data/content";
import { searchBlogs, searchProjects } from "@/lib/data/content";
import { readListingParams, type ListingSearchParams } from "@/lib/site/listing";

/*
 * A listing's results: the search box, a sentence saying what matched, and
 * the cards. Searching happens here, on the server, against the whole list;
 * the grid then reveals the matches a batch at a time as the reader scrolls.
 */

function Summary({ query, count, noun }: { query: string; count: number; noun: string }) {
  if (!query) return null;
  return (
    <p className="mt-5 text-[15px] text-mute" aria-live="polite">
      {count === 0 ? (
        <>Nothing matches &ldquo;{query}&rdquo;.</>
      ) : (
        <>
          {count} {count === 1 ? noun.replace(/s$/, "") : noun} matching{" "}
          <span className="text-ink">&ldquo;{query}&rdquo;</span>
        </>
      )}
    </p>
  );
}

function Empty({ basePath }: { basePath: string }) {
  return (
    <p className="mt-10 text-[17px] text-mute">
      Try a shorter word, or{" "}
      <a href={basePath} className="fh-link text-ink">
        see everything
      </a>
      .
    </p>
  );
}

export async function ProjectResults({
  projects,
  searchParams,
}: {
  projects: Project[];
  searchParams: ListingSearchParams;
}) {
  const { query } = await readListingParams(searchParams);
  const matches = query ? searchProjects(projects, query) : projects;

  return (
    <div>
      <SearchForm basePath="/projects" query={query} placeholder="Search by name, stack or kind" />
      <Summary query={query} count={matches.length} noun="projects" />
      {matches.length > 0 ? (
        <CardGrid cards={matches.map(projectCard)} noun="projects" eager={2} className="mt-14" />
      ) : (
        <Empty basePath="/projects" />
      )}
    </div>
  );
}

export async function BlogResults({
  posts,
  searchParams,
}: {
  posts: BlogPost[];
  searchParams: ListingSearchParams;
}) {
  const { query } = await readListingParams(searchParams);
  const matches = query ? searchBlogs(posts, query) : posts;

  return (
    <div>
      <SearchForm basePath="/blog" query={query} placeholder="Search by title, topic or tag" />
      <Summary query={query} count={matches.length} noun="posts" />
      {matches.length > 0 ? (
        <CardGrid cards={matches.map(postCard)} noun="posts" className="mt-14" />
      ) : (
        <Empty basePath="/blog" />
      )}
    </div>
  );
}
