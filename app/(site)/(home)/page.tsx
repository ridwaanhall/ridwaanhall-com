import type { Metadata, Route } from "next";
import { SiteImage } from "@/components/foothill/site-image";
import Link from "next/link";
import { Suspense } from "react";

import { PostCard, ProjectCard } from "@/components/foothill/cards";
import { LocalClock } from "@/components/foothill/controls";
import { Icon } from "@/components/foothill/icons";
import { MAIN } from "@/components/foothill/layout";
import { NoImage } from "@/components/foothill/noimg";
import { CountUp, PageMotion, Reveal, TiltedRow } from "@/components/foothill/motion";
import { featuredProjects, inProgress, monthYearLabel, postView, projectView, type ProjectView } from "@/components/foothill/rows";
import { SkillMarquee } from "@/components/foothill/skill-marquee";
import { Button, Empty, Heading, Logo, ProjectStatus, TextLink } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { getAboutData, getCertifications, getExperiences, getSkills } from "@/lib/data/about";
import { getBlogs, getProjects, sortProjects } from "@/lib/data/content";
import { getGitHubStats } from "@/lib/data/github";
import { getOpenToWorkData } from "@/lib/data/openhire";
import { getWakatimeStats } from "@/lib/data/wakatime";
import { homepageSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { homepageSchemas } from "@/lib/seo/schemas-for-page";
import { skillIcon, wholeHours } from "@/lib/site/skills";

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAboutData();
  if (!about) return {};
  return buildMetadata(homepageSeo(about), about);
}

const sentence = (text: string) => (text ? text[0].toUpperCase() + text.slice(1) : text);
const listed = (names: string[]) =>
  names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : (names[0] ?? "");

/** The lifecycle as five stages, and the status slugs that sit in each. */
const STAGES: [string, string[]][] = [
  ["Planning", ["planning-requirements", "on-hold"]],
  ["Design", ["design"]],
  ["Building", ["development-in-progress", "code-review", "reopened", "update-required"]],
  ["Testing", ["testing-qa"]],
  ["Released", ["deployment-released", "maintenance-support", "completed"]],
];

