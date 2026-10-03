import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { EYEBROW, LINE_BUTTON, SOLID_BUTTON } from "@/components/foothill/classes";
import { Gallery } from "@/components/foothill/gallery";
import { MAIN, WRAP } from "@/components/foothill/layout";
import { PageMotion } from "@/components/foothill/page-motion";
import { Reveal } from "@/components/foothill/reveal";
import { Arrow, Fact, StatusDot } from "@/components/foothill/ui";
import { JsonLdScript } from "@/components/seo/json-ld";
import { CommentSectionFor, CommentSectionSkeleton } from "@/components/site/comments/mount";
import { RichText } from "@/components/site/rich-text";
import { getAboutData } from "@/lib/data/about";
import { findBySlug, getProjects, sortProjects } from "@/lib/data/content";
import { projectDetailSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { projectDetailSchemas } from "@/lib/seo/schemas-for-page";
import { bareUrl, displayLabel, shortDate } from "@/lib/site/display";
import { localIconUrl } from "@/lib/utils/icon-url";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [about, project] = await Promise.all([
    getAboutData(),
    getProjects().then((projects) => findBySlug(projects, slug)),
  ]);
  if (!about || !project) return {};
  return buildMetadata(projectDetailSeo(project, about), about);
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [about, all] = await Promise.all([getAboutData(), getProjects()]);
  const project = findBySlug(all, slug);
  if (!project || !about) notFound();

  const sorted = sortProjects(all);
  const at = sorted.findIndex((entry) => entry.slug === project.slug);
  const next = sorted[(at + 1) % sorted.length];
  const category = displayLabel(project.category);
  const edited =
    project.created_at && project.updated_at && project.updated_at.getTime() - project.created_at.getTime() > 864e5;

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={projectDetailSchemas(about, project)} />
      <div className={WRAP}>
        <article>
          <header className="max-w-[920px]">
            <p data-fh-enter className="fh-mono flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-mute">
              <Link href="/projects" className="text-ink hover:text-sulfur">
                ← Work
              </Link>
              {category && (
                <>
                  <span className="text-line">/</span>
                  <span>{category}</span>
                </>
              )}
            </p>
            <h1
              data-fh-split
              className="mt-8 text-[clamp(2.5rem,1.6rem+4vw,4.75rem)] leading-[1.02] font-medium tracking-[-0.035em] text-ink"
            >
              {project.title}
            </h1>
            {project.headline && (
              <p data-fh-enter className="fh-serif mt-6 max-w-[54ch] text-[clamp(1.2rem,1.05rem+0.6vw,1.5rem)] leading-[1.45] text-mute">
                {project.headline}
              </p>
            )}
            <div data-fh-enter className="mt-9 flex flex-wrap items-center gap-3">
              {project.demo_url && (
                <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className={`group ${SOLID_BUTTON}`}>
                  Open it <Arrow diagonal />
                </a>
              )}
              {project.github_url && (
                <a href={project.github_url} target="_blank" rel="noopener noreferrer" className={`group ${LINE_BUTTON}`}>
                  Source <Arrow diagonal />
                </a>
              )}
              <StatusDot
                label={project.status_label}
                color={project.status_color}
                className="fh-mono ml-2 text-[11px] tracking-[0.08em] text-mute uppercase"
              />
            </div>
          </header>

          {project.image_list && project.image_list.length > 0 && (
            <div data-fh-enter className="mt-14">
              <Gallery images={project.image_list} alts={project.image_alts} title={project.title} eager />
            </div>
          )}

          <div className="mt-16 grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="min-w-0 lg:col-span-7">
              <RichText html={project.description_html} className="fh-prose" />

              {project.features.length > 0 && (
                <section aria-labelledby="features-title" className="mt-16">
                  <h2 id="features-title" className={`${EYEBROW} border-t border-line pt-4`}>
                    What it does <span className="ml-2 text-ink">{project.features.length}</span>
                  </h2>
                  <Reveal as="dl" stagger className="mt-2">
                    {project.features.map((feature) => (
                      <div key={feature.title} className="border-b border-line py-5">
                        <dt className="text-[18px] font-medium tracking-[-0.01em] text-ink">{feature.title}</dt>
                        {feature.description && (
                          <dd className="mt-1.5 text-[15px] leading-relaxed text-mute">{feature.description}</dd>
                        )}
                      </div>
                    ))}
                  </Reveal>
                </section>
              )}
            </div>

            <aside className="lg:col-span-4 lg:col-start-9">
              <div className="lg:sticky lg:top-28">
                <dl className="border-t border-line">
                  {project.status_label && (
                    <Fact label="Status">
                      <StatusDot label={project.status_label} color={project.status_color} />
                    </Fact>
                  )}
                  {category && <Fact label="Kind">{category}</Fact>}
                  {project.created_at && <Fact label="Started">{shortDate(project.created_at)}</Fact>}
                  {edited && project.updated_at && <Fact label="Updated">{shortDate(project.updated_at)}</Fact>}
                  {project.demo_url && (
                    <Fact label="Live">
                      <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="fh-link break-all">
                        {bareUrl(project.demo_url)}
                      </a>
                    </Fact>
                  )}
                </dl>

                {project.tech_stack.length > 0 && (
                  <div className="mt-10">
                    <p className={EYEBROW}>Built with</p>
                    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-3">
                      {project.tech_stack.map((skill) => (
                        <li key={skill.name} className="group flex items-center gap-2 text-[15px] text-ink" title={skill.description || undefined}>
                          {skill.icon_svg && (
                            // eslint-disable-next-line @next/next/no-img-element -- tiny SVG icons
                            <img src={localIconUrl(skill.icon_svg)} alt="" width={16} height={16} className="fh-icon-adapt h-4 w-4" />
                          )}
                          {skill.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {project.tags.length > 0 && (
                  <ul className="mt-10 flex flex-wrap gap-2" aria-label="Tags">
                    {project.tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          href={`/projects?q=${encodeURIComponent(tag)}`}
                          className="fh-mono inline-block rounded-full border border-line px-3 py-1 text-[11px] text-mute transition-colors hover:border-ink hover:text-ink"
                        >
                          {tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>
          </div>
        </article>

        {next && next.slug !== project.slug && (
          <nav aria-label="Next project" className="mt-24 border-t border-line pt-6">
            <p className={EYEBROW}>Next in the index</p>
            <Link href={`/projects/${next.slug}`} className="group mt-4 flex items-baseline justify-between gap-6">
              <span className="text-[clamp(1.75rem,1.3rem+2vw,3rem)] leading-tight font-medium tracking-[-0.03em] text-ink">
                {next.title}
              </span>
              <Arrow className="text-[28px] text-mute group-hover:text-sulfur" />
            </Link>
          </nav>
        )}

        <div className="mt-20 max-w-[68ch]">
          <Suspense fallback={<CommentSectionSkeleton />}>
            <CommentSectionFor label="project" targetId={project.id} slug={project.slug} />
          </Suspense>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}
