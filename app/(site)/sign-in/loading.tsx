import { Bar, PageSkeleton } from "@/components/foothill/skeleton";

/** Sign-in while it loads: one narrow column. */
export default function Loading() {
  return (
    <PageSkeleton>
      <div className="mx-auto max-w-[440px] py-8 md:py-16">
        <Bar className="h-5 w-9" />
        <Bar className="mt-10 h-3 w-16" />
        <Bar className="mt-4 h-12 w-[85%]" />
        <Bar className="mt-5 h-4 w-full" />
        <Bar className="mt-2 h-4 w-[70%]" />
        <Bar className="mt-10 h-12 w-full rounded-full" />
        <Bar className="mt-2 h-12 w-full rounded-full" />
      </div>
    </PageSkeleton>
  );
}
