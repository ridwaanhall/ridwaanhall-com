import { BlogList, ProjectGrid } from "@/components/site/content-rows";
import { Pagination } from "@/components/site/pagination";
import { ListingSkeleton } from "@/components/site/listing-skeleton";
import { SearchForm } from "@/components/site/search-form";
import { paginate } from "@/lib/api/pagination";
import type { BlogPost, Project } from "@/lib/data/content";
import { searchBlogs, searchProjects } from "@/lib/data/content";

/**
 * The request-dependent half of a listing page.
 *
 * Split out so the page around it can still be prerendered. `searchParams` is
 * request data, and under Cache Components reading it anywhere in a component
 * makes that component dynamic -- so everything that depends on `?q=` and
 * `?page=` lives here, behind one `<Suspense>` boundary, and the heading,
 * intro and featured slider are served from the static shell.
 *
 * The results still reach crawlers in the initial HTML: streaming SSR sends
 * them later in the same response, not in a follow-up request.
 */
export type ListingSearchParams = Promise<{ q?: string; page?: string }>;

/** `?q=` and `?page=`, parsed leniently -- these come from a URL bar. */
export async function readListingParams(searchParams: ListingSearchParams) {
  const raw = await searchParams;
  return {
    query: (raw.q ?? "").trim(),
    // A non-numeric page falls back to 1 rather than 404ing.
    page: Math.max(1, Number.parseInt(raw.page ?? "1", 10) || 1),
  };
}

export async function BlogResults({
  posts,
  searchParams,
}: {
  posts: BlogPost[];
  searchParams: ListingSearchParams;
}) {
  const { query, page } = await readListingParams(searchParams);
  const matching = query ? searchBlogs(posts, query) : posts;
  const paged = paginate(matching, page);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ResultCount query={query} count={paged.count} total={posts.length} noun="posts" />
        <SearchForm placeholder="Search blogs..." query={query} basePath="/blog" />
      </div>

      {paged.items.length > 0 ? <BlogList posts={paged.items} /> : <EmptyState noun="blogs" />}

      {paged.pages > 1 && (
        <div className="mt-12">
          <Pagination page={paged} basePath="/blog" query={query} />
        </div>
      )}
    </>
  );
}

export async function ProjectResults({
  projects,
  searchParams,
}: {
  /** Already in display order; searching narrows that order, never replaces it. */
  projects: Project[];
  searchParams: ListingSearchParams;
}) {
  const { query, page } = await readListingParams(searchParams);
  const matching = query ? searchProjects(projects, query) : projects;
  const paged = paginate(matching, page);

  return (
    <>
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ResultCount query={query} count={paged.count} total={projects.length} noun="projects" />
        <SearchForm placeholder="Search projects..." query={query} basePath="/projects" />
      </div>

      {paged.items.length > 0 ? (
        // The first row, not the first tile: two share it from `sm`, and
        // either can be the Largest Contentful Paint.
        <ProjectGrid projects={paged.items} eagerCount={2} />
      ) : (
        <EmptyState noun="projects" />
      )}

      {paged.pages > 1 && (
        <div className="mt-16">
          <Pagination page={paged} basePath="/projects" query={query} />
        </div>
      )}
    </>
  );
}

function ResultCount({
  query,
  count,
  total,
  noun,
}: {
  query: string;
  count: number;
  total: number;
  noun: string;
}) {
  return (
    <p className="type-meta text-zinc-500" aria-live="polite">
      {query ? (
        <>
          Showing results for <span className="text-zinc-100">&quot;{query}&quot;</span> ({count} found)
        </>
      ) : (
        <>
          {total} {noun}
        </>
      )}
    </p>
  );
}

function EmptyState({ noun }: { noun: string }) {
  return (
    <div className="py-20 text-center">
      <h2 className="type-section text-zinc-100">No {noun} found.</h2>
      <p className="mt-3 type-lead text-zinc-400">Try a different search keyword.</p>
    </div>
  );
}

/*
 * The skeleton lives in `listing-skeleton.tsx` and is re-exported here, because
 * a `loading.tsx` that imported it from this module would pull `lib/data`, and
 * with it the database client, into a fallback made of rectangles.
 */
export { ListingSkeleton };
