import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { JsonLdScript } from "@/components/seo/json-ld";
import {
  CommentSectionFor,
  CommentSectionSkeleton,
} from "@/components/site/comments/mount";
import { MediaGallery } from "@/components/site/media-gallery";
import { RichText } from "@/components/site/rich-text";
import { getAboutData } from "@/lib/data/about";
import { findBySlug, getProjects, type Project } from "@/lib/data/content";
import { projectStatusColor, projectStatusDisplay } from "@/lib/data/project-status";
import { projectDetailSeo } from "@/lib/seo/data";
import { buildMetadata } from "@/lib/seo/metadata";
import { projectDetailSchemas } from "@/lib/seo/schemas-for-page";
import { isoDateTime, longDate } from "@/lib/utils/format";
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

  return (
    <>
      <JsonLdScript schemas={projectDetailSchemas(about, project)} />
      <main className="px-3 py-4 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative mb-6 sm:mb-8">
            <div className="relative z-10">
              <div className="flex flex-col">
                <h1 className="text-2xl lg:text-3xl font-medium mb-2 tracking-tight">
                  {project.title}
                </h1>

                <p className="text-base sm:text-lg leading-relaxed mb-4 max-w-3xl">
                  {project.headline}
                </p>

                {project.status && (
                  <div className="mb-4">
                    <span
                      className={`inline-flex items-center gap-1.5 ${projectStatusColor(project.status)} text-sm px-3 py-1.5 rounded-full backdrop-blur-sm`}
                    >
                      {projectStatusDisplay(project.status)}
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                    <Link
                      href="/projects"
                      className="icon-btn cursor-pointer"
                      aria-label="Back to projects"
                      title="Back to projects"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        fill="currentColor"
                        viewBox="0 0 48 48"
                        className="text-zinc-300"
                        aria-hidden="true"
                      >
                        <path d="m3.88 21.88 15.3-15.3a1 1 0 0 1 1.4 0L23.4 9.4a1 1 0 0 1-.02 1.43L12.74 21H43a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H12.74l10.64 10.17a1 1 0 0 1 .02 1.43l-2.81 2.81a1 1 0 0 1-1.42 0L3.87 26.12a3 3 0 0 1 0-4.24Z" />
                      </svg>
                      <span className="sr-only">Back to projects</span>
                    </Link>

                    {project.tech_stack.length > 0 && (
                      <>
                        <div className="w-px h-6 bg-zinc-600 mx-1" />
                        {project.tech_stack
                          .filter((tech) => tech.icon_svg)
                          .map((tech) => (
                            <div
                              key={tech.name}
                              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-all duration-300 cursor-help"
                              title={tech.name}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={localIconUrl(tech.icon_svg)}
                                alt={tech.name}
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                width={25}
                                height={25}
                              />
                            </div>
                          ))}
                      </>
                    )}
                  </div>

                  <ActionButtons project={project} />
                </div>

                {/*
                  `w-full`, not the blog's `mb-6 md:mb-8`: Django wraps the two
                  galleries differently, and the extra 32px pushed everything
                  below the gallery down by exactly that much.
                */}
                <MediaGallery
                  images={project.image_list ?? []}
                  names={project.image_names ?? []}
                  alt={project.title}
                  variant="project"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {(project.created_at || project.updated_at) && (
            <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-400">
              {project.created_at && (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon />
                  <time dateTime={isoDateTime(project.created_at)}>
                    {longDate(project.created_at)}
                  </time>
                </span>
              )}
              {project.updated_at && (
                <>
                  {project.created_at && <span className="text-zinc-600">&middot;</span>}
                  <span className="inline-flex items-center gap-1.5 italic">
                    <RefreshIcon />
                    <time dateTime={isoDateTime(project.updated_at)}>
                      Updated {longDate(project.updated_at)}
                    </time>
                  </span>
                </>
              )}
            </div>
          )}

          {project.description_html && (
            <section className="mb-8">
              <SectionHeading icon={<DocumentIcon />}>Description</SectionHeading>
              {/*
                Was an array of plain paragraph strings, rendered one `<p>` each
                with no way to express a list, a link or emphasis. Rich text
                now, styled by styles/prose.css.
              */}
              <RichText html={project.description_html} />
            </section>
          )}

          {project.features.length > 0 && (
            <section className="mb-8">
              <SectionHeading icon={<BulbIcon />}>Features</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.features.map((feature) => (
                  <div
                    key={feature.title}
                    className="rounded-lg border border-zinc-700 hover:border-zinc-600 transition p-4 flex flex-col gap-2"
                  >
                    <div>
                      <h3 className="text-base font-semibold mb-1">{feature.title}</h3>
                      <p className="text-zinc-400 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {project.tech_stack.length > 0 && (
            <section className="mb-8">
              <SectionHeading icon={<CodeIcon />}>Tech Stack</SectionHeading>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {project.tech_stack.map((tech) => (
                  <div
                    key={tech.name}
                    className="flex items-center gap-3 border border-zinc-700 rounded-lg px-3 py-3 hover:border-zinc-600 transition"
                  >
                    <div
                      className="flex items-center justify-center rounded-full bg-zinc-800/70"
                      style={{ width: 40, height: 40, minWidth: 40, minHeight: 40 }}
                    >
                      {tech.icon_svg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={localIconUrl(tech.icon_svg)}
                          alt={tech.name}
                          className="w-6 h-6"
                          width={25}
                          height={25}
                          loading="lazy"
                        />
                      ) : (
                        <svg
                          className="w-6 h-6 text-zinc-400"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16 18l6-6-6-6M8 6l-6 6 6 6"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <span className="text-base font-medium">{tech.name}</span>
                      {tech.description && (
                        <span className="text-zinc-400 block text-xs mt-0.5">
                          {tech.description}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Behind a boundary for the reason given on the blog detail page. */}
          <Suspense fallback={<CommentSectionSkeleton />}>
            <CommentSectionFor
              label="project"
              targetId={project.id}
              slug={project.slug}
            />
          </Suspense>
        </div>
      </main>
    </>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="text-lg sm:text-xl font-semibold mb-2 flex items-center gap-2">
      {icon}
      {children}
    </h2>
  );
}

function ActionButtons({ project }: { project: Project }) {
  const links = [
    project.github_url && { href: project.github_url, label: "View source", icon: <GitHubMark /> },
    project.demo_url && { href: project.demo_url, label: "Open live demo", icon: <ExternalIcon /> },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

  if (links.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      {links.map((link) => (
        <a
          key={link.href}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="icon-btn group"
          aria-label={link.label}
          title={link.label}
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

const OUTLINE = { fill: "none", stroke: "currentColor", strokeWidth: 2, viewBox: "0 0 24 24" } as const;

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" {...OUTLINE} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" {...OUTLINE} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...OUTLINE} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...OUTLINE} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" {...OUTLINE} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="currentColor"
      viewBox="0 0 16 16"
      className="text-zinc-300 group-hover:text-white"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
      className="text-zinc-300 group-hover:text-white"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
