import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { ArrowUpRightIcon } from "@/components/site/ui";

/*
 * The three CV routes. Each is a redirect to wherever the profile's CV links
 * currently point (`app/cv`, `app/cv-latest`, `app/cv-copy`), so the formats
 * are stable URLs even when the documents behind them move.
 */
const FORMATS = [
  { href: "/cv", label: "PDF" },
  { href: "/cv-latest", label: "Word" },
  { href: "/cv-copy", label: "Copy CV" },
] as const;

/**
 * The CV, as one ruled line: what it is, then the three formats.
 *
 * It used to be a bordered banner with an icon tile and three outlined
 * buttons; the information was always one sentence and three links.
 */
export function CvDownload() {
  return (
    <Reveal className="mt-12 flex flex-col gap-4 border-y border-zinc-800 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-base font-medium text-zinc-100">Curriculum Vitae</p>
        <p className="mt-1 text-sm text-zinc-500">
          Access my CV in different formats. View in PDF, Word format, or get the editable template.
        </p>
      </div>
      <ul className="flex shrink-0 flex-wrap gap-x-5 gap-y-2">
        {FORMATS.map((format) => (
          <li key={format.href}>
            <Link
              href={format.href}
              className="group inline-flex items-center gap-1 rounded-sm text-sm text-zinc-300 transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              <span className="link-draw">{format.label}</span>
              <ArrowUpRightIcon className="h-3.5 w-3.5 text-zinc-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
