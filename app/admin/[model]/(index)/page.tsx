import type { Metadata, Route } from "next";
import { notFound, redirect } from "next/navigation";

import { ChangelistScreen } from "@/components/admin/changelist-screen";
import { formModelFor, listModelFor } from "@/lib/admin/models";
import { RecordForm } from "@/components/admin/record-form";
import { toClientFieldsets, toClientInlines } from "@/lib/admin/form";
import { loadInlineRows } from "@/lib/admin/inlines";
import { imageUrlMap } from "@/lib/admin/media";
import { loadFormValues, loadReferenceOptions, singletonId } from "@/lib/admin/record";
import {
  ADMIN_ENTRIES,
  ADMIN_ENTRIES_BY_KEY,
  ADMIN_SECTIONS,
  ADMIN_SECTIONS_BY_KEY,
  adminPath,
  sectionTabs,
} from "@/lib/admin/registry";
import { can, permits } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/staff";

/**
 * One route for every changelist.
 *
 * One dynamic segment, and the registry is what fills it -- so a screen is
 * added by adding a descriptor, never by writing a page. A key that is in the
 * registry but has no descriptor 404s rather than 500s: the sidebar does not
 * link to those, but a typed URL or a stale bookmark can still arrive at one.
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
  return [
    ...ADMIN_ENTRIES.filter((entry) => !entry.section).map((entry) => ({ model: entry.key })),
    ...ADMIN_SECTIONS.map((section) => ({ model: section.key })),
  ];
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { model } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(model);
  // The same condition the page 404s on for a sectioned key, so `/admin/tag`
  // does not sit in the browser's tab and history titled "Tags" for a screen
  // that answers not-found -- see the `entry.section` check below.
  return { title: entry && !entry.section ? `${entry.labelPlural} · Admin` : "Admin" };
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

/**
 * A one-row model has no list.
 *
 * A list of one row is a hop nobody wants, so this renders that record's form
 * in place. All three such rows exist and are never created or deleted, so a
 * missing one is a broken database rather than a case to handle.
 */
async function SingletonScreen({ entryKey, canSave }: { entryKey: string; canSave: boolean }) {
  const entry = ADMIN_ENTRIES_BY_KEY.get(entryKey);
  const form = formModelFor(entryKey);
  if (!entry || !form) notFound();

  // The one row's key, which the form, its inlines and the save action all
  // need. It is a uuid, so it cannot be written down as a literal -- it has to
  // be looked up.
  const recordId = await singletonId(form);
  if (!recordId) notFound();

  const [values, referenceOptions] = await Promise.all([
    loadFormValues(form, recordId),
    loadReferenceOptions(form),
  ]);
  if (!values) notFound();

  const inlineRows = Object.fromEntries(
    await Promise.all(
      (form.inlines ?? []).map(
        async (inline) => [inline.name, await loadInlineRows(inline, recordId)] as const,
      ),
    ),
  );

  return (
    <div className="admin-fade space-y-5">
      <div>
        <h1 className="text-xl font-medium text-zinc-100">{entry.labelPlural}</h1>
        <p className="mt-1 text-sm text-zinc-400">{entry.blurb}</p>
      </div>
      <RecordForm
        modelKey={entryKey}
        id={recordId}
        fieldsets={toClientFieldsets(form, referenceOptions, recordId)}
        inlines={toClientInlines(form, referenceOptions)}
        inlineRows={inlineRows}
        values={values}
        imageUrls={await imageUrlMap(form, values, inlineRows)}
        label={form.label(values)}
        typeLabel={entry.label}
        canSave={canSave}
        canDelete={false}
        listHref="/admin"
      />
    </div>
  );
}

export default async function AdminListPage({ params, searchParams }: Params) {
  // First, and before anything is read. The layout's gate decides what a
  // rejected reader sees; this one decides whether the query runs at all --
  // see `requireStaff` for the payload leak that distinction closes.
  const actor = await requireStaff();

  const { model: key } = await params;

  /*
   * A section has no list of its own -- its first tab is the screen. The
   * redirect is a 200 whose body carries the navigation, since reading the
   * session has already made this route dynamic; that is fine here, because
   * the rail links straight to the first tab and only a typed URL or an old
   * bookmark arrives at this line.
   *
   * The first tab **this account may open**, not the first tab: the rail
   * already points here at that one, so landing on a not-found would only
   * happen to somebody who typed the section's own URL -- and sending them to
   * a screen they cannot see would be a worse answer than the one below.
   */
  const section = ADMIN_SECTIONS_BY_KEY.get(key);
  if (section) {
    const [first] = sectionTabs(section.key).filter((tab) => can(actor, tab.key, "view"));
    // `adminPath` returns a plain string built at runtime; it is the codebase's
    // one function for the job, so the cast stands in for the check `typedRoutes`
    // cannot run over a value it cannot see at compile time.
    if (first) redirect(adminPath(first) as Route);
    // Every tab refused. Not-found rather than an explanation, for the reason
    // `requirePermission` gives: a staff account is already inside, and what
    // it must not be handed is a list of the screens it is being kept out of.
    notFound();
  }

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
  // A sectioned screen lives under its section and nowhere else. The registry
  // still resolves the key, so without this `/admin/tag` keeps answering
  // beside `/admin/taxonomy/tag` -- one screen at two URLs.
  if (!entry || entry.section) notFound();
  /*
   * The permission gate, and it is here rather than one line lower for the
   * reason `requireStaff` is the page's first await: below this line the
   * changelist query runs, and a refusal after it has run is a refusal that
   * still put every row in the Flight payload. Nothing is read before this.
   */
  if (!can(actor, key, "view")) notFound();
  // A one-row model has no changelist to render; see `SingletonScreen`.
  if (entry.singleton) {
    // The *form* model, not the list one above: a singleton has no list, so
    // `model` is null here, and `change` is a question about the form.
    return (
      <SingletonScreen
        entryKey={key}
        canSave={permits(actor, key, "change", formModelFor(key))}
      />
    );
  }
  if (!model) notFound();

  return (
    <div className="admin-fade space-y-4">
      <div>
        <h1 className="text-xl font-medium text-zinc-100">{entry.labelPlural}</h1>
        <p className="mt-1 text-sm text-zinc-400">{entry.blurb}</p>
      </div>

      {/*
        The query and the table, shared with the tab route -- see
        `changelist-screen.tsx`. The heading above it is not shared: this page
        names the model, where a section's page names the section.
      */}
      <ChangelistScreen entry={entry} model={model} searchParams={searchParams} />
    </div>
  );
}
