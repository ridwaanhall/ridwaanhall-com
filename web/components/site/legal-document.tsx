import type { Route } from "next";
import Link from "next/link";

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
  /** Every published document, for the cross-links at the foot. */
  siblings: LegalDocument[];
}) {
  const others = siblings.filter((other) => other.slug !== document.slug);

  return (
    <>
      <main className="px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-medium mb-2 tracking-tight">
                  {document.title_lead} <span className="text-indigo-400">{document.title_accent}</span>
                </h1>
                {document.summary && (
                  <p className="mt-1 sm:mt-2 text-base sm:text-lg leading-relaxed">
                    {document.summary}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {document.sections.length > 0 ? (
              document.sections.map((section, index) => (
                <Section
                  key={section.heading}
                  section={section}
                  // The "last updated" pill sits on the first section only.
                  lastUpdated={index === 0 ? document.last_updated : null}
                />
              ))
            ) : (
              <div className="border border-zinc-700 rounded-lg p-4">
                <p className="text-zinc-400">This document has no content yet.</p>
              </div>
            )}

            {others.length > 0 && (
              <div className="border border-zinc-700 rounded-lg p-4">
                <h2 className="text-base sm:text-lg md:text-xl font-medium text-zinc-300 mb-3 flex items-center">
                  <LinkIcon />
                  Related documents
                </h2>
                <div className="flex flex-wrap gap-2">
                  {others.map((other) => (
                    <Link
                      key={other.slug}
                      href={other.url as Route}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/40 px-3 py-2 text-sm text-zinc-200 hover:border-indigo-400 hover:bg-zinc-800 transition-all duration-300"
                    >
                      {other.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

function Section({
  section,
  lastUpdated,
}: {
  section: LegalSection;
  lastUpdated: Date | null;
}) {
  return (
    <div className="border border-zinc-700 rounded-lg p-4">
      <div className="flex flex-wrap items-start justify-between w-full gap-2 mb-3">
        <h2 className="text-base sm:text-lg md:text-xl font-medium text-zinc-300 break-words flex-1 flex items-center">
          <DocumentIcon />
          {section.heading}
        </h2>

        {lastUpdated && (
          <span className="inline-flex flex-shrink-0 items-center text-xs font-medium bg-gradient-to-r from-indigo-900/30 to-zinc-900/30 px-2 py-1 rounded-full border border-zinc-700 whitespace-nowrap">
            <ClockIcon />
            <span>{longDate(lastUpdated)}</span>
          </span>
        )}
      </div>

      <Body body={section.body} />
      <DefinitionList items={section.items} spaced={Boolean(section.body)} />

      {(section.children ?? []).map((child) => (
        <div key={child.heading} className="mt-4 space-y-2">
          <h3 className="text-lg font-medium text-indigo-400">{child.heading}</h3>
          <Body body={child.body} />
          <DefinitionList items={child.items} spaced={false} />
        </div>
      ))}
    </div>
  );
}

/**
 * Section prose.
 *
 * `whitespace-pre-line` is load-bearing: the bodies are written with real line
 * breaks and no `<br>`, so without it every paragraph collapses onto one line.
 */
function Body({ body }: { body: string }) {
  if (!body) return null;
  return (
    <p
      className="leading-relaxed whitespace-pre-line"
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
function DefinitionList({ items, spaced }: { items: Record<string, unknown>; spaced: boolean }) {
  const entries = Object.entries(items ?? {});
  if (entries.length === 0) return null;

  return (
    <div className={`space-y-2 ${spaced ? "mt-3" : ""}`}>
      {entries.map(([term, description]) => (
        <div
          key={term}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 p-2 bg-zinc-800/30 rounded"
        >
          <span className="font-medium">{term}</span>
          <span
            className="text-sm text-zinc-400 sm:text-right sm:max-w-2xl"
            dangerouslySetInnerHTML={{ __html: sanitizeRichText(String(description ?? "")) }}
          />
        </div>
      ))}
    </div>
  );
}

function DocumentIcon() {
  return (
    <svg
      className="w-5 h-5 mr-3 flex-shrink-0 text-indigo-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      className="w-5 h-5 mr-3 flex-shrink-0 text-indigo-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}
