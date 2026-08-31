import type { Metadata } from "next";
import { Suspense } from "react";

import { ChangelistScreen } from "@/components/admin/changelist-screen";
import { ChangelistSkeleton } from "@/components/admin/changelist-skeleton";
import { NothingHere } from "@/components/admin/nothing-here";
import { RecordScreen } from "@/components/admin/record-screen";
import { RecordSkeleton } from "@/components/admin/record-skeleton";
import { SectionTabs } from "@/components/admin/section-tabs";
import { listModelFor } from "@/lib/admin/models";
import type { AdminEntry } from "@/lib/admin/registry";
import { resolveAdminRoute } from "@/lib/admin/route";
import { requireStaff } from "@/lib/auth/staff";

export async function generateMetadata({
  params,
}: {
  params: PageProps<"/admin/[model]/[sub]">["params"];
}): Promise<Metadata> {
  const { model, sub } = await params;
  const route = resolveAdminRoute(model, sub);
  if (!route) return { title: "Admin" };
  return {
    title:
      route.kind === "tab"
        ? `${route.entry.labelPlural} · ${route.section.label} · Admin`
        : `${route.entry.label} · Admin`,
  };
}

/**
 * One record's form, or one section's tab. `/admin/<a>/<b>` is both.
 *
 * `resolveAdminRoute` is what tells them apart, and it is the only thing that
 * does -- see `lib/admin/route.ts`.
 *
 * **The gate runs before the branch.** Not only before a query: the tab strip
 * names screens, and the admin index already refuses to show a non-staff
 * reader the shape of this place. `getStaffUser` is wrapped in React's
 * request memo and the layout has already called it, so this costs no second
 * query.
 *
 * Both branches then stream. The outer boundary covers the gate and the
 * params, which is why `loading.tsx` beside this file draws a record form: it
 * is the far commoner of the two, and the wrong furniture is on screen only
 * for that gap. Each branch draws its own correct stand-in below.
 */
export default function AdminSubPage(props: PageProps<"/admin/[model]/[sub]">) {
  return (
    <div className="admin-fade">
      <Suspense fallback={<RecordSkeleton />}>
        <Sub params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function Sub({
  params,
  searchParams,
}: {
  params: PageProps<"/admin/[model]/[sub]">["params"];
  searchParams: PageProps<"/admin/[model]/[sub]">["searchParams"];
}) {
  await requireStaff();

  const { model, sub } = await params;
  const route = resolveAdminRoute(model, sub);
  /*
   * Rendered, not thrown. `notFound()` inside a committed boundary resolves to
   * nothing and leaves a blank page -- the reason `NothingHere` exists.
   */
  if (!route) return <NothingHere message="No such screen." />;

  if (route.kind === "record") {
    return (
      <div className="space-y-5">
        <Suspense fallback={<RecordSkeleton />}>
          <RecordScreen entry={route.entry} id={route.id} />
        </Suspense>
      </div>
    );
  }

  const { section, entry } = route;

  return (
    <div className="space-y-4">
      <div>
        {/*
          The section's name, not the tab's. Heading the page with the tab
          would redraw the h1 on every click and make six tabs read as six
          pages that happen to share a strip; the section is the thing that
          does not change while you are here.
        */}
        <h1 className="text-xl font-medium text-zinc-100">{section.label}</h1>
        <p className="mt-1 text-sm text-zinc-400">{entry.blurb}</p>
      </div>

      <SectionTabs section={section} activeKey={entry.key} />

      <Suspense fallback={<ChangelistSkeleton heading={false} />}>
        <SectionList entry={entry} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

/**
 * The changelist under a tab.
 *
 * The query and the table are `ChangelistScreen`, the same ones the flat route
 * draws, which is the point: a section changes where a list *lives*, never what
 * it is. What stays here is the answer to a key with no list descriptor. This
 * route says so in place, under a strip that is already on screen and still
 * offers the section's other tabs; the flat route calls `notFound()`, having
 * nothing else to show. Both are deliberate, so neither moved into the shared
 * module.
 */
function SectionList({
  entry,
  searchParams,
}: {
  entry: AdminEntry;
  searchParams: PageProps<"/admin/[model]/[sub]">["searchParams"];
}) {
  const model = listModelFor(entry.key);
  if (!model) return <NothingHere message="That screen has not been built yet." />;

  return <ChangelistScreen entry={entry} model={model} searchParams={searchParams} />;
}
