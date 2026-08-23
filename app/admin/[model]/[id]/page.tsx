import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { BackIcon } from "@/components/admin/admin-icons";
import { NothingHere } from "@/components/admin/nothing-here";
import { RecordForm } from "@/components/admin/record-form";
import { RecordSkeleton } from "@/components/admin/record-skeleton";
import { imageUrlMap, toClientFieldsets, toClientInlines } from "@/lib/admin/form";
import { loadInlineRows } from "@/lib/admin/inlines";
import { formModelFor } from "@/lib/admin/models";
import { loadFormValues, loadReferenceOptions } from "@/lib/admin/record";
import { ADMIN_ENTRIES_BY_KEY } from "@/lib/admin/registry";
import { requireStaff } from "@/lib/auth/staff";

/**
 * One record: the change form for it.
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
    <div className="admin-fade space-y-5">
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

  const recordId = id;
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

  // Unreachable: every registered screen has a form descriptor, which
  // `scripts/check-admin.mjs` asserts. Kept as a message rather than a throw so
  // a registry entry added without one is a screen that says so, not a 500.
  return <NothingHere message="That screen has not been built yet." />;
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
