import { BlogCard } from "@/components/site/blog-card";
import { Pagination } from "@/components/site/pagination";
import { ProjectCard } from "@/components/site/project-card";
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

/** `?q=` and `?page=`, parsed the way Django's view read them. */
export async function readListingParams(searchParams: ListingSearchParams) {
  const raw = await searchParams;
  return {
    query: (raw.q ?? "").trim(),
    // A non-numeric page falls back to 1, as Django's PageNotAnInteger branch did.
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
      <div className="mb-4 flex justify-end">
        <SearchForm placeholder="Search blogs..." query={query} basePath="/blog" />
      </div>

      <ResultCount query={query} count={paged.count} />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
        {paged.items.length > 0 ? (
          paged.items.map((post) => <BlogCard key={post.slug} blog={post} />)
        ) : (
          <EmptyState noun="blogs" />
        )}
      </div>

      {paged.pages > 1 && (
        <div className="mt-4">
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
      <div className="mb-4 flex justify-end">
        <SearchForm placeholder="Search projects..." query={query} basePath="/projects" />
      </div>

      <ResultCount query={query} count={paged.count} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {paged.items.length > 0 ? (
          paged.items.map((project) => <ProjectCard key={project.slug} project={project} />)
        ) : (
          <EmptyState noun="projects" />
        )}
      </div>

      {paged.pages > 1 && (
        <div className="mt-4">
          <Pagination page={paged} basePath="/projects" query={query} />
        </div>
      )}
    </>
  );
}

function ResultCount({ query, count }: { query: string; count: number }) {
  if (!query) return null;
  return (
    <p className="mt-1 mb-4 text-sm text-zinc-400 text-right">
      Showing results for <span className="font-semibold text-indigo-300">&quot;{query}&quot;</span>{" "}
      ({count} found)
    </p>
  );
}

function EmptyState({ noun }: { noun: string }) {
  return (
    <div className="col-span-full text-center text-zinc-400 py-12">
      <h2 className="text-xl font-semibold mb-2">No {noun} found.</h2>
      <p className="text-base">Try a different search keyword.</p>
    </div>
  );
}

/**
 * Shown while the results resolve.
 *
 * Sized to the real grid so the page does not jump when they arrive -- the
 * whole point of holding the space is that nothing below it moves.
 */
export function ListingSkeleton({ columns = 2 }: { columns?: number }) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-2 ${columns === 2 ? "lg:grid-cols-2" : ""} gap-3 sm:gap-4`}
      aria-hidden="true"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div
          key={i}
          className="rounded-xl border border-zinc-800 bg-zinc-900/40 animate-pulse"
          style={{ height: 350 }}
        />
      ))}
    </div>
  );
}
