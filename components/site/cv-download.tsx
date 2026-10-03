import Link from "next/link";

import { Reveal } from "@/components/motion/reveal";
import { ButtonContent, BUTTON_SECONDARY } from "@/components/site/ui";

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
 * The CV: what it is, in a sentence, then the three formats as buttons.
 *
 * No banner and no rule around it -- it sits in the intro's own column, set
 * apart by space and by being the only row of buttons there.
 */
export function CvDownload() {
  return (
    <Reveal className="mt-14 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="type-item text-zinc-100">Curriculum vitae</p>
        <p className="mt-1 text-sm text-zinc-500">
          Access my CV in different formats. View in PDF, Word format, or get the editable template.
        </p>
      </div>
      <ul className="flex shrink-0 flex-wrap gap-2">
        {FORMATS.map((format) => (
          <li key={format.href}>
            <Link href={format.href} className={`${BUTTON_SECONDARY} h-9 px-4`}>
              <ButtonContent label={format.label} fill arrow="up-right" />
            </Link>
          </li>
        ))}
      </ul>
    </Reveal>
  );
}
