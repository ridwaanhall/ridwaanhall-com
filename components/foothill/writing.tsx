"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Chips } from "@/components/foothill/controls";
import { Icon } from "@/components/foothill/icons";
import type { PostView } from "@/components/foothill/rows";
import { Empty } from "@/components/foothill/ui";

const matches = (post: PostView, q: string) =>
  [post.title, post.summary, post.category, ...post.tags].join(" ").toLowerCase().includes(q.toLowerCase());

/**
 * Every post, newest first, with a search and a filter by topic.
 *
 * `?q=` is written to the address as it changes and read back by the server
 * on arrival, so a search is a link; `serverMatches` is the server's own
 * answer for that query, which reads each body as well as the fields here.
 */
export function WritingIndex({
  posts,
  initialQuery,
  serverMatches,
}: {
  posts: PostView[];
  initialQuery: string;
  serverMatches: string[] | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
  }, [query]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    posts.forEach((post) => counts.set(post.category, (counts.get(post.category) ?? 0) + 1));
    return [...counts.entries()];
  }, [posts]);

  const fromServer = serverMatches && query === initialQuery ? new Set(serverMatches) : null;
  const rows = posts.filter(
    (post) =>
      (!category || post.category === category) &&
      (!query || (fromServer ? fromServer.has(post.slug) : matches(post, query))),
  );

  return (
    <>
      <div className="controls">
        <form role="search" className="field" action="/blog" onSubmit={(event) => event.preventDefault()}>
          <Icon name="search" />
          <input
            name="q"
            type="search"
            placeholder="Search titles, tags and topics"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search posts"
          />
        </form>
        <Chips
          id="cat"
          label="Topic"
          value={category}
          onChange={setCategory}
          items={[["", "All", posts.length], ...categories.map(([name, count]) => [name, name, count] as [string, string, number])]}
        />
      </div>
      <div className="rows">
        <AnimatePresence mode="popLayout" initial={false}>
          {rows.map((post) => (
            <motion.div
              layout
              key={post.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
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
          ))}
        </AnimatePresence>
      </div>
      {!rows.length && (
        <div style={{ marginTop: 16 }}>
          <Empty
            icon="search"
            title={query ? `No post matches “${query}”` : "No post in this topic"}
            note="Try a shorter word, or a topic like Django."
            action={
              <button
                type="button"
                className="btn ghost sm"
                onClick={() => {
                  setQuery("");
                  setCategory("");
                }}
              >
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
