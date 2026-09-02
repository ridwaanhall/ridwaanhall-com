import "server-only";

import { Changelist } from "@/components/admin/changelist";
import {
  distinctChoices,
  fetchAdminList,
  needsLookup,
  readListParams,
  relatedChoices,
  type AdminListModel,
  type FilterChoice,
} from "@/lib/admin/list";
import { formModelFor } from "@/lib/admin/models";
import type { AdminEntry } from "@/lib/admin/registry";
import { permits } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/staff";

/**
 * One changelist: the query behind it, and the table.
 *
 * **A module rather than a page, because two routes draw it.** An ordinary
 * model's list is at `/admin/<model>` and a sectioned vocabulary's is at
 * `/admin/<section>/<tab>` -- two route files with the same query below the
 * URL. Two copies of a list loader is the shape this repository keeps
 * catching, the same one that put `RecordScreen` in `record-screen.tsx`: one
 * of them gains a fix the other does not, and the fan-out below is precisely
 * the kind of thing that gets fixed once.
 *
 * It is given the list model rather than the key, because the two routes answer
 * a missing one differently and both answers are deliberate: the flat route
 * calls `notFound()`, the tab route renders `NothingHere` under a strip that is
 * already on screen. That branch stays at each route.
 *
 * So does the heading. A flat page names the model; a tab page names its
 * *section* and draws the strip under it. Only the table is common, which is
 * the whole claim a section makes -- it changes where a list lives, never what
 * it is.
 *
 * `server-only`, because `fetchAdminList` and the lookup queries are.
 */
export async function ChangelistScreen<Row>({
  entry,
  model,
  searchParams,
}: {
  entry: AdminEntry;
  model: AdminListModel<Row>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const form = formModelFor(entry.key);
  const listParams = readListParams(model, await searchParams);
  // Free: memoised per request, and the route above has already asked. The
  // `view` check happened there; this is only about the Add button.
  const actor = await requireStaff();

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
    <Changelist
      entry={entry}
      model={model}
      params={listParams}
      page={page}
      filterChoices={filterChoices}
      /*
        The descriptor's answer and this account's, together. A model with no
        form cannot create; one whose descriptor refuses has the reason recorded
        there; and one whose `canCreate` is `"superuser"` is offered to exactly
        one role -- which `!== false` would have read as "everybody", since it
        is a truthy string. `permits` is the only reader of that flag.
      */
      canCreate={permits(actor, entry.key, "add", form)}
    />
  );
}
