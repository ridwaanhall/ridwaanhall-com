import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Changelist } from "@/components/admin/changelist";
import {
  distinctChoices,
  fetchAdminList,
  needsLookup,
  readListParams,
  relatedChoices,
  type FilterChoice,
} from "@/lib/admin/list";
import { listModelFor } from "@/lib/admin/models";
import { ADMIN_ENTRIES, ADMIN_ENTRIES_BY_KEY } from "@/lib/admin/registry";
import { requireStaff } from "@/lib/auth/staff";

/**
 * One route for every changelist.
 *
 * Django generated its changelist URLs from the registry too; the difference is
 * only that this is a single dynamic segment rather than `<app>/<model>`. A key
 * that is in the registry but has no descriptor yet 404s rather than 500s --
 * the sidebar does not link to those, but a typed URL or a stale bookmark can
 * still arrive at one.
 */
type Params = { params: Promise<{ model: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * The keys this route answers.
 *
 * The set is fixed and known -- it is the registry -- and declaring it is what
 * takes this route from a partially-prerendered shell to fully dynamic, which is
 * the honest shape for a page whose every path starts by reading the session.
 *
 * It does **not** restore a 404 status for an unknown key, and nothing here can:
 * see the note on `notFound()` below. `dynamicParams = false` would express the
 * intent directly and is rejected outright under `cacheComponents`.
 */
export function generateStaticParams() {
  return ADMIN_ENTRIES.filter((entry) => entry.ready).map((entry) => ({ model: entry.key }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { model } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(model);
  return { title: entry ? `${entry.labelPlural} · Admin` : "Admin" };
}

/**
 * Never prerendered, for the same reason as the layout -- and for one more.
 *
 * With a prerendered shell the response status is committed before the dynamic
 * part runs, so `notFound()` streams a not-found body under an HTTP **200**.
 * Measured on the production build: `/admin/nonsense`, an unbuilt screen and a
 * record that does not exist all answered 200 until this line was added. The
 * page cannot usefully be prerendered anyway, since every path through it starts
 * by reading the session.
 */
export const instant = false;

export default async function AdminListPage({ params, searchParams }: Params) {
  // First, and before anything is read. The layout's gate decides what a
  // rejected reader sees; this one decides whether the query runs at all --
  // see `requireStaff` for the payload leak that distinction closes.
  await requireStaff();

  const { model: key } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(key);
  const model = listModelFor(key);
  /*
   * Renders the not-found page, under an HTTP **200** on the production build.
   * The status is committed as soon as the route is known to be dynamic, and
   * `requireStaff()` above -- reading the session cookie -- is what makes it so,
   * long before this line runs.
   *
   * Reordering would fix the status and is deliberately not done: the gate goes
   * first, or a rejected reader's request starts doing work. Nothing consumes
   * this status either, since the admin is gated, `noindex` and disallowed in
   * `robots.txt`, so what a person sees is the whole of what it costs.
   */
  if (!entry || !model) notFound();

  const listParams = readListParams(model, await searchParams);

  // Filters that read their vocabulary from the data need a query each -- the
  // values present for a `"distinct"` filter, the referenced rows for a foreign
  // key. They are independent of the page query and of each other, so they all
  // go at once rather than in sequence, the same way the public data layer fans
  // out with `Promise.all`.
  const lookups = (model.filters ?? []).filter(needsLookup);

  const [page, ...resolved] = await Promise.all([
    fetchAdminList(model, listParams),
    ...lookups.map((filter) =>
      filter.choices === "distinct"
        ? distinctChoices(model.from, filter.column)
        : relatedChoices(model.from, filter.column, filter.choices),
    ),
  ]);

  const filterChoices: Record<string, FilterChoice[]> = {};
  lookups.forEach((filter, index) => {
    filterChoices[filter.key] = resolved[index] ?? [];
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-medium text-zinc-100">{entry.labelPlural}</h1>
        <p className="mt-1 text-sm text-zinc-400">{entry.blurb}</p>
      </div>

      <Changelist
        entry={entry}
        model={model}
        params={listParams}
        page={page}
        filterChoices={filterChoices}
      />
    </div>
  );
}
