import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BackIcon, CheckIcon, DashIcon } from "@/components/admin/admin-icons";
import { NothingHere } from "@/components/admin/nothing-here";
import { RecordForm } from "@/components/admin/record-form";
import { adminDate, adminDateTime } from "@/lib/admin/format";
import { imageUrlMap, toClientFieldsets, toClientInlines } from "@/lib/admin/form";
import { loadInlineRows } from "@/lib/admin/inlines";
import { fetchAdminRow } from "@/lib/admin/list";
import { formModelFor, listModelFor } from "@/lib/admin/models";
import { loadFormValues, loadReferenceOptions } from "@/lib/admin/record";
import { ADMIN_ENTRIES_BY_KEY } from "@/lib/admin/registry";
import { requireStaff } from "@/lib/auth/staff";

/**
 * One record: the change form where it is built, a read-only view where it is not.
 *
 * The read-only half was never a placeholder to throw away. It renders exactly
 * what the changelist descriptor declares, so every model has a record page from
 * the moment its list exists, and a model gains editing by gaining a form
 * descriptor -- nothing in this file changes for it.
 *
 * The page component is deliberately **not** `async`: it hands the `params`
 * promise down and `Record` awaits it inside the boundary, so moving between a
 * changelist and a row paints the frame at once and streams the record into it.
 * The admin's chrome is already on screen for that navigation, and the layout
 * above still blocks on `staffGate` -- a shell that showed the sidebar before
 * the gate resolved would flash the whole admin at someone not entitled to it.
 */
type Params = PageProps<"/admin/[model]/[id]">["params"];

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { model } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(model);
  return { title: entry ? `${entry.label} · Admin` : "Admin" };
}

export default function AdminDetailPage(props: PageProps<"/admin/[model]/[id]">) {
  return (
    <div className="space-y-5">
      <Suspense fallback={<RecordSkeleton />}>
        <Record params={props.params} />
      </Suspense>
    </div>
  );
}

async function Record({ params }: { params: Params }) {
  await requireStaff();

  const { model: key, id } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(key);
  /*
   * Rendered, not thrown. `notFound()` inside this boundary resolves it to
   * nothing once the shell is committed, leaving a blank page -- see the note
   * on `NothingHere`.
   */
  if (!entry) return <NothingHere message="No such model." />;

  const recordId = Number(id);
  const form = formModelFor(key);
  const missing = (
    <NothingHere
      message={`There is no ${entry.label.toLowerCase()} with id ${id}. It may have been deleted.`}
      backLabel={entry.labelPlural}
      backHref={`/admin/${entry.key}` as Route}
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
        <Crumb label={entry.labelPlural} href={`/admin/${entry.key}` as Route} />
        <Heading title={label} subtitle={`${entry.label} #${recordId}`} />
        <RecordForm
          modelKey={key}
          id={recordId}
          fieldsets={toClientFieldsets(form, referenceOptions)}
          inlines={toClientInlines(form, referenceOptions)}
          inlineRows={inlineRows}
          values={values}
          imageUrls={imageUrlMap(form, values, inlineRows)}
          label={label}
          typeLabel={entry.label}
          canDelete={form.canDelete !== false}
          deleteWarning={form.deleteWarning}
          listHref={`/admin/${entry.key}` as Route}
        />
      </>
    );
  }

  const model = listModelFor(key);
  if (!model) return <NothingHere message="That screen has not been built yet." />;

  const row = await fetchAdminRow(model, recordId);
  if (!row) return missing;

  return (
    <>
      <Crumb label={entry.labelPlural} href={`/admin/${entry.key}` as Route} />
      <Heading
        title={String(model.columns[0]?.value(row) ?? entry.label)}
        subtitle={`${entry.label} #${model.rowId(row)}`}
      />

      <p className="rounded-lg border border-indigo-900/60 bg-indigo-500/5 px-3 py-2 text-xs text-indigo-300">
        Read-only for now. This record needs fields the form layer does not carry yet — an image, a
        JSON editor or ordered inlines — so edits still go through the Django admin.
      </p>

      <dl className="divide-y divide-zinc-800 rounded-lg border border-zinc-800">
        {model.columns.map((column) => {
          const value = column.value(row);
          return (
            <div key={column.key} className="grid gap-1 px-3 py-2.5 sm:grid-cols-3 sm:gap-3">
              <dt className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                {column.label}
              </dt>
              <dd className="text-sm text-zinc-300 sm:col-span-2">
                {column.kind === "bool" ? (
                  value ? (
                    <span className="inline-flex items-center gap-1 text-green-400">
                      <CheckIcon height={14} width={14} /> Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-zinc-500">
                      <DashIcon height={14} width={14} /> No
                    </span>
                  )
                ) : value === null || value === "" ? (
                  <span className="text-zinc-600">—</span>
                ) : column.kind === "date" ? (
                  <span className="tabular-nums">{adminDate(String(value))}</span>
                ) : column.kind === "datetime" ? (
                  <span className="tabular-nums">{adminDateTime(String(value))}</span>
                ) : column.kind === "code" ? (
                  <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-400">
                    {String(value)}
                  </code>
                ) : (
                  String(value)
                )}
              </dd>
            </div>
          );
        })}
      </dl>
    </>
  );
}

/**
 * The frame, with nothing in it.
 *
 * This is prerendered and served before anything is known about who is asking,
 * so it carries no record and no account -- not even which model is being
 * opened, since that arrives with the URL.
 */
function RecordSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden="true">
      <div className="h-3 w-24 rounded bg-zinc-900" />
      <div className="space-y-2">
        <div className="h-6 w-64 rounded bg-zinc-900" />
        <div className="h-3 w-28 rounded bg-zinc-900" />
      </div>
      <div className="space-y-3 rounded-lg border border-zinc-800 px-3 py-4">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="grid gap-2 sm:grid-cols-3 sm:gap-4">
            <div className="h-3 w-20 rounded bg-zinc-900" />
            <div className="h-8 rounded bg-zinc-900 sm:col-span-2" />
          </div>
        ))}
      </div>
      <div className="h-8 w-24 rounded-full bg-zinc-900" />
    </div>
  );
}

function Crumb({ label, href }: { label: string; href: Route }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-indigo-400"
    >
      <BackIcon height={14} width={14} />
      {label}
    </Link>
  );
}

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h1 className="text-xl font-medium text-zinc-100">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
    </div>
  );
}
