import type { Route } from "next";
import { Reveal } from "@/components/motion/reveal";
import { ArrowLink, CONTAINER, PageHeader } from "@/components/site/ui";

import type { LegalDocument, LegalSection } from "@/lib/data/legal";
import { longDate } from "@/lib/utils/format";
import { sanitizeRichText } from "@/lib/utils/sanitize";

/**
 * A legal document: privacy policy, terms, or anything added later.
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
  siblings: LegalDocument[];
}) {
  const others = siblings.filter((other) => other.slug !== document.slug);

  return (
    <main className={CONTAINER}>
      {/* The stored title is split into a lead and an accent, which is how it
          was coloured. It reads as one title now; the columns still describe
          the split and are left alone. */}
      <PageHeader title={`${document.title_lead} ${document.title_accent}`} lead={document.summary || undefined}>
        {document.last_updated && (
          <Reveal as="p" className="mt-6 text-sm text-zinc-500">
            Last updated {longDate(document.last_updated)}
          </Reveal>
        )}
      </PageHeader>

      <div className="max-w-3xl border-t border-zinc-800 pb-8">
        {document.sections.length > 0 ? (
          document.sections.map((section) => <Section key={section.heading} section={section} />)
        ) : (
          <p className="py-10 text-zinc-400">This document has no content yet.</p>
        )}

        {others.length > 0 && (
          <section className="border-t border-zinc-800 py-10">
            <h2 className="mb-4 text-sm text-zinc-500">Related documents</h2>
            <ul className="space-y-2">
              {others.map((other) => (
                <li key={other.slug}>
                  <ArrowLink href={other.url as Route} className="text-base text-zinc-200">
                    {other.title}
                  </ArrowLink>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}

function Section({ section }: { section: LegalSection }) {
  return (
    <Reveal as="section" className="border-t border-zinc-800 py-10 first:border-t-0">
      <h2 className="text-xl font-medium tracking-tight text-zinc-100 sm:text-2xl">{section.heading}</h2>
      <div className="mt-4 space-y-4 text-zinc-300">
        <Body body={section.body} />
        <DefinitionList items={section.items} />
      </div>

      {(section.children ?? []).map((child) => (
        <div key={child.heading} className="mt-8 space-y-3">
          <h3 className="text-lg font-medium text-zinc-100">{child.heading}</h3>
          <div className="space-y-4 text-zinc-300">
            <Body body={child.body} />
            <DefinitionList items={child.items} />
          </div>
        </div>
      ))}
    </Reveal>
  );
}

function Body({ body }: { body: string }) {
  if (!body) return null;
  return (
    <p
      className="leading-relaxed whitespace-pre-line text-base sm:text-[17px]"
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }}
    />
  );
}

/**
 * The term/description rows.
 *
 * Stored as a JSONB object, so the order is whatever Postgres `jsonb` gives
 * back -- it normalises object key order, which is exactly why the admin has no
 * key-reorder control for these.
 */
function DefinitionList({ items }: { items: Record<string, unknown>; spaced?: boolean }) {
  // A plain list is stored as an array; render it as one rather than as
  // "0", "1", "2" terms beside each line.
  if (Array.isArray(items)) {
    if (items.length === 0) return null;
    return (
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="relative pl-4 text-sm leading-relaxed text-zinc-300">
            <span aria-hidden="true" className="absolute top-[0.7em] left-0 h-px w-2 bg-zinc-600" />
            <span dangerouslySetInnerHTML={{ __html: sanitizeRichText(String(item ?? "")) }} />
          </li>
        ))}
      </ul>
    );
  }

  const entries = Object.entries(items ?? {});
  if (entries.length === 0) return null;

  return (
    <dl className="divide-y divide-zinc-900 border-y border-zinc-900">
      {entries.map(([term, description]) => (
        <div key={term} className="grid gap-1 py-3 sm:grid-cols-[12rem_1fr] sm:gap-6">
          <dt className="text-sm text-zinc-100">{term}</dt>
          <dd
            className="text-sm leading-relaxed text-zinc-400"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(String(description ?? "")) }}
          />
        </div>
      ))}
    </dl>
  );
}



