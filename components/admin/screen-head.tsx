import { TITLE } from "@/components/admin/control-classes";

/**
 * The top of every admin screen: its title, a line saying what it holds, and
 * whatever identifies the record, over a hairline.
 *
 * The public site's `PageHead` at the admin's scale -- the same display face
 * and the same rule underneath instead of a box -- and the one definition of
 * it, where eight screens each wrote a title and a paragraph of their own.
 */
export function ScreenHead({
  title,
  lead,
  meta,
}: {
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** A smaller line under the lead: a record's type and key, a count. */
  meta?: React.ReactNode;
}) {
  return (
    <header className="border-b border-zinc-800 pb-7">
      <h1 className={TITLE}>{title}</h1>
      {lead && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-zinc-400">{lead}</p>}
      {meta && <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-zinc-500">{meta}</div>}
    </header>
  );
}

/** A database key shown under a title: selectable, quiet, never wrapped mid-word. */
export function KeyChip({ children }: { children: React.ReactNode }) {
  return <code className="fh-mono rounded-md bg-zinc-900 px-1.5 py-0.5 text-[12px] break-all text-zinc-500">{children}</code>;
}
