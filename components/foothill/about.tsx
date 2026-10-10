"use client";

import { AnimatePresence, motion } from "motion/react";
import type { Route } from "next";
import { SiteImage } from "@/components/foothill/site-image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ActionButton, Chips, Disclosure, EASE } from "@/components/foothill/controls";
import { Icon } from "@/components/foothill/icons";
import { Empty, Logo, SkillGlyph, Tag, type SkillIcon } from "@/components/foothill/ui";
import { useLockedPage } from "@/lib/motion/use-locked-page";

/* -------------------------------------------------------------- the skills */

export type ProjectLink = { slug: string; title: string; kind: string; year: number | null; image: string | null; stack: string[] };

/**
 * Every skill in its group, each with its own icon. A skill some projects
 * were built with is a button: it opens a drawer of those projects, from the
 * side (from below on a phone), and See all goes to Work filtered by it.
 */
/** Groups shown before "Show more", and how many each press adds. */
const SKILL_BATCH = 6;

export function SkillGroups({ groups, projects }: { groups: [string, SkillIcon[]][]; projects: ProjectLink[] }) {
  const [open, setOpen] = useState<string | null>(null);
  // Twenty-odd groups drawn at once made Skills the longest section on the
  // page by a distance, ahead of everything below it. The busiest groups lead
  // and the rest are a press away, the way Work pages through its projects.
  const [shown, setShown] = useState(SKILL_BATCH);
  const visible = groups.slice(0, shown);
  const left = groups.length - visible.length;
  // Read when the drawer opens: it slides up from the bottom on a phone.
  const [phone, setPhone] = useState(false);
  const using = (name: string) => projects.filter((project) => project.stack.includes(name));
  const show = (name: string) => {
    setPhone(window.innerWidth < 640);
    setOpen(name);
  };

  return (
    <>
      <div className="skills-grid">
        {visible.map(([category, skills]) => (
          <div key={category} className="sk-row">
            <span className="meta">
              {category || "Other"} · {skills.length}
            </span>
            <div className="sk-list">
              {skills.map((skill) => {
                const count = using(skill.name).length;
                if (!count)
                  return (
                    <span key={skill.name} className="sk">
                      <SkillGlyph skill={skill} />
                      {skill.name}
                    </span>
                  );
                return (
                  <button key={skill.name} type="button" className="sk sk-btn" onClick={() => show(skill.name)} title={`Projects built with ${skill.name}`}>
                    <SkillGlyph skill={skill} />
                    {skill.name}
                    <span className="n mono">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {groups.length > SKILL_BATCH && (
        <div className="more-row">
          {left > 0 ? (
            <button type="button" className="btn ghost" onClick={() => setShown(shown + SKILL_BATCH)}>
              <Icon name="plus" />
              {left > SKILL_BATCH ? `Show ${SKILL_BATCH} more groups` : `Show the last ${left === 1 ? "group" : `${left} groups`}`}
            </button>
          ) : (
            <button type="button" className="btn ghost" onClick={() => setShown(SKILL_BATCH)}>
              <Icon name="minus" />
              Show fewer
            </button>
          )}
          <span className="mono mute" aria-live="polite">
            Showing {visible.length} of {groups.length} groups
          </span>
        </div>
      )}
      <SkillDrawer name={open} phone={phone} projects={open ? using(open) : []} close={() => setOpen(null)} />
    </>
  );
}

function SkillDrawer({ name, phone, projects, close }: { name: string | null; phone: boolean; projects: ProjectLink[]; close: () => void }) {
  useLockedPage(Boolean(name), close);

  return (
    <AnimatePresence>
      {name && (
        <>
          <motion.div key="skill-backdrop" className="backdrop" style={{ zIndex: 74 }} onClick={close} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            key="skill"
            className="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`Projects built with ${name}`}
            initial={phone ? { y: "100%" } : { x: "100%" }}
            animate={phone ? { y: 0 } : { x: 0 }}
            exit={phone ? { y: "100%" } : { x: "100%" }}
            transition={{ duration: 0.45, ease: [0.7, 0, 0.2, 1] }}
          >
            <div className="drawer-h">
              <div>
                <span className="mono mute">Built with</span>
                <h2 className="t2">{name}</h2>
                <p className="meta">
                  {projects.length} {projects.length === 1 ? "project" : "projects"}
                </p>
              </div>
              <button type="button" className="ib" onClick={close} aria-label="Close" autoFocus>
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="drawer-b">
              {projects.map((project, i) => (
                <motion.div
                  key={project.slug}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.03, duration: 0.35, ease: EASE }}
                >
                  <Link className="prow" href={`/projects/${project.slug}` as Route} onClick={close}>
                    <span className="mini" style={{ display: "block" }}>
                      {project.image && <SiteImage src={project.image} alt="" width={96} height={60} />}
                    </span>
                    <span className="t">{project.title}</span>
                    <span className="s">
                      {project.kind}
                      {project.year && ` · ${project.year}`}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className="drawer-f">
              <Link className="btn wide" href={`/projects?skill=${encodeURIComponent(name)}` as Route} onClick={close}>
                <Icon name="grid" />
                See all {projects.length} in Work
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------- the certificates */

export type CertView = {
  id: string;
  title: string;
  issuer: string;
  logo: string;
  year: number | null;
  month: string;
  url: string;
  featured: boolean;
  achievements: string[];
};

/** Certificates by year, newest first, with a search and the five busiest issuers. */
export function Certifications({ items }: { items: CertView[] }) {
  const [query, setQuery] = useState("");
  const [issuer, setIssuer] = useState("");
  const issuers = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => counts.set(item.issuer, (counts.get(item.issuer) ?? 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [items]);
  const shown = items.filter(
    (item) => (!issuer || item.issuer === issuer) && (!query || `${item.title} ${item.issuer}`.toLowerCase().includes(query.toLowerCase())),
  );
  const years = [...new Set(shown.map((item) => item.year))];

  return (
    <>
      <div className="mini-controls">
        <label className="field">
          <Icon name="search" />
          <input placeholder="Search certificates or issuers" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search certificates" />
        </label>
        <Chips id="issuer" label="Issuer" value={issuer} onChange={setIssuer} items={[["", "All", items.length], ...issuers.map(([name, count]) => [name, name, count] as [string, string, number])]} />
      </div>
      {!shown.length && (
        <Empty
          small
          icon="search"
          title="No certificate matches"
          note="Try another word, or show all issuers."
          action={
            <ActionButton sm ghost icon="x" onClick={() => (setQuery(""), setIssuer(""))}>
              Clear
            </ActionButton>
          }
        />
      )}
      <div className="rows">
        {years.map((year, index) => {
          const list = shown.filter((item) => item.year === year);
          return (
            <div key={`${year}|${query}|${issuer}`} style={{ borderBottom: "1px solid var(--fh-line)" }}>
              <Disclosure
                open={index === 0 || Boolean(query || issuer)}
                label={
                  <span style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
                    <span className="t2" style={{ fontFamily: "var(--fh-display)" }}>
                      {year ?? "Undated"}
                    </span>
                    <span className="mono mute">
                      {list.length}
                      <span className="sr"> {list.length === 1 ? "certificate" : "certificates"}</span>
                    </span>
                  </span>
                }
              >
                <div style={{ paddingBottom: 16 }}>
                  {list.map((item) => (
                    <div key={item.id} className="cert">
                      <Logo src={item.logo} name={item.issuer} size={32} />
                      <span>
                        {item.url ? (
                          <a className="ul" href={item.url} target="_blank" rel="noopener noreferrer">
                            {item.title}
                          </a>
                        ) : (
                          item.title
                        )}{" "}
                        {item.featured && <Tag>Featured</Tag>}
                      </span>
                      <span className="mono mute">{item.month}</span>
                      <span className="o">{item.issuer}</span>
                      {item.achievements.length > 0 && (
                        <ul className="bul" style={{ gridColumn: "2 / -1", marginTop: 6, paddingBottom: 0 }}>
                          {item.achievements.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </Disclosure>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* --------------------------------------------------------- the job hunt */

export type ApplicationView = {
  id: string;
  /** The year of the first recorded step; null when no step was dated. */
  year: number | null;
  position: string;
  company: string;
  logo: string | null;
  status: string;
  slug: string;
  mode: string;
  type: string;
  where: string;
  via: string;
  salary: string;
  lessons: string;
  steps: { title: string; date: string; details: string; notes: string }[];
};

/** Each outcome as a tag shape and a chart fill: accepted solid, rejected grey, ghosted hatched. */
const OUTCOME: Record<string, { tag: "solid" | "strike" | "dashed" | ""; fill: string }> = {
  accepted: { tag: "solid", fill: "f1" },
  rejected: { tag: "strike", fill: "f3" },
  ghosted: { tag: "dashed", fill: "f4" },
};
const ORDER = ["accepted", "rejected", "ghosted"];

/** Each outcome's count within one group, in the summary's order. */
const tally = (list: ApplicationView[]) => {
  const counts = new Map<string, number>();
  list.forEach((item) => counts.set(item.slug, (counts.get(item.slug) ?? 0) + 1));
  return [...counts.entries()].sort(([a], [b]) => ((ORDER.indexOf(a) + 99) % 99) - ((ORDER.indexOf(b) + 99) % 99));
};

export function JobHunt({ items }: { items: ApplicationView[] }) {
  const [status, setStatus] = useState("");
  const outcomes = useMemo(() => {
    const groups = new Map<string, { label: string; count: number }>();
    items.forEach((item) => {
      const group = groups.get(item.slug) ?? { label: item.status, count: 0 };
      group.count += 1;
      groups.set(item.slug, group);
    });
    return [...groups.entries()].sort(([a], [b]) => (ORDER.indexOf(a) + 99) % 99 - (ORDER.indexOf(b) + 99) % 99);
  }, [items]);
  const total = items.length;
  // Grouped by the year the application started, newest first, as the
  // certificates are: sixty rows in one list read as a wall, and the year is
  // what a reader scanning a job hunt asks first. Undated ones go last.
  const years = useMemo(() => {
    const groups = new Map<number | null, ApplicationView[]>();
    items
      .filter((item) => !status || item.slug === status)
      .forEach((item) => groups.set(item.year, [...(groups.get(item.year) ?? []), item]));
    return [...groups.entries()].sort(([a], [b]) => (b ?? -1) - (a ?? -1));
  }, [items, status]);

  return (
    <>
      <div className="app-sum">
        <div className="split" style={{ height: 14 }} role="img" aria-label={outcomes.map(([, group]) => `${group.count} ${group.label}`).join(", ")}>
          {outcomes.map(([slug, group]) => (
            <i
              key={slug}
              className={OUTCOME[slug]?.fill ?? "f6"}
              style={{ flex: group.count }}
              title={`${group.label}: ${group.count} of ${total}, ${Math.round((group.count / total) * 100)}%`}
            />
          ))}
        </div>
        <div className="legend">
          {outcomes.map(([slug, group]) => (
            <span key={slug}>
              <i className={OUTCOME[slug]?.fill ?? "f6"} />
              {group.label} {group.count}
            </span>
          ))}
        </div>
        <Chips id="app" label="Outcome" value={status} onChange={setStatus} items={[["", "All", total], ...outcomes.map(([slug, group]) => [slug, group.label, group.count] as [string, string, number])]} />
      </div>
      <div className="rows">
        {years.map(([year, list], index) => (
          <div key={`${year}|${status}`} className="year-group">
            <Disclosure
              open={index === 0 || Boolean(status)}
              label={
                <span className="year-label">
                  <span className="t2" style={{ fontFamily: "var(--fh-display)" }}>
                    {year ?? "Undated"}
                  </span>
                  <span className="mono mute">
                    {list.length}
                    <span className="sr"> {list.length === 1 ? "application" : "applications"}</span>
                  </span>
                </span>
              }
              right={
                <span className="year-tally meta" aria-hidden="true">
                  {tally(list).map(([slug, count]) => (
                    <span key={slug} title={`${outcomes.find(([key]) => key === slug)?.[1].label ?? slug}: ${count}`}>
                      <i className={OUTCOME[slug]?.fill ?? "f6"} />
                      {count}
                    </span>
                  ))}
                </span>
              }
            >
              <div style={{ paddingBottom: 16 }}>
                {list.map((item) => (
                  <Application key={item.id} item={item} />
                ))}
              </div>
            </Disclosure>
          </div>
        ))}
      </div>
    </>
  );
}

/** One application: who and what, the outcome, and the steps it went through. */
function Application({ item }: { item: ApplicationView }) {
  return (
    <div className="app-row">
      <Disclosure
        label={
          <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Logo src={item.logo} name={item.company} size={32} />
            <span style={{ display: "grid", minWidth: 0 }}>
              <b style={{ fontWeight: 600 }}>{item.position}</b>
              <span className="meta">
                {item.company}
                {item.mode && `, ${item.mode.toLowerCase()}`}
              </span>
            </span>
          </span>
        }
        right={
          <span style={{ marginRight: 12 }}>
            <Tag kind={OUTCOME[item.slug]?.tag ?? ""}>{item.status}</Tag>
          </span>
        }
      >
        <div className="app-in" style={{ paddingBottom: 20 }}>
          {item.steps.length ? (
            <ol className="steps">
              {item.steps.map((step, i) => (
                <li key={i}>
                  <b style={{ fontWeight: 600 }}>{step.title}</b>
                  {step.date && (
                    <span className="mono mute" style={{ display: "block", margin: "2px 0 4px" }}>
                      {step.date}
                    </span>
                  )}
                  {step.details && <p style={{ fontSize: 14.5 }}>{step.details}</p>}
                  {step.notes && (
                    <p className="meta" style={{ whiteSpace: "pre-line" }}>
                      {step.notes}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="meta">No steps were recorded for this one.</p>
          )}
          <div>
            <div className="kv">
              {(
                [
                  ["Status", <Tag key="t" kind={OUTCOME[item.slug]?.tag ?? ""}>{item.status}</Tag>],
                  ["Type", item.type],
                  ["Where", item.where],
                  ["Via", item.via],
                  ["Salary", item.salary],
                ] as [string, React.ReactNode][]
              )
                .filter(([, value]) => value)
                .map(([key, value]) => (
                  <div key={key}>
                    <span className="mute">{key}</span>
                    <span>{value}</span>
                  </div>
                ))}
            </div>
            {item.lessons && (
              <p style={{ marginTop: 14, fontSize: 14 }}>
                <span className="mono mute" style={{ display: "block", marginBottom: 4 }}>
                  What I learned
                </span>
                {item.lessons}
              </p>
            )}
          </div>
        </div>
      </Disclosure>
    </div>
  );
}
