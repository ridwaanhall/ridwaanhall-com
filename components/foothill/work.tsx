"use client";

import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { SiteImage } from "@/components/foothill/site-image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Chips, EASE, SPRING, Seg, ToggleChip } from "@/components/foothill/controls";
import type { ProjectStatusOption } from "@/lib/data/content";
import { Brand, Icon } from "@/components/foothill/icons";
import type { ProjectView } from "@/components/foothill/rows";
import { Avail, Empty, ProjectStatus, Thumb } from "@/components/foothill/ui";
import { DEFAULT_FILTERS, filtersToSearch, type WorkFilters } from "@/lib/site/work-filters";

const BATCH = 12;

const matches = (project: ProjectView, q: string) =>
  [project.title, project.headline, project.kind, ...project.stack, ...project.tags].join(" ").toLowerCase().includes(q.toLowerCase());

/**
 * Every project, filtered and sorted where the reader stands.
 *
 * Search, the kind, the skill a project was built with, whether it can be
 * tried and whether its source is public; sorted by the order the owner
 * chose, by newest or by name; as pictures or as an index. Twelve at a time.
 *
 * The filters are written to the address as they change (with
 * `history.replaceState`, so the back button still means the page before),
 * and the server reads them back on arrival -- a filtered list is a link, and
 * it renders filtered before any script runs. `serverMatches` is the server's
 * own answer for `?q=`, which searches each description as well as the fields
 * kept here, so arriving with a query finds what the server found.
 */
