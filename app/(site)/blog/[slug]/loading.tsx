import { Bar, PageSkeleton } from "@/components/foothill/skeleton";

/** A post while it loads: the centred heading, the cover, the first lines. */
export default function Loading() {
  return (
    <PageSkeleton>
      <div className="mx-auto max-w-[880px]">
        <Bar className="h-3 w-48" />
        <Bar className="mt-8 h-[clamp(2.1rem,1.4rem+3.2vw,4rem)] w-full" />
        <Bar className="mt-3 h-[clamp(2.1rem,1.4rem+3.2vw,4rem)] w-[60%]" />
        <Bar className="mt-6 h-6 w-full" />
        <Bar className="mt-2 h-6 w-[75%]" />
        <Bar className="mt-8 h-[61px] w-full" />
      </div>
      <Bar className="mx-auto mt-12 aspect-[16/9] w-full max-w-[1104px]" />
    </PageSkeleton>
  );
}
