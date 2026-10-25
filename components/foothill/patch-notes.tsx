import { MAIN } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/motion";
import { SectionIndex } from "@/components/foothill/section-index";
import { Empty, PageHead, Tag } from "@/components/foothill/ui";
import { commitUrl, releaseUrl, type PatchNote } from "@/lib/data/patch-notes";
import { KIND_LABEL, groupByKind } from "@/lib/patch-notes/commits";
import { longDate } from "@/lib/utils/format";

/** A version as an anchor: "4.1.0" becomes `v4-1-0`, which a URL fragment can hold. */
export const releaseId = (version: string) => `v${version.replace(/\./g, "-")}`;

/**
 * The release history: one section per version, newest first, with the
 * versions listed beside them on a wide screen. Each section's lines are
 * grouped by kind in a fixed order -- breaking first, housekeeping last --
 * under plain headings, so nothing here is told apart by colour.
 */
export function PatchNotesPage({ notes }: { notes: PatchNote[] }) {
  const [latest] = notes;
  const sections = notes.map((note) => ({ id: releaseId(note.version), label: `v${note.version}` }));

  return (
    <main className={MAIN}>
      <div>
        <PageHead
          title="Patch notes"
          lead="What changed on this site, release by release. Every push to main becomes one."
          markdown="/patch-notes"
          facts={[
            ["Latest", latest ? `v${latest.version}` : "None yet"],
            ["Released", latest ? longDate(latest.released_at) : "—"],
            ["Releases", notes.length],
          ]}
        />
        <div className="wrap about" style={{ paddingBottom: 80 }}>
          {sections.length > 0 ? <SectionIndex sections={sections} /> : <div />}
          <div className="article legal">
            {notes.length > 0 ? (
              notes.map((note, index) => <Release key={note.version} note={note} latest={index === 0} />)
            ) : (
              <Empty small icon="file" title="No releases yet" note="The next push to main is the first." />
            )}
          </div>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}

function Release({ note, latest }: { note: PatchNote; latest: boolean }) {
  return (
    <section id={releaseId(note.version)} className="legal-sec">
      <h2>
        <span className="mono mute">v{note.version}</span> {note.title || `Release ${note.version}`}
      </h2>
      <p className="meta">
        {latest ? <Tag kind="solid">Latest</Tag> : null} {longDate(note.released_at)}
        {" · "}
        <a className="ul" href={releaseUrl(note.version)} rel="noopener noreferrer" target="_blank">
          GitHub release
        </a>
      </p>
      {note.summary ? <p style={{ whiteSpace: "pre-line" }}>{note.summary}</p> : null}
      {groupByKind(note.entries).map(([kind, entries]) => (
        <div key={kind} className="legal-sub">
          <h3>{KIND_LABEL[kind]}</h3>
          <ul>
            {entries.map((entry, i) => (
              <li key={`${entry.sha}-${i}`}>
                {entry.scope ? <span className="mono mute">{entry.scope}: </span> : null}
                {entry.body}
                {entry.sha ? (
                  <>
                    {" "}
                    <a className="mono mute" href={commitUrl(entry.sha)} rel="noopener noreferrer" target="_blank">
                      {entry.sha.slice(0, 7)}
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
