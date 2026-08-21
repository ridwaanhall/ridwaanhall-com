import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackIcon, CheckIcon, DashIcon } from "@/components/admin/admin-icons";
import { adminDate, adminDateTime } from "@/lib/admin/format";
import { fetchAdminRow } from "@/lib/admin/list";
import { listModelFor } from "@/lib/admin/models";
import { ADMIN_ENTRIES_BY_KEY } from "@/lib/admin/registry";
import { requireStaff } from "@/lib/auth/staff";

/**
 * A record, read-only.
 *
 * **This is the change form's shell, not the change form.** Editing needs the
 * typed forms, the ordered inlines, the five JSON editors, the image upload and
 * the Tiptap body -- the rest of phase 3 -- and until those exist a row that
 * cannot be opened makes a changelist half a tool. What it shows is exactly
 * what the descriptor declares, so it costs no per-model work and gains none of
 * it to throw away: the fields land in this frame when they are built.
 */
type Params = { params: Promise<{ model: string; id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { model } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(model);
  return { title: entry ? `${entry.label} · Admin` : "Admin" };
}

/**
 * Never prerendered, for the same reason as the layout -- and for one more.
 *
 * Every path through this page starts by reading the session, so there is no
 * shell worth prerendering. This route keeps one anyway -- `generateStaticParams`
 * is what removes it, and `cacheComponents` rejects one that returns nothing to
 * prerender, which is exactly the case here since the ids are whatever rows
 * exist. The consequence is that a record that does not exist answers with the
 * not-found page under an HTTP **200**; see the note on `notFound()` in the
 * changelist beside this file for why that is accepted rather than chased.
 */
export const instant = false;

export default async function AdminDetailPage({ params }: Params) {
  await requireStaff();

  const { model: key, id } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(key);
  const model = listModelFor(key);
  if (!entry || !model) notFound();

  const row = await fetchAdminRow(model, Number(id));
  if (!row) notFound();

  const title = String(model.columns[0]?.value(row) ?? entry.label);

  return (
    <div className="max-w-3xl space-y-5">
      <Link
        href={`/admin/${entry.key}` as Route}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-indigo-400"
      >
        <BackIcon height={14} width={14} />
        {entry.labelPlural}
      </Link>

      <div>
        <h1 className="text-xl font-medium text-zinc-100">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {entry.label} #{model.rowId(row)}
        </p>
      </div>

      <p className="rounded-lg border border-indigo-900/60 bg-indigo-500/5 px-3 py-2 text-xs text-indigo-300">
        Read-only for now. The editable form, its inlines and the JSON editors are the next part of
        the port; until then, edits still go through the Django admin.
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
