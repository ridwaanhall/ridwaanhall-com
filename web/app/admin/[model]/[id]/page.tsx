import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackIcon, CheckIcon, DashIcon } from "@/components/admin/admin-icons";
import { RecordForm } from "@/components/admin/record-form";
import { adminDate, adminDateTime } from "@/lib/admin/format";
import { fetchAdminRow } from "@/lib/admin/list";
import { toClientFieldsets } from "@/lib/admin/form";
import { formModelFor, listModelFor } from "@/lib/admin/models";
import { loadFormValues } from "@/lib/admin/record";
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
 * Every path through this page starts by reading the session, so there is no
 * shell worth prerendering. This route keeps one anyway: `generateStaticParams`
 * is what removes it, and `cacheComponents` rejects one that returns nothing to
 * prerender, which is exactly the case here since the ids are whatever rows
 * exist. The consequence is that a record that does not exist answers with the
 * not-found page under an HTTP **200**; see the note on `notFound()` in the
 * changelist beside this file for why that is accepted rather than chased.
 */
type Params = { params: Promise<{ model: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { model } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(model);
  return { title: entry ? `${entry.label} · Admin` : "Admin" };
}

export default async function AdminDetailPage({ params }: Params) {
  await requireStaff();

  const { model: key, id } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(key);
  if (!entry) notFound();

  const recordId = Number(id);
  const form = formModelFor(key);

  if (form) {
    const values = await loadFormValues(form, recordId);
    if (!values) notFound();
    const label = form.label(values);

    return (
      <div className="max-w-3xl space-y-5">
        <Crumb label={entry.labelPlural} href={`/admin/${entry.key}` as Route} />
        <Heading title={label} subtitle={`${entry.label} #${recordId}`} />
        <RecordForm
          modelKey={key}
          id={recordId}
          fieldsets={toClientFieldsets(form)}
          values={values}
          label={label}
          typeLabel={entry.label}
          canDelete={form.canDelete !== false}
          deleteWarning={form.deleteWarning}
          listHref={`/admin/${entry.key}` as Route}
        />
      </div>
    );
  }

  const model = listModelFor(key);
  if (!model) notFound();

  const row = await fetchAdminRow(model, recordId);
  if (!row) notFound();

  return (
    <div className="max-w-3xl space-y-5">
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
