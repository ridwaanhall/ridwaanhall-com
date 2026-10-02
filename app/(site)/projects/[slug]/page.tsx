import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { Reveal, SplitHeading } from "@/components/motion/reveal";
import { JsonLdScript } from "@/components/seo/json-ld";
import {
  CommentSectionFor,
  CommentSectionSkeleton,
} from "@/components/site/comments/mount";
import { MediaGallery } from "@/components/site/media-gallery";
import { ProjectStatus } from "@/components/site/content-rows";
import { RichText } from "@/components/site/rich-text";
import {
  ArrowUpRightIcon,
  BackLink,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  CONTAINER,
  Dot,
} from "@/components/site/ui";
import { getAboutData } from "@/lib/data/about";
import { findBySlug, getProjects, type Project } from "@/lib/data/content";
import { projectDetailSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { projectDetailSchemas } from "@/lib/seo/schemas-for-page";
import { isoDateTime, longDate, slugify } from "@/lib/utils/format";
import { localIconUrl } from "@/lib/utils/icon-url";

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [about, project] = await Promise.all([
    getAboutData(),
    getProjects().then((projects) => findBySlug(projects, slug)),
  ]);
  if (!about || !project) return {};
  return buildMetadata(projectDetailSeo(project, about), about);
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [about, project] = await Promise.all([
    getAboutData(),
    getProjects().then((projects) => findBySlug(projects, slug)),
  ]);
  if (!project || !about) notFound();

  const stack = project.tech_stack;

  return (
    <>
      <JsonLdScript schemas={projectDetailSchemas(about, project)} />
      <main className={CONTAINER}>
        <header className="pt-10 md:pt-16">
          <Reveal>
            <BackLink href="/projects">All projects</BackLink>
          </Reveal>

          <Reveal className="mt-10 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
            {project.status && (
              <>
                <ProjectStatus label={project.status_label} color={project.status_color} />
                <Dot />
              </>
            )}
            {project.category && (
              <>
                <span>{project.category}</span>
                <Dot />
              </>
            )}
            {project.created_at && (
              <time dateTime={isoDateTime(project.created_at)}>{longDate(project.created_at)}</time>
            )}
            {project.updated_at && (
              <>
                {project.created_at && <Dot />}
                <time dateTime={isoDateTime(project.updated_at)}>
                  Updated {longDate(project.updated_at)}
                </time>
              </>
            )}
          </Reveal>

          <SplitHeading className="mt-5 max-w-4xl text-4xl font-medium leading-[1.05] tracking-tight text-balance text-zinc-100 sm:text-5xl md:text-6xl">
            {project.title}
          </SplitHeading>

          {project.headline && (
            <Reveal as="p" className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-zinc-400 sm:text-xl">
              {project.headline}
            </Reveal>
          )}

          <ActionButtons project={project} />
        </header>

        <Reveal className="mt-12 md:mt-16">
          <MediaGallery
            images={project.image_list ?? []}
            names={project.image_names ?? []}
            alts={project.image_alts ?? []}
            alt={project.title}
            variant="project"
            className="w-full"
          />
        </Reveal>

        <div className="mt-16 grid gap-16 border-t border-zinc-800 pt-12 md:mt-20 md:pt-16 lg:grid-cols-[1fr_17rem]">
          <div className="min-w-0 space-y-16">
            {project.description_html && (
              <section>
                <SectionHeading>Description</SectionHeading>
                {/*
                  Was an array of plain paragraph strings, rendered one `<p>`
                  each with no way to express a list, a link or emphasis. Rich
                  text now, styled by styles/prose.css.
                */}
                <Reveal>
                  <RichText html={project.description_html} />
                </Reveal>
              </section>
            )}

            {project.features.length > 0 && (
              <section>
                <SectionHeading>Features</SectionHeading>
                <ol className="border-b border-zinc-800">
                  {project.features.map((feature, position) => (
                    <Reveal
                      as="li"
                      key={feature.title}
                      className="grid grid-cols-[2.5rem_1fr] gap-x-4 border-t border-zinc-800 py-5"
                    >
                      <span className="pt-0.5 text-sm tabular-nums text-zinc-600">
                        {String(position + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-base font-medium text-zinc-100">{feature.title}</h3>
                        {feature.description && (
                          <p className="mt-1 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
                        )}
                      </div>
                    </Reveal>
                  ))}
                </ol>
              </section>
            )}
          </div>

          <aside className="space-y-12 lg:sticky lg:top-24 lg:self-start">
            {stack.length > 0 && (
              <section>
                <SectionHeading>Tech Stack</SectionHeading>
                <ul className="space-y-4">
                  {stack.map((tech) => (
                    <Reveal as="li" key={tech.name} className="flex items-start gap-3">
                      {tech.icon_svg ? (
                        // eslint-disable-next-line @next/next/no-img-element -- small SVG marks
                        <img
                          src={localIconUrl(tech.icon_svg)}
                          alt=""
                          className="mt-0.5 h-5 w-5 shrink-0"
                          width={20}
                          height={20}
                          loading="lazy"
                        />
                      ) : (
                        <span className="mt-0.5 h-5 w-5 shrink-0 rounded bg-zinc-900" aria-hidden="true" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-zinc-100">{tech.name}</p>
                        {tech.description && (
                          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{tech.description}</p>
                        )}
                      </div>
                    </Reveal>
                  ))}
                </ul>
              </section>
            )}

            {project.tags.length > 0 && (
              <section>
                <SectionHeading>Tags</SectionHeading>
                <ul className="flex flex-wrap gap-x-3 gap-y-1.5 text-sm text-zinc-500">
                  {project.tags.map(String).map((tag) => (
                    <li key={tag}>#{slugify(tag)}</li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>

        {/* Behind a boundary for the reason given on the blog detail page. */}
        <div className="max-w-3xl">
          <Suspense fallback={<CommentSectionSkeleton />}>
            <CommentSectionFor label="project" targetId={project.id} slug={project.slug} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-6 text-sm text-zinc-500">{children}</h2>;
}

function ActionButtons({ project }: { project: Project }) {
  if (!project.github_url && !project.demo_url) return null;

  return (
    <Reveal className="mt-10 flex flex-wrap gap-3">
      {project.demo_url && (
        <a
          href={project.demo_url}
          target="_blank"
          rel="noopener noreferrer"
          className={BUTTON_PRIMARY}
          aria-label="Open live demo"
        >
          Live demo
          <ArrowUpRightIcon className="h-4 w-4" />
        </a>
      )}
      {project.github_url && (
        <a
          href={project.github_url}
          target="_blank"
          rel="noopener noreferrer"
          className={project.demo_url ? BUTTON_SECONDARY : BUTTON_PRIMARY}
          aria-label="View source"
        >
          <GitHubMark />
          Source
        </a>
      )}
    </Reveal>
  );
}







function GitHubMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      viewBox="0 0 16 16"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

