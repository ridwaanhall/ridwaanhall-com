import type { Metadata } from "next";
import { Suspense } from "react";

import { NothingHere } from "@/components/admin/nothing-here";
import { RecordScreen } from "@/components/admin/record-screen";
import { RecordSkeleton } from "@/components/admin/record-skeleton";
import { resolveAdminRoute } from "@/lib/admin/route";
import { can } from "@/lib/auth/permissions";
import { requireStaff } from "@/lib/auth/staff";

export async function generateMetadata(
  props: PageProps<"/admin/[model]/[sub]/[id]">,
): Promise<Metadata> {
  const { model, sub } = await props.params;
  const route = resolveAdminRoute(model, sub);
  if (!route || route.kind !== "tab") return { title: "Admin" };
  return { title: `${route.entry.label} · Admin` };
}

/**
 * One row of a sectioned vocabulary.
 *
 * The tab strip is not drawn here. A form is a single row of one vocabulary;
 * the breadcrumb is what says which, and a strip offering to switch
 * vocabularies mid-edit would offer to throw the edit away.
 */
export default function AdminSectionRecordPage(
  props: PageProps<"/admin/[model]/[sub]/[id]">,
) {
  return (
    <div className="admin-fade space-y-5">
      <Suspense fallback={<RecordSkeleton />}>
        <SectionRecord params={props.params} />
      </Suspense>
    </div>
  );
}

async function SectionRecord({
  params,
}: {
  params: PageProps<"/admin/[model]/[sub]/[id]">["params"];
}) {
  const actor = await requireStaff();

  const { model, sub, id } = await params;
  const route = resolveAdminRoute(model, sub);
  if (!route || route.kind !== "tab") return <NothingHere message="No such screen." />;

  /*
   * Before `RecordScreen`, which loads the row.
   *
   * The deepest of the four record routes and the easiest to forget, because
   * the two segments above it are already gated and this one looks like it
   * inherits that. It does not: a page is not covered by another page. Without
   * this line a staff account with no grant on `tag` could open
   * `/admin/taxonomy/tag/<id>` and be sent the row in the payload, with the
   * rail correctly not offering it -- the exact shape of the leak this admin
   * was built around, one level further down.
   *
   * The same sentence a URL that names no screen gets: a staff account is
   * already inside, and what it must not be handed is a map of the screens it
   * is kept out of.
   */
  if (!can(actor, route.entry.key, "view")) return <NothingHere message="No such screen." />;

  return <RecordScreen entry={route.entry} id={id} />;
}
