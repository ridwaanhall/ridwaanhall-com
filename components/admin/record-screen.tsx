import "server-only";

import type { Route } from "next";
import Link from "next/link";

import { BackIcon } from "@/components/admin/admin-icons";
import { NothingHere } from "@/components/admin/nothing-here";
import { RecordForm } from "@/components/admin/record-form";
import { toClientFieldsets, toClientInlines } from "@/lib/admin/form";
import { loadInlineRows } from "@/lib/admin/inlines";
import { imageUrlMap } from "@/lib/admin/media";
import { formModelFor } from "@/lib/admin/models";
import { loadFormValues, loadReferenceOptions } from "@/lib/admin/record";
import { adminPath, type AdminEntry } from "@/lib/admin/registry";

/**
 * One record: the change form for it.
 *
 * The read-only half was never a placeholder to throw away. It renders exactly
 * what the changelist descriptor declares, so every model has a record page from
 * the moment its list exists, and a model gains editing by gaining a form
 * descriptor -- nothing in this file changes for it.
 *
 * **A module rather than a page, because two routes draw it.** A row of an
 * ordinary model is at `/admin/<model>/<id>` and a row of a sectioned
 * vocabulary is at `/admin/<section>/<tab>/<id>`, which are different route
 * files with the same content below the URL. Two copies of a form loader is
 * the shape this repository keeps catching: one of them gains a fix the other
 * does not.
 *
 * It is handed the entry and the id already resolved, and neither gates nor
 * parses. `resolveAdminRoute` is the only thing that can tell a record URL
 * from a section's tab, and it has run -- after `requireStaff()` -- in the
 * route that renders this.
 *
 * `server-only` at the head because it calls `loadFormValues` and
 * `loadReferenceOptions`: a client module that imported it by accident should
 * fail at the import rather than at the query.
 */
export async function RecordScreen({ entry, id }: { entry: AdminEntry; id: string }) {
  const recordId = id;
  const form = formModelFor(entry.key);
  const missing = (
    <NothingHere
      message={`There is no ${entry.label.toLowerCase()} with id ${id}. It may have been deleted.`}
      backLabel={entry.labelPlural}
      backHref={adminPath(entry) as Route}
    />
  );

  if (form) {
    const [values, referenceOptions] = await Promise.all([
      loadFormValues(form, recordId),
      loadReferenceOptions(form),
    ]);
    if (!values) return missing;
    const label = form.label(values);

    const inlineRows = Object.fromEntries(
      await Promise.all(
        (form.inlines ?? []).map(
          async (inline) => [inline.name, await loadInlineRows(inline, recordId)] as const,
        ),
      ),
    );

    return (
      <>
        <Crumb label={entry.labelPlural} href={adminPath(entry) as Route} />
        <Heading title={label} type={entry.label} id={recordId} />
        <RecordForm
          modelKey={entry.key}
          id={recordId}
          fieldsets={toClientFieldsets(form, referenceOptions, recordId)}
          inlines={toClientInlines(form, referenceOptions)}
          inlineRows={inlineRows}
          values={values}
          imageUrls={await imageUrlMap(form, values, inlineRows)}
          label={label}
          typeLabel={entry.label}
          canDelete={form.canDelete !== false}
          deleteWarning={form.deleteWarning}
          listHref={adminPath(entry) as Route}
        />
      </>
    );
  }

  // Unreachable: every registered screen has a form descriptor, which
  // `scripts/check-admin.mjs` asserts. Kept as a message rather than a throw so
  // a registry entry added without one is a screen that says so, not a 500.
  return <NothingHere message="That screen has not been built yet." />;
}

function Crumb({ label, href }: { label: string; href: Route }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded text-xs text-zinc-500 transition-colors hover:text-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
    >
      <BackIcon height={14} width={14} />
      {label}
    </Link>
  );
}

/**
 * The record, named.
 *
 * The key is set in code and allowed to wrap. It is a uuid -- 36 characters
 * that mean nothing to read but are the thing you copy when a harness or a
 * query needs this exact row, so it is worth being able to select cleanly and
 * not worth the width of a line of prose.
 */
function Heading({ title, type, id }: { title: string; type: string; id: string }) {
  return (
    <div>
      <h1 className="text-xl font-medium text-zinc-100">{title}</h1>
      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-zinc-500">
        {type}
        <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs break-all text-zinc-500">
          {id}
        </code>
      </p>
    </div>
  );
}
