import type { Route } from "next";
import Link from "next/link";

import { MAIN } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/motion";
import { SectionIndex } from "@/components/foothill/section-index";
import { Empty, PageHead } from "@/components/foothill/ui";
import type { LegalDocument, LegalSection } from "@/lib/data/legal";
import { longDate, slugify } from "@/lib/utils/format";
import { sanitizeRichText } from "@/lib/utils/sanitize";

/**
 * A legal document: its sections in a reading column, with the contents
 * beside them on a wide screen and pinned under the navbar on a phone.
 * Section ids are the headings slugified, so a paragraph can be linked to,
 * and numbered, because a legal document's sections are cited by number.
 */
export function LegalDocumentPage({ document, siblings }: { document: LegalDocument; siblings: LegalDocument[] }) {
  const others = siblings.filter((other) => other.slug !== document.slug);
  const sections = document.sections.map((section) => ({ id: slugify(section.heading), label: section.heading }));

  return (
    <main className={MAIN}>
      <div>
        <PageHead
          title={document.title}
          lead={document.summary || undefined}
          markdown={document.url}
          facts={[
            ["Updated", longDate(document.last_updated)],
            ["Sections", document.sections.length],
            ...others.slice(0, 1).map(
              (other) =>
                [
                  "Also",
                  <Link key={other.slug} className="ul" href={other.url as Route}>
                    {other.title}
                  </Link>,
                ] as [string, React.ReactNode],
            ),
          ]}
        />
        <div className="wrap about" style={{ paddingBottom: 80 }}>
          {sections.length > 0 ? <SectionIndex sections={sections} /> : <div />}
          <div className="article legal">
            {document.sections.length > 0 ? (
              document.sections.map((section, index) => <Section key={section.heading} section={section} number={index + 1} />)
            ) : (
              <Empty small icon="file" title="This document has no sections yet" note="Its sections appear here as they are written." />
            )}
          </div>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}

function Section({ section, number }: { section: Required<LegalSection>; number: number }) {
  return (
    <section id={slugify(section.heading)} className="legal-sec">
      <h2>
        <span className="mono mute">{number}.</span> {section.heading}
      </h2>
      <Body body={section.body} />
      <Terms items={section.items} />
      {section.children.map((child) => (
        <div key={child.heading} className="legal-sub">
          <h3>{child.heading}</h3>
          <Body body={child.body} />
          <Terms items={child.items} />
        </div>
      ))}
    </section>
  );
}

/**
 * Section prose. `white-space: pre-line` is load-bearing: the bodies are
 * written with real line breaks and no `<br>`, so without it every paragraph
 * collapses onto one line.
 */
function Body({ body }: { body: string }) {
  if (!body) return null;
  return <p style={{ whiteSpace: "pre-line" }} dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }} />;
}

/**
 * The term and definition rows. Stored as a JSONB object, so the order is the
 * one Postgres normalises keys into.
 */
function Terms({ items }: { items: Record<string, unknown> }) {
  const entries = Object.entries(items ?? {});
  if (entries.length === 0) return null;
  return (
    <dl className="terms">
      {entries.map(([term, description]) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd dangerouslySetInnerHTML={{ __html: sanitizeRichText(String(description ?? "")) }} />
        </div>
      ))}
    </dl>
  );
}
