import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ProjectCard } from "@/components/foothill/cards";
import { Gallery } from "@/components/foothill/gallery";
import { MAIN } from "@/components/foothill/layout";
import { MarkdownChips } from "@/components/foothill/markdown";
import { PageMotion, Reveal } from "@/components/foothill/motion";
import { featuredProjects, projectView } from "@/components/foothill/rows";
import { Button, Crumb, Facts, Heading, ProjectStatus, SkillGlyph, TextLink } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { CommentSectionFor, CommentSectionSkeleton } from "@/components/site/comments/mount";
import { RichText } from "@/components/site/rich-text";
import { getAboutData } from "@/lib/data/about";
import { findBySlug, getProjects, sortProjects, type Project } from "@/lib/data/content";
import { projectDetailSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { projectDetailSchemas } from "@/lib/seo/schemas-for-page";
import { skillIcon } from "@/lib/site/skills";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [about, project] = await Promise.all([getAboutData(), getProjects().then((projects) => findBySlug(projects, slug))]);
  if (!about || !project) return {};
  return buildMetadata(projectDetailSeo(project, about), about);
}

/** Open it and its source, wherever the page offers them. */
function Links({ project }: { project: Project }) {
  return (
    <>
      {project.demo_url && (
        <Button href={project.demo_url} icon="out">
          Open the live site
        </Button>
      )}
      {project.github_url && (
        <Button href={project.github_url} ghost brand="github">
          Source on GitHub
        </Button>
      )}
    </>
  );
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [about, all] = await Promise.all([getAboutData(), getProjects()]);
  const project = findBySlug(all, slug);
  if (!project || !about) notFound();

  const sorted = sortProjects(all);
  const views = sorted.map(projectView);
  const view = projectView(project);
  const at = sorted.findIndex((entry) => entry.slug === project.slug);
  const previous = at > 0 ? views[at - 1] : null;
  const next = at < views.length - 1 ? views[at + 1] : null;
  const more = featuredProjects(views)
    .filter((entry) => entry.slug !== project.slug)
    .slice(0, 3);
  const usedBy = (name: string) => views.filter((entry) => entry.stack.includes(name)).length;
  const linked = Boolean(project.demo_url || project.github_url);
  const facts: [string, React.ReactNode][] = [
    ["Status", <ProjectStatus key="status" slug={project.status} label={project.status_label} />],
    ["Kind", view.kind],
    ...(view.started ? [["Started", view.started] as [string, string]] : []),
    ...(view.updated && view.updated !== view.started ? [["Updated", view.updated] as [string, string]] : []),
  ];

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={projectDetailSchemas(about, project)} />
      <div>
        <section className="head wrap">
          <div>
            <Crumb href="/projects">Work</Crumb>
            <h1 className="t1" data-fh-split="">
              {project.title}
            </h1>
            {project.headline && <p className="lead">{project.headline}</p>}
            {linked && (
              <div className="link-row" data-fh-enter="">
                <Links project={project} />
              </div>
            )}
            <MarkdownChips path={`/projects/${project.slug}`} />
          </div>
          <div data-fh-enter="">
            <Facts rows={facts} />
          </div>
        </section>

        {project.image_list && project.image_list.length > 0 && (
          <section className="wrap" style={{ paddingBottom: 40 }}>
            <Gallery images={project.image_list} alts={project.image_alts} title={project.title} />
          </section>
        )}

        <section className="wrap sec">
          <div className="proj-body">
            <div style={{ minWidth: 0 }}>
              <Heading title="About it" />
              <RichText html={project.description_html} className="article" />
            </div>
            <aside className="side-card">
              <Facts rows={facts} />
              {project.tech_stack.length > 0 && (
                <div>
                  <span className="meta">Built with</span>
                  <div className="sk-list" style={{ marginTop: 10 }}>
                    {project.tech_stack.map((skill) => (
                      <Link
                        key={skill.name}
                        className="sk sk-btn"
                        href={`/projects?skill=${encodeURIComponent(skill.name)}` as Route}
                        title={`Every project built with ${skill.name}`}
                      >
                        <SkillGlyph skill={skillIcon(skill)} />
                        {skill.name}
                        <span className="n mono">{usedBy(skill.name)}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {linked && (
                <div style={{ display: "grid", gap: 8 }}>
                  <Links project={project} />
                </div>
              )}
            </aside>
          </div>
        </section>

        {project.features.length > 0 && (
          <section className="wrap sec">
            <Heading title="What it does" count={project.features.length} />
            <Reveal stagger className="pgrid three">
              {project.features.map((feature, i) => (
                <div key={feature.title} className="feature">
                  <span className="mono mute">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="t3">{feature.title}</h3>
                  {feature.description && <p className="meta">{feature.description}</p>}
                </div>
              ))}
            </Reveal>
            {project.tags.length > 0 && (
              <div className="sk-list" style={{ marginTop: 32 }} aria-label="Tags">
                {project.tags.map((tag) => (
                  <Link key={tag} className="tag" href={`/projects?q=${encodeURIComponent(tag)}` as Route}>
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            {linked && (
              <div className="link-row">
                <Links project={project} />
              </div>
            )}
          </section>
        )}

        {(previous || next) && (
          <nav className="wrap pn" aria-label="More projects">
            {previous ? (
              <Link href={`/projects/${previous.slug}` as Route} className="pn-a">
                <span className="mono mute">Previous project</span>
                <span className="t3">{previous.title}</span>
                <span className="meta">
                  {previous.kind}
                  {previous.year && ` · ${previous.year}`}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/projects/${next.slug}` as Route} className="pn-a r">
                <span className="mono mute">Next project</span>
                <span className="t3">{next.title}</span>
                <span className="meta">
                  {next.kind}
                  {next.year && ` · ${next.year}`}
                </span>
              </Link>
            )}
          </nav>
        )}

        <section className="wrap sec">
          <Suspense fallback={<CommentSectionSkeleton />}>
            <CommentSectionFor label="project" targetId={project.id} slug={project.slug} />
          </Suspense>
        </section>

        {more.length > 0 && (
          <section className="wrap sec">
            <Heading title="More work">
              <TextLink href="/projects" icon="grid">
                {`All ${views.length}`}
              </TextLink>
            </Heading>
            <Reveal stagger className="pgrid three">
              {more.map((entry) => (
                <ProjectCard key={entry.slug} project={entry} />
              ))}
            </Reveal>
          </section>
        )}
      </div>
      <PageMotion />
    </main>
  );
}