export function WorkExplorer({
  projects,
  statuses,
  initial,
  serverMatches,
}: {
  projects: ProjectView[];
  statuses: ProjectStatusOption[];
  initial: WorkFilters;
  serverMatches: string[] | null;
}) {
  const [filters, setFilters] = useState(initial);
  const [shown, setShown] = useState(BATCH);
  const set = (patch: Partial<WorkFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
    if (!("view" in patch) && !("sort" in patch)) setShown(BATCH);
  };

  useEffect(() => {
    const next = `${window.location.pathname}${filtersToSearch(filters)}`;
    if (next !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", next);
  }, [filters]);

  const kinds = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => counts.set(project.kind, (counts.get(project.kind) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [projects]);

  // Every status the vocabulary has, in lifecycle order, with how many
  // projects hold it. A status with none is listed and dimmed rather than left
  // out, so the row shows what exists. Matched on the slug, never the label.
  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach((project) => counts.set(project.status, (counts.get(project.status) ?? 0) + 1));
    return counts;
  }, [projects]);

  const fromServer = serverMatches && filters.q === initial.q ? new Set(serverMatches) : null;
  let list = projects.filter(
    (project) =>
      (!filters.kind || project.kind === filters.kind) &&
      (!filters.skill || project.stack.includes(filters.skill)) &&
      (!filters.status || project.status === filters.status) &&
      (!filters.live || project.demo) &&
      (!filters.source || project.source) &&
      (!filters.q || (fromServer ? fromServer.has(project.slug) : matches(project, filters.q))),
  );
  if (filters.sort === "new") list = [...list].sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || b.updatedAt - a.updatedAt);
  if (filters.sort === "az") list = [...list].sort((a, b) => a.title.localeCompare(b.title));
  const visible = list.slice(0, shown);
  const clear = () => {
    setFilters({ ...DEFAULT_FILTERS, sort: filters.sort, view: filters.view });
    setShown(BATCH);
  };

  // The index groups by year when it is sorted by year, so a long list has landmarks.
  const items: React.ReactNode[] = [];
  let lastYear: number | null | undefined;
  for (const project of visible) {
    if (filters.view === "rows" && filters.sort === "new" && project.year !== lastYear) {
      lastYear = project.year;
      items.push(
        <motion.div layout key={`y${project.year}`} className="yr mono mute" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {project.year ?? "Undated"}
        </motion.div>,
      );
    }
    items.push(
      filters.view === "grid" ? (
        <motion.div
          layout
          key={project.slug}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.35, ease: EASE }}
        >
          <Link className="pcard" href={`/projects/${project.slug}`}>
            <Thumb src={project.image} alt={project.imageAlt} title={project.title} />
            <div style={{ display: "grid", gap: 6 }}>
              <h3 className="t3" title={project.title}>
                {project.title}
              </h3>
              <p>{project.headline}</p>
            </div>
            <div className="row-meta">
              <ProjectStatus slug={project.status} label={project.statusLabel} />
              <span>{project.kind}</span>
              {project.year && <span className="mono">{project.year}</span>}
              <Avail demo={Boolean(project.demo)} source={Boolean(project.source)} />
            </div>
          </Link>
        </motion.div>
      ) : (
        <motion.div layout key={project.slug} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
          <Link className="prow" href={`/projects/${project.slug}`}>
            <span className="mini">{project.image && <SiteImage src={project.image} alt="" width={112} height={70} />}</span>
            <span className="t">{project.title}</span>
            <span className="s">{project.headline}</span>
            <span className="side">
              <span className="k">{project.kind}</span>
              <span className="y mono mute">{project.year}</span>
              <ProjectStatus slug={project.status} label={project.statusLabel} />
            </span>
          </Link>
        </motion.div>
      ),
    );
  }

  if (!projects.length)
    return <Empty icon="grid" title="No projects published yet" note="Each project appears here with its screenshot, status, kind and year as soon as it is published." />;

  return (
    <>
      <div className="controls">
        <form
          role="search"
          className="field"
          action="/projects"
          onSubmit={(event) => event.preventDefault()}
        >
          <Icon name="search" />
          <input
            name="q"
            type="search"
            placeholder="Search by name, stack or kind"
            value={filters.q}
            onChange={(event) => set({ q: event.target.value })}
            aria-label="Search projects"
          />
        </form>
        <Chips
          id="work"
          label="Kind"
          value={filters.kind}
          onChange={(kind) => set({ kind })}
          items={[["", "All", projects.length], ...kinds.map(([kind, count]) => [kind, kind, count] as [string, string, number])]}
        />
        <Seg
          id="view"
          label="View"
          value={filters.view}
          onChange={(view) => set({ view })}
          items={[
            ["grid", "Grid", "grid"],
            ["rows", "Index", "list"],
          ]}
        />
      </div>
      <div className="controls2">
        <ToggleChip on={filters.live} onChange={(live) => set({ live })} icon={<Icon name="globe" size={14} />}>
          Live to try
        </ToggleChip>
        <ToggleChip on={filters.source} onChange={(source) => set({ source })} icon={<Brand name="github" size={13} />}>
          Has source
        </ToggleChip>
        <AnimatePresence initial={false}>
          {filters.skill && (
            <motion.button
              key="skill"
              type="button"
              className="chip on"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => set({ skill: "" })}
              aria-label={`Remove the filter for ${filters.skill}`}
            >
              <span className="bgpill" />
              <span>Built with {filters.skill}</span>
              <Icon name="x" size={13} />
            </motion.button>
          )}
        </AnimatePresence>
        <div className="status-key" role="toolbar" aria-label="Status">
          <span className="meta">Status</span>
          {[{ slug: "", label: "All" }, ...statuses].map(({ slug, label }) => {
            const count = slug ? (statusCounts.get(slug) ?? 0) : projects.length;
            const on = filters.status === slug;
            return (
              <button
                key={slug || "all"}
                type="button"
                className={`chip${on ? " on" : ""}${count === 0 && !on ? " none" : ""}`}
                aria-pressed={on}
                aria-disabled={count === 0 && !on ? true : undefined}
                onClick={() => (count === 0 && !on ? undefined : set({ status: slug }))}
                title={count === 0 ? `${label}: no project is at this stage yet` : undefined}
              >
                {on && <motion.span className="bgpill" layoutId="chip-status" transition={SPRING} />}
                <span>{label}</span>
                <span className="n">{count}</span>
              </button>
            );
          })}
        </div>
        <span className="sort">
          <span className="meta">Sort</span>
          <Seg
            id="sort"
            label="Sort"
            value={filters.sort}
            onChange={(sort) => set({ sort })}
            items={[
              ["featured", "Featured"],
              ["new", "Newest"],
              ["az", "A to Z"],
            ]}
          />
        </span>
      </div>
      <LayoutGroup>
        <motion.div layout className={filters.view === "grid" ? "pgrid three" : "rows"}>
          {/* `initial={false}`: the cards the server painted are not hidden and shown again. */}
          <AnimatePresence mode="popLayout" initial={false}>
            {items}
          </AnimatePresence>
        </motion.div>
      </LayoutGroup>
      {!list.length && (
        <Empty
          icon="search"
          title={filters.q ? `Nothing matches “${filters.q}”` : "No project fits these filters"}
          note="Try a technology, like Python or FastAPI, or loosen a filter."
          action={
            <button type="button" className="btn ghost sm" onClick={clear}>
              <Icon name="x" />
              Clear search and filters
            </button>
          }
        />
      )}
      <div style={{ display: "grid", justifyItems: "center", gap: 12, marginTop: 40 }}>
        {list.length > shown && (
          <button type="button" className="btn ghost" onClick={() => setShown(shown + BATCH)}>
            <Icon name="plus" />
            Show 12 more
          </button>
        )}
        {list.length > 0 && (
          <span className="mono mute" aria-live="polite">
            Showing {visible.length} of {list.length}
          </span>
        )}
      </div>
    </>
  );
}
