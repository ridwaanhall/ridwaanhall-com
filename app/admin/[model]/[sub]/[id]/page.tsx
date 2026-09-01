import type { Metadata } from "next";
import { Suspense } from "react";

import { NothingHere } from "@/components/admin/nothing-here";
import { RecordScreen } from "@/components/admin/record-screen";
import { RecordSkeleton } from "@/components/admin/record-skeleton";
import { resolveAdminRoute } from "@/lib/admin/route";
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
  await requireStaff();

  const { model, sub, id } = await params;
  const route = resolveAdminRoute(model, sub);
  if (!route || route.kind !== "tab") return <NothingHere message="No such screen." />;

  return <RecordScreen entry={route.entry} id={id} />;
}
