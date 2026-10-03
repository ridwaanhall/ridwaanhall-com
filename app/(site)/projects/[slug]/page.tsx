import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CardGrid } from "@/components/foothill/cards";
import {H1, H3, LEAD } from "@/components/foothill/classes";
import { Gallery } from "@/components/foothill/gallery";
import { Brand } from "@/components/foothill/icons";
import { MAIN, MEASURE, WRAP } from "@/components/foothill/layout";
import { PageMotion, Reveal } from "@/components/foothill/motion";
import { projectCard } from "@/components/foothill/rows";
import { ActionLink, Fact, Heading, StatusDot } from "@/components/foothill/ui";
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
  const next = [1, 2]
    .map((step) => sorted[(at + step) % sorted.length])
    .filter((entry) => entry && entry.slug !== project.slug);
  const category = displayLabel(project.category);
  const edited =
    project.created_at && project.updated_at && project.updated_at.getTime() - project.created_at.getTime() > 864e5;

  return (
    <main className={MAIN}>
      <JsonLdScript schemas={projectDetailSchemas(about, project)} />
      <div className={WRAP}>
        <article>
          <header className="max-w-[980px]">
            <div data-fh-enter className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-mute">
              <ActionLink href="/projects" icon="arrow-left" className="text-[14px] text-mute hover:text-ink">
                Work
              </ActionLink>
              {category && (
                <>
                  <span aria-hidden="true" className="h-3 w-px bg-line" />
                  <span>{category}</span>
                </>
              )}
            </div>
            <h1 data-fh-split className={`${H1} mt-8`}>
              {project.title}
            </h1>
            {project.headline && (
              <p data-fh-enter className={`${LEAD} mt-7 max-w-[54ch]`}>
                {project.headline}
              </p>
            )}
            <div data-fh-enter className="mt-10 flex flex-wrap items-center gap-3">
              {project.demo_url && (
                <ActionLink href={project.demo_url} variant="solid">
                  Open it
                </ActionLink>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex h-12 items-center gap-2.5 rounded-full border border-line px-6 text-[15px] font-medium text-ink transition-colors hover:border-ink"
                >
                  <Brand name="github" className="h-[18px] w-[18px] transition-transform duration-500 group-hover:-rotate-12" />
                  Source
                </a>
              )}
              <StatusDot label={project.status_label} color={project.status_color} className="ml-2 text-[14px] text-mute" />
            </div>
          </header>

          {project.image_list && project.image_list.length > 0 && (
            <div data-fh-enter className="mt-16">
              <Gallery images={project.image_list} alts={project.image_alts} title={project.title} eager />
            </div>
          )}

          <div className="mt-20 grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className={`min-w-0 lg:col-span-7 ${MEASURE}`}>
              <Reveal>
                <RichText html={project.description_html} className="fh-prose" />
              </Reveal>

              {project.features.length > 0 && (
                <section aria-labelledby="features-title" className="mt-20">
                  <Heading id="features-title" className="text-[clamp(1.75rem,1.3rem+1.8vw,2.75rem)]">What it does</Heading>
                  <Reveal as="dl" stagger className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2">
                    {project.features.map((feature) => (
                      <div key={feature.title} className="border-t border-line pt-5">
                        <dt className={`${H3} text-[19px]`}>{feature.title}</dt>
                        {feature.description && (
                          <dd className="mt-2 text-[15px] leading-relaxed text-mute">{feature.description}</dd>
                        )}
                      </div>
                    ))}
                  </Reveal>
                </section>
              )}
            </div>

            <aside className="lg:col-span-4 lg:col-start-9">
              <Reveal className="lg:sticky lg:top-28">
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
                    <p className="text-[14px] font-medium text-ink">Built with</p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {project.tech_stack.map((skill) => (
                        <li
                          key={skill.name}
                          className="group flex items-center gap-2 rounded-full bg-raise px-3 py-1.5 text-[14px] text-ink"
                          title={skill.description || undefined}
                        >
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
                  <ul className="mt-8 flex flex-wrap gap-x-3 gap-y-1.5" aria-label="Tags">
                    {project.tags.map((tag) => (
                      <li key={tag}>
                        <Link
                          href={`/projects?q=${encodeURIComponent(tag)}`}
                          className="text-[14px] text-mute transition-colors hover:text-ink"
                        >
                          #{tag}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Reveal>
            </aside>
          </div>
        </article>

        {next.length > 0 && (
          <section aria-labelledby="next-title" className="mt-28 md:mt-36">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <Heading id="next-title">More work</Heading>
              <ActionLink href="/projects">All the work</ActionLink>
            </div>
            <CardGrid cards={next.map(projectCard)} batch={2} rhythm={false} span="lg:col-span-6" className="mt-12" />
          </section>
        )}

        <div className="mt-24 max-w-[68ch]">
          <Suspense fallback={<CommentSectionSkeleton />}>
            <CommentSectionFor label="project" targetId={project.id} slug={project.slug} />
          </Suspense>
        </div>
      </div>
      <PageMotion />
    </main>
  );
}
