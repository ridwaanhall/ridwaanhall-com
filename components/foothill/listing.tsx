import { PostList } from "@/components/foothill/post-list";
import { Pagination } from "@/components/foothill/pagination";
import { postRow, workRow } from "@/components/foothill/rows";
import { SearchForm } from "@/components/foothill/search-form";
import { Bar, RowsSkeleton } from "@/components/foothill/skeleton";
import { WorkIndex } from "@/components/foothill/work-index";
import { paginate } from "@/lib/api/pagination";
import type { BlogPost, Project } from "@/lib/data/content";
import { searchBlogs, searchProjects } from "@/lib/data/content";
import { groupBy, yearOf } from "@/lib/site/display";
import { readListingParams, type ListingSearchParams } from "@/lib/site/listing";

function Summary({ query, start, end, count, noun }: { query: string; start: number; end: number; count: number; noun: string }) {
  return (
    <p className="fh-mono mt-6 text-[12px] text-mute" aria-live="polite">
      {count === 0
        ? `Nothing matches “${query}”.`
        : query
          ? `${count} ${noun} matching “${query}” · ${start}–${end}`
          : `${start}–${end} of ${count} ${noun}`}
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
  const { query, page } = await readListingParams(searchParams);
  const matches = query ? searchProjects(projects, query) : projects;
  const result = paginate(matches, page);
  const start = (result.page - 1) * 10 + 1;

  return (
    <div>
      <SearchForm basePath="/projects" query={query} placeholder="Search work by name, stack or kind" />
      <Summary query={query} start={start} end={start + result.items.length - 1} count={result.count} noun="projects" />
      {result.items.length > 0 ? (
        <div className="mt-4">
          <WorkIndex rows={result.items.map(workRow)} />
        </div>
      ) : (
        <Empty basePath="/projects" />
      )}
      <Pagination result={result} basePath="/projects" query={query} />
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
  const { query, page } = await readListingParams(searchParams);
  const matches = query ? searchBlogs(posts, query) : posts;
  const result = paginate(matches, page);
  const start = (result.page - 1) * 10 + 1;

  return (
    <div>
      <SearchForm basePath="/blog" query={query} placeholder="Search writing by title, topic or tag" />
      <Summary query={query} start={start} end={start + result.items.length - 1} count={result.count} noun="posts" />
      {result.items.length > 0 ? (
        <div className="mt-4 space-y-12">
          {groupBy(result.items, (post) => yearOf(post.created_at)).map(([year, list]) => (
            <section key={year ?? "undated"} aria-label={year ? `Posts from ${year}` : "Undated posts"}>
              <h3 className="text-[clamp(1.75rem,1.4rem+1.6vw,2.5rem)] font-medium tracking-[-0.03em] text-mute tabular-nums">
                {year ?? "Undated"}
              </h3>
              <PostList posts={list.map(postRow)} dateStyle="day" className="mt-3" />
            </section>
          ))}
        </div>
      ) : (
        <Empty basePath="/blog" />
      )}
      <Pagination result={result} basePath="/blog" query={query} />
    </div>
  );
}

function Empty({ basePath }: { basePath: string }) {
  return (
    <p className="mt-10 border-t border-line pt-8 text-[17px] text-mute">
      Try a shorter word, or{" "}
      <a href={basePath} className="fh-link text-ink">
        see everything
      </a>
      .
    </p>
  );
}

/** Holds the results' place while `searchParams` is read. */
export function ResultsSkeleton({ rowHeight }: { rowHeight: number }) {
  return (
    <div role="status" aria-busy="true" className="skeleton-pulse">
      <span className="sr-only">Loading…</span>
      <div aria-hidden="true">
        <Bar className="h-12 w-full" />
        <Bar className="mt-6 h-3 w-40" />
        <RowsSkeleton count={10} height={rowHeight} className="mt-4" />
      </div>
    </div>
  );
}
