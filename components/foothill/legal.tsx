import type { Route } from "next";
import Link from "next/link";

import { EYEBROW, H1, LEAD } from "@/components/foothill/classes";
import { MAIN, MEASURE, WRAP } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/motion";
import { SectionIndex } from "@/components/foothill/section-index";
import type { LegalDocument, LegalSection } from "@/lib/data/legal";
import { longDate, slugify } from "@/lib/utils/format";
import { sanitizeRichText } from "@/lib/utils/sanitize";

/**
 * A legal document: its sections in a reading column, with a contents list
 * beside them on a wide screen. Section ids are the headings slugified, so a
 * paragraph can be linked to.
 */
export function LegalDocumentPage({ document, siblings }: { document: LegalDocument; siblings: LegalDocument[] }) {
  const others = siblings.filter((other) => other.slug !== document.slug);
  const sections = document.sections.map((section) => ({ id: slugify(section.heading), label: section.heading }));

  return (
    <main className={MAIN}>
      <div className={WRAP}>
        <header className="fh-frame max-w-[880px]">
          <h1 data-fh-split className={H1}>
            {document.title}
          </h1>
          {document.summary && (
            <p data-fh-enter className={`${LEAD} mt-7 max-w-[60ch]`}>
              {document.summary}
            </p>
          )}
          <p data-fh-enter className="mt-6 text-[14px] text-mute">
            Last updated {longDate(document.last_updated)}
          </p>
        </header>

        <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-10">
          <aside className="hidden lg:col-span-3 lg:block">
            <div className="sticky top-28">
              {sections.length > 0 && <SectionIndex sections={sections} label="Contents" />}
              {others.length > 0 && (
                <div className="mt-10">
                  <p className={EYEBROW}>Also</p>
                  <ul className="mt-3 space-y-1.5">
                    {others.map((other) => (
                      <li key={other.slug}>
                        <Link href={other.url as Route} className="fh-link text-[14px] text-ink">
                          {other.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>

          <div className={`min-w-0 lg:col-span-8 lg:col-start-5 ${MEASURE}`}>
            {document.sections.length > 0 ? (
              document.sections.map((section, index) => (
                <Section key={section.heading} section={section} number={index + 1} />
              ))
            ) : (
              <p className="text-[17px] text-mute">This document has no sections yet.</p>
            )}

            {others.length > 0 && (
              <nav aria-label="Related documents" className="mt-16 border-t border-line pt-6 lg:hidden">
                <p className={EYEBROW}>Also</p>
                <ul className="mt-3 space-y-1.5">
                  {others.map((other) => (
                    <li key={other.slug}>
                      <Link href={other.url as Route} className="fh-link text-[15px] text-ink">
                        {other.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}

// Numbered because a legal document's sections are cited by number.
function Section({ section, number }: { section: Required<LegalSection>; number: number }) {
  return (
    <section id={slugify(section.heading)} className="scroll-mt-28 border-t border-line pt-6 pb-12">
      <h2 className="flex items-baseline gap-4 text-[26px] leading-tight font-medium tracking-[-0.025em] text-ink">
        <span className="text-[16px] text-mute tabular-nums">{number}.</span>
        {section.heading}
      </h2>
      <Body body={section.body} />
      <Terms items={section.items} />
      {section.children.map((child) => (
        <div key={child.heading} className="mt-8">
          <h3 className="text-[18px] font-medium text-ink">{child.heading}</h3>
          <Body body={child.body} />
          <Terms items={child.items} />
        </div>
      ))}
    </section>
  );
}

/**
 * Section prose. `whitespace-pre-line` is load-bearing: the bodies are written
 * with real line breaks and no `<br>`, so without it every paragraph collapses
 * onto one line.
 */
function Body({ body }: { body: string }) {
  if (!body) return null;
  return (
    <p
      className="mt-4 text-[17px] leading-[1.7] whitespace-pre-line text-ink [&_a]:underline [&_a]:decoration-sulfur-mark [&_a]:underline-offset-2"
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }}
    />
  );
}

/**
 * The term/description rows. Stored as a JSONB object, so the order is the
 * one Postgres normalises keys into.
 */
function Terms({ items }: { items: Record<string, unknown> }) {
  const entries = Object.entries(items ?? {});
  if (entries.length === 0) return null;
  return (
    <dl className="mt-5 border-t border-line">
      {entries.map(([term, description]) => (
        <div key={term} className="grid gap-1 border-b border-line py-3 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-6">
          <dt className="text-[14px] font-medium text-ink">{term}</dt>
          <dd
            className="text-[15px] leading-relaxed text-mute"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(String(description ?? "")) }}
          />
        </div>
      ))}
    </dl>
  );
}
