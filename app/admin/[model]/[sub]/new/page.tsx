import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackIcon } from "@/components/admin/admin-icons";
import { RecordForm } from "@/components/admin/record-form";
import { toClientFieldsets, toClientInlines } from "@/lib/admin/form";
import { formModelFor } from "@/lib/admin/models";
import { blankFormValues, loadReferenceOptions } from "@/lib/admin/record";
import { adminPath } from "@/lib/admin/registry";
import { resolveAdminRoute } from "@/lib/admin/route";
import { requireStaff } from "@/lib/auth/staff";

/**
 * The add form for a sectioned vocabulary.
 *
 * Static, so it takes precedence over `[id]` beside it and `new` can never be
 * read as a record id -- the same reason the shallower `new` route gives.
 *
 * Only a tab route reaches this. `/admin/blog-post/<uuid>/new` resolves to a
 * record and 404s, which is right: there is nothing below a record to add.
 */
export const instant = false;

export async function generateMetadata(
  props: PageProps<"/admin/[model]/[sub]/new">,
): Promise<Metadata> {
  const { model, sub } = await props.params;
  const route = resolveAdminRoute(model, sub);
  if (!route || route.kind !== "tab") return { title: "Admin" };

  const form = formModelFor(route.entry.key);
  const offered = form !== null && form.canCreate !== false;
  return { title: offered ? `Add ${route.entry.label.toLowerCase()} · Admin` : "Admin" };
}

export default async function AdminSectionCreatePage(
  props: PageProps<"/admin/[model]/[sub]/new">,
) {
  await requireStaff();

  const { model, sub } = await props.params;
  const route = resolveAdminRoute(model, sub);
  if (!route || route.kind !== "tab") notFound();

  const { entry } = route;
  const form = formModelFor(entry.key);
  if (!form || form.canCreate === false) notFound();

  const referenceOptions = await loadReferenceOptions(form);
  const listHref = adminPath(entry) as Route;

  return (
    <div className="admin-fade space-y-5">
      <Link
        href={listHref}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-indigo-400"
      >
        <BackIcon height={14} width={14} />
        {entry.labelPlural}
      </Link>

      <div>
        <h1 className="text-xl font-medium text-zinc-100">Add {entry.label.toLowerCase()}</h1>
        <p className="mt-1 text-sm text-zinc-500">{entry.blurb}</p>
      </div>

      <RecordForm
        modelKey={entry.key}
        id={null}
        fieldsets={toClientFieldsets(form, referenceOptions)}
        inlines={toClientInlines(form, referenceOptions)}
        values={blankFormValues(form)}
        label={entry.label}
        typeLabel={entry.label}
        canDelete={false}
        listHref={listHref}
      />
    </div>
  );
}
