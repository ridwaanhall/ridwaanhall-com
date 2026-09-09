import type { Route } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/site/ui/page-header";
import { SectionHeading } from "@/components/site/ui/section";
import type { LegalDocument, LegalSection } from "@/lib/data/legal";
import { longDate, slugify } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { sanitizeRichText } from "@/lib/utils/sanitize";
import { PAGE_GUTTER } from "@/lib/ui/shapes";

/**
 * A legal document: privacy policy, terms, or anything added later.
 *
 * **It is set as a document, not as a stack of cards.** Every section used to
 * be a bordered, rounded panel, which put fifteen identical boxes down a page
 * whose content is one continuous argument -- the border said "this is one of
 * several things" about parts that are not things at all. They are clauses now:
 * numbered, ruled off from each other, and read straight down.
 *
 * **The numbers are information.** A legal document is the one kind of content
 * here that is genuinely a sequence, and it is cited by position -- "under
 * section 4" only means something if the sections are numbered. That is also
 * why each heading carries an id: a clause you can cite is a clause you can
 * link to.
 *
 * The date moved out of the first section and into the header, where it belongs
 * -- it describes the document, not clause one, and as a pill on that clause it
 * was the only gradient on the page.
 *
 * Sections nest one level. `LegalSection.save()` re-parents a grandchild onto
 * its grandparent, so the template never has to recurse and the page stays
 * readable however the rows were entered.
 */
export function LegalDocumentPage({
  document,
  siblings,
}: {
  document: LegalDocument;
  /** Every published document, for the cross-links at the foot. */
  siblings: LegalDocument[];
}) {
  const others = siblings.filter((other) => other.slug !== document.slug);

  return (
    <main className={PAGE_GUTTER}>
      <div>
        <PageHeader
          /* The stored title is split into a lead and an accent, which is how
             it was coloured. It reads as one title now; the columns still
             describe the split and are left alone. */
          title={`${document.title_lead} ${document.title_accent}`}
          lead={document.summary || undefined}
          aside={document.last_updated ? `Last updated ${longDate(document.last_updated)}` : null}
        />

        {document.sections.length > 0 ? (
          <div className="divide-y divide-zinc-800">
            {document.sections.map((section, index) => (
              <Section key={section.heading} section={section} position={index + 1} />
            ))}
          </div>
        ) : (
          <p className="text-body text-zinc-400">This document has no content yet.</p>
        )}

        {others.length > 0 && (
          <nav aria-label="Related documents" className="mt-section border-t border-zinc-800 pt-6">
            <h2 className="text-meta text-zinc-500">Related documents</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={other.url as Route}
                  className="rounded-full border border-zinc-800 px-3 py-1.5 text-meta text-zinc-300 transition-colors hover:border-zinc-700 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
                >
                  {other.title}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </main>
  );
}

/**
 * One clause.
 *
 * `first:pt-0` because the rule between clauses is drawn by the parent's
 * `divide-y`, and the first clause has nothing above it to be separated from.
 */
function Section({ section, position }: { section: LegalSection; position: number }) {
  const id = slugify(section.heading);

  return (
    <section className="toc-target py-6 first:pt-0">
      <SectionHeading id={id}>
        {/* `tabular-nums` so the numbers form a column rather than shuffling
            sideways as they gain a digit. */}
        <span className="mr-3 tabular-nums text-zinc-600">{position}</span>
        {section.heading}
      </SectionHeading>

      <Body body={section.body} />
      <DefinitionList items={section.items} spaced={Boolean(section.body)} />

      {(section.children ?? []).map((child) => (
        <div key={child.heading} className="mt-6">
          <h3 className="mb-2 text-title font-medium text-zinc-200">{child.heading}</h3>
          <Body body={child.body} />
          <DefinitionList items={child.items} spaced={Boolean(child.body)} />
        </div>
      ))}
    </section>
  );
}

/**
 * Clause prose.
 *
 * `whitespace-pre-line` is load-bearing: the bodies are written with real line
 * breaks and no `<br>`, so without it every paragraph collapses onto one line.
 */
function Body({ body }: { body: string }) {
  if (!body) return null;
  return (
    <p
      className="max-w-measure whitespace-pre-line text-body text-zinc-300"
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }}
    />
  );
}

/**
 * The term/description rows.
 *
 * A real `<dl>`, which is what they always were -- they were built from divs
 * with a tinted fill behind each row, and a filled box per row in a document
 * reads as fifteen more cards. A rule between them says the same thing quietly.
 *
 * Stored as a JSONB object, so the order is whatever Postgres `jsonb` gives
 * back -- it normalises object key order, which is exactly why the admin has no
 * key-reorder control for these.
 */
function DefinitionList({ items, spaced }: { items: Record<string, unknown>; spaced: boolean }) {
  const entries = Object.entries(items ?? {});
  if (entries.length === 0) return null;

  return (
    <dl
      className={cn(
        // Capped, and the term sits in a track of its own rather than being
        // pushed to the far side of the column. Justified apart across 1216px a
        // term and its description end up 800px from each other, and nothing
        // about the eye's travel says the two belong together.
        "max-w-4xl divide-y divide-zinc-900",
        spaced && "mt-4",
      )}
    >
      {entries.map(([term, description]) => (
        <div
          key={term}
          className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,13rem)_1fr] sm:items-baseline sm:gap-6"
        >
          <dt className="text-body font-medium text-zinc-200">{term}</dt>
          <dd
            className="text-card text-zinc-400"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(String(description ?? "")) }}
          />
        </div>
      ))}
    </dl>
  );
}
