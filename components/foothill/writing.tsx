"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PostCard } from "@/components/foothill/cards";
import { Chips, Seg } from "@/components/foothill/controls";
import { FilterBar, FilterGroup, type ActiveFilter } from "@/components/foothill/filter-bar";
import { Icon } from "@/components/foothill/icons";
import type { PostView } from "@/components/foothill/rows";
import { Empty } from "@/components/foothill/ui";
import { sortPosts, writingFiltersToSearch, type WritingFilters } from "@/lib/site/writing-filters";

const matches = (post: PostView, q: string) =>
  [post.title, post.summary, post.category, ...post.tags].join(" ").toLowerCase().includes(q.toLowerCase());

/**
 * Every post, with a search, a filter by topic, four orders and two layouts.
 *
 * The filters are written to the address as they change (with
 * `history.replaceState`, so back still means the page before) and read back
 * by the server on arrival, so a filtered list is a link. `serverMatches` is
 * the server's own answer for `?q=`, which reads each body as well as the
 * fields here.
 */
export function WritingIndex({
  posts,
  initial,
  serverMatches,
}: {
  posts: PostView[];
  initial: WritingFilters;
  serverMatches: string[] | null;
}) {
  const [filters, setFilters] = useState(initial);
  const set = (patch: Partial<WritingFilters>) => setFilters((current) => ({ ...current, ...patch }));

  useEffect(() => {
    const next = `${window.location.pathname}${writingFiltersToSearch(filters)}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", next);
  }, [filters]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => counts.set(post.category, (counts.get(post.category) ?? 0) + 1));
    return [...counts.entries()];
  }, [posts]);

  const fromServer = serverMatches && filters.q === initial.q ? new Set(serverMatches) : null;
  const rows = sortPosts(
    posts.filter(
      (post) =>
        (!filters.topic || post.category === filters.topic) &&
        (!filters.q || (fromServer ? fromServer.has(post.slug) : matches(post, filters.q))),
    ),
    filters.sort,
  );
  const clear = () => setFilters({ ...initial, q: "", topic: "", sort: filters.sort, view: filters.view });
  const active: ActiveFilter[] = filters.topic ? [{ key: "topic", label: `Topic: ${filters.topic}`, onRemove: () => set({ topic: "" }) }] : [];

  // The index groups by year when it is ordered by date, so a long list has landmarks.
  const byDate = filters.sort === "new" || filters.sort === "old";
  const items: React.ReactNode[] = [];
  let lastYear: number | undefined;
  for (const post of rows) {
    const year = post.time ? new Date(post.time).getUTCFullYear() : undefined;
    if (filters.view === "rows" && byDate && year !== lastYear) {
      lastYear = year;
      items.push(
        <motion.div layout key={`y${year}`} className="yr mono mute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {year ?? "Undated"}
        </motion.div>,
      );
    }
    items.push(
      filters.view === "grid" ? (
        <motion.div
          layout
          key={post.slug}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3 }}
        >
          <PostCard post={post} />
        </motion.div>
      ) : (
        <motion.div layout key={post.slug} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Link className="wrow" href={`/blog/${post.slug}`}>
            <span className="mono mute">{post.date}</span>
            <span>
              <span className="t">{post.title}</span>
              <span className="meta" style={{ display: "block", marginTop: 4 }}>
                {post.category} · {post.views.toLocaleString("en-US")} views
              </span>
            </span>
            <span className="meta r">{post.minutes} min read</span>
          </Link>
        </motion.div>
      ),
    );
  }

  return (
    <>
      <FilterBar
        active={active}
        onClear={() => set({ topic: "" })}
        search={
          <form role="search" className="field" action="/blog" onSubmit={(event) => event.preventDefault()}>
            <Icon name="search" />
            <input
              name="q"
              type="search"
              placeholder="Search titles, tags and topics"
              value={filters.q}
              onChange={(event) => set({ q: event.target.value })}
              aria-label="Search posts"
            />
          </form>
        }
        sort={
          <Seg
            id="writing-sort"
            label="Sort"
            value={filters.sort}
            onChange={(sort) => set({ sort })}
            items={[
              ["new", "Newest"],
              ["old", "Oldest"],
              ["az", "A to Z"],
              ["read", "Most read"],
            ]}
          />
        }
        view={
          <Seg
            id="writing-view"
            label="View"
            value={filters.view}
            onChange={(view) => set({ view })}
            items={[
              ["grid", "Grid", "grid"],
              ["rows", "Index", "list"],
            ]}
          />
        }
      >
        <FilterGroup label="Topic">
          <Chips
            id="cat"
            label="Topic"
            value={filters.topic}
            onChange={(topic) => set({ topic })}
            items={[["", "All", posts.length], ...categories.map(([name, count]) => [name, name, count] as [string, string, number])]}
          />
        </FilterGroup>
      </FilterBar>
      <LayoutGroup>
        <motion.div layout className={filters.view === "grid" ? "pgrid three" : "rows"}>
          <AnimatePresence mode="popLayout" initial={false}>
            {items}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
      {!rows.length && (
        <div style={{ marginTop: 16 }}>
          <Empty
            icon="search"
            title={filters.q ? `No post matches “${filters.q}”` : "No post in this topic"}
            note="Try a shorter word, or a topic like Python."
            action={
              <button type="button" className="btn ghost sm" onClick={clear}>
                <Icon name="x" />
                Clear search and filter
              </button>
            }
          />
        </div>
      )}
    </>
  );
}