/** What is in progress, from the projects themselves; gone when nothing is. */
function Building({ projects }: { projects: ProjectView[] }) {
  const list = inProgress(projects).slice(0, 2);
  if (!list.length) return null;
  return (
    <section className="wrap" style={{ paddingTop: 28 }} aria-labelledby="building-h">
      <div className="building">
        <div className="building-h">
          <span id="building-h" className="mono mute">
            Currently building
          </span>
          <span className="meta">{list.length === 1 ? "One project in progress" : `${list.length} projects in progress`}</span>
        </div>
        {list.map((project) => {
          const at = Math.max(0, STAGES.findIndex(([, slugs]) => slugs.includes(project.status)));
          return (
            <Link key={project.slug} href={`/projects/${project.slug}` as Route} className="b-row">
              <span className="mini">{project.image ? <SiteImage src={project.image} alt="" width={120} height={75} /> : <NoImage title={project.title} kind={project.kindSlug} />}</span>
              <span className="b-main">
                <span className="b-t">
                  <b>{project.title}</b>
                  <ProjectStatus slug={project.status} label={project.statusLabel} description={project.statusDescription} />
                </span>
                <span className="meta b-s">{project.headline}</span>
                <span className="phases" aria-label={`Stage ${at + 1} of ${STAGES.length}: ${STAGES[at][0]}`}>
                  {STAGES.map(([label], i) => (
                    <span key={label} className={i < at ? "ph done" : i === at ? "ph now" : "ph"}>
                      <i />
                      <span className="mono">{label}</span>
                    </span>
                  ))}
                </span>
                <span className="mono mute b-d">
                  Started {project.started} · updated {project.updated}
                  {project.stack.length > 0 && ` · ${project.stack.join(", ")}`}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

type Counted = { value: number | null; label: string };

/** The four capsules. A figure not yet known reads as a dash, never as zero. */
function Caps({ figures }: { figures: Counted[] }) {
  return (
    <TiltedRow className="caps">
      {figures.map(({ value, label }) => (
        <div key={label} className="cap">
          <b className={value == null ? "num mute" : "num"}>{value == null ? "–" : <CountUp value={value} />}</b>
          <span>{label}</span>
        </div>
      ))}
    </TiltedRow>
  );
}

/**
 * The row with its two live figures, streamed: an upstream that is slow holds
 * up only these, and the fallback is the same row with dashes where they go.
 */
async function LiveCaps({ username, fixed }: { username: string; fixed: Counted[] }) {
  const [stats, github] = await Promise.all([
    getWakatimeStats(process.env.WAKATIME_API_KEY ?? ""),
    getGitHubStats(username, process.env.GITHUB_ACCESS_TOKEN ?? ""),
  ]);
  return (
    <Caps
      figures={[
        ...fixed,
        { value: stats ? wholeHours(stats.all_time_coding) : null, label: "hours in the editor" },
        { value: github ? github.total_contributions : null, label: "contributions this year" },
      ]}
    />
  );
}

export default async function HomePage() {
  const [about, blogs, projects, skills, current, certifications, openToWork] = await Promise.all([
    getAboutData(),
    getBlogs(),
    getProjects(),
    getSkills(),
    getExperiences(true),
    getCertifications(),
    getOpenToWorkData(),
  ]);
  if (!about) return null;

  const views = sortProjects(projects).map(projectView);
  const featured = featuredProjects(views).slice(0, 4);
  const selected = featured.length ? featured : views.slice(0, 4);
  const newest = [...views].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const latest = blogs[0];
  const posts = blogs.slice(0, 3).map(postView);
  const certYears = certifications.map((c) => c.issued?.year).filter((year): year is number => Boolean(year));
  const since = certYears.length ? Math.min(...certYears) : null;
  const fixedCaps: Counted[] = [
    { value: projects.length, label: "projects published" },
    { value: certifications.length, label: since ? `certificates since ${since}` : "certificates" },
  ];

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={await homepageSchemas(about)} />
      <div>
        <section className="wrap hero">
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "end" }}>
            {about.is_open_to_work && (
              <Link className="badge" href="/openhire" data-fh-enter="" style={{ alignSelf: "start" }}>
                <Icon name="briefcase" size={14} />
                Open to work{openToWork?.availability ? `, ${openToWork.availability.toLowerCase()}` : ""}
              </Link>
            )}
            <h1 className="t1" data-fh-chars="" data-fh-hold="">
              {about.name}
            </h1>
            <p className="role" data-fh-enter="" data-fh-hold="">
              {about.role}.
            </p>
            {about.short_description && (
              <p className="lead" data-fh-enter="" data-fh-hold="">
                {sentence(about.short_description)}
              </p>
            )}
            <div className="acts" data-fh-enter="" data-fh-hold="">
              <Button href="/projects" icon="grid">
                See the work
              </Button>
              <Button href="/contact" ghost icon="mail">
                Write to me
              </Button>
            </div>
          </div>
        </section>

        <div className="wrap">
          <div className="ticker">
            <div>
              <span className="mono mute">Based in</span>
              <span className="v">{[about.location.residency || about.location.regency, about.location.province].filter(Boolean).join(", ")}</span>
            </div>
            <div>
              <span className="mono mute">Local time</span>
              <span className="v">
                <LocalClock /> <span className="mute">GMT+7</span>
              </span>
            </div>
            <div>
              <span className="mono mute">Newest work</span>
              {newest ? (
                <Link className="v ul" href={`/projects/${newest.slug}` as Route}>
                  {newest.title}
                </Link>
              ) : (
                <span className="v mute">Nothing yet</span>
              )}
            </div>
            <div>
              <span className="mono mute">Latest writing</span>
              {latest ? (
                <Link className="v ul" href={`/blog/${latest.slug}` as Route}>
                  {latest.title}
                </Link>
              ) : (
                <span className="v mute">Nothing yet</span>
              )}
            </div>
          </div>
        </div>

        <Building projects={views} />

        {about.short_bio && (
          <section className="wrap sec" style={{ borderTop: 0 }}>
            <p className="mono mute" style={{ marginBottom: 18 }}>
              Right now
            </p>
            <p className="statement" data-fh-blur="">
              {about.short_bio}
            </p>
            <div style={{ marginTop: 28 }}>
              <TextLink href="/about" icon="user">
                The longer story
              </TextLink>
            </div>
          </section>
        )}

        <section className="wrap sec" aria-label="In numbers">
          <Suspense
            fallback={
              <Caps
                figures={[
                  ...fixedCaps,
                  { value: null, label: "hours in the editor" },
                  { value: null, label: "contributions this year" },
                ]}
              />
            }
          >
            <LiveCaps username={about.username} fixed={fixedCaps} />
          </Suspense>
        </section>

        <section className="wrap sec">
          <Heading title="Selected work" count={projects.length} note="Four projects worth starting with.">
            <TextLink href="/projects" icon="grid">
              {`All ${projects.length} projects`}
            </TextLink>
          </Heading>
          {selected.length ? (
            <Reveal stagger className="pgrid">
              {selected.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </Reveal>
          ) : (
            <Empty icon="grid" title="No projects to show yet" note="The first published project appears here, with its screenshot and status." />
          )}
        </section>

        <section className="wrap sec">
          <Heading title="Where I am now" count={current.length} note="Roles that are still running.">
            <TextLink href="/about" icon="briefcase">
              Everything I have done
            </TextLink>
          </Heading>
          {current.length ? (
            <Reveal stagger className="pgrid three">
              {current.map((role) => (
                <div key={role.id} className="now-role">
                  <Logo src={role.logo} name={role.company} />
                  <div>
                    <h3 className="t3">{role.title}</h3>
                    <p className="meta">
                      {role.company}
                      {role.location_type && ` · ${role.location_type}`}
                    </p>
                  </div>
                  <span className="mono mute">Since {monthYearLabel(role.period.start)}</span>
                </div>
              ))}
            </Reveal>
          ) : (
            <Empty
              icon="briefcase"
              title="Between roles right now"
              note="Open to work. The next role is listed here the day it starts."
              action={
                <Button sm ghost href="/openhire" icon="briefcase">
                  What I am looking for
                </Button>
              }
            />
          )}
        </section>

        <section className="wrap sec">
          <Heading title="Writing" count={blogs.length} note="The newest three.">
            <TextLink href="/blog" icon="book">
              {`All ${blogs.length} posts`}
            </TextLink>
          </Heading>
          {posts.length ? (
            <Reveal stagger className="pgrid three">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </Reveal>
          ) : (
            <Empty icon="pen" title="Nothing published yet" note="The newest three posts sit here once the first goes out." />
          )}
        </section>

        <section className="sec" style={{ overflow: "hidden" }}>
          <div className="wrap">
            <Heading
              title={about.skills.length ? `Most days it is ${listed(about.skills)}.` : "The tools come next."}
              count={skills.length}
              note={skills.length ? "The rest drift past below." : "No skills listed yet."}
            />
          </div>
          {skills.length > 0 && <SkillMarquee skills={skills.map(skillIcon)} />}
        </section>
      </div>
      <PageMotion />
    </main>
  );
}
