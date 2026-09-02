import Image from "next/image";
import Link from "next/link";

import type { Project, ProjectSummary } from "@/lib/data/content";
import { projectStatusColor } from "@/lib/data/project-status";
import { localIconUrl } from "@/lib/utils/icon-url";

/** How many tech icons fit before they are summarised as "+N". */
const VISIBLE_TECH = 5;

export function ProjectCard({
  project,
  eager = false,
}: {
  project: Project | ProjectSummary;
  /**
   * The leading cards of a grid, which are the ones that can be the LCP.
   * `loading="eager"` rather than Next's `preload` for the reason written out
   * on `BlogCard`: more than one card carries it, so which one is the largest
   * paint is a viewport question, and React preloads a non-lazy image anyway.
   */
  eager?: boolean;
}) {
  const tech = project.tech_stack.filter((t) => t.icon_svg);
  const overflow = project.tech_stack.length - VISIBLE_TECH;

  return (
    <Link href={`/projects/${project.slug}`} className="block h-full">
      <div className="group backdrop-blur-sm rounded-xl overflow-hidden flex flex-col h-full transition-all duration-300 border border-zinc-800">
        <div className="relative aspect-[3/2] overflow-hidden">
          {project.image_url && (
            <Image
              src={project.image_url}
              alt={project.title}
              width={300}
              height={300}
              loading={eager ? "eager" : "lazy"}
              className="w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105 group-hover:blur-sm"
            />
          )}

          {/* `.media-scrim` is themed by hand, not from the palette: its
              contrast is against arbitrary screenshot content rather than
              against a surface the palette controls. */}
          <div className="absolute inset-0 media-scrim flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <div className="flex items-center font-medium text-sm sm:text-base">
              <span className="mr-1">View project</span>
              <svg
                stroke="currentColor"
                fill="none"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
                height={20}
                width={20}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>

          {project.status && (
            <div className="absolute top-0 left-0 z-20">
              <div
                className={`${projectStatusColor(project.status_color)} text-xs px-2 py-1 sm:px-3 sm:py-1.5 rounded-br-lg backdrop-blur-sm flex items-center gap-1.5 transition-all duration-300`}
              >
                <span className="tracking-wide">{project.status_label}</span>
              </div>
            </div>
          )}

          {project.is_featured && (
            <div className="absolute top-0 right-0 z-20">
              <div className="bg-lime-400 text-emerald-950 text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-bl-lg flex items-center transition-all duration-300">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
                  stroke="none"
                  fill="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 1024 1024"
                  height={15}
                  width={15}
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path d="M878.3 392.1L631.9 145.7c-6.5-6.5-15-9.7-23.5-9.7s-17 3.2-23.5 9.7L423.8 306.9c-12.2-1.4-24.5-2-36.8-2-73.2 0-146.4 24.1-206.5 72.3-15.4 12.3-16.6 35.4-2.7 49.4l181.7 181.7-215.4 215.2a15.8 15.8 0 0 0-4.6 9.8l-3.4 37.2c-.9 9.4 6.6 17.4 15.9 17.4.5 0 1 0 1.5-.1l37.2-3.4c3.7-.3 7.2-2 9.8-4.6l215.4-215.4 181.7 181.7c6.5 6.5 15 9.7 23.5 9.7 9.7 0 19.3-4.2 25.9-12.4 56.3-70.3 79.7-158.3 70.2-243.4l161.1-161.1c12.9-12.8 12.9-33.8 0-46.8z" />
                </svg>
                <span className="tracking-wider text-xs">FEATURED</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          <h3 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2 line-clamp-2 relative inline-block">
            <span className="relative inline-block after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current group-hover:after:w-full after:transition-all after:duration-300">
              {project.title}
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 flex-grow line-clamp-3 mb-3 sm:mb-4">
            {project.headline}
          </p>

          {project.tech_stack.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              {tech.slice(0, VISIBLE_TECH).map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-700 hover:bg-zinc-600 transition-all duration-300 cursor-help"
                  title={item.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={localIconUrl(item.icon_svg)}
                    alt={item.name}
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    width={25}
                    height={25}
                    loading="lazy"
                  />
                </div>
              ))}
              {overflow > 0 && (
                <div
                  className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-zinc-700 text-xs font-medium cursor-help"
                  title={`${overflow} more technologies`}
                >
                  +{overflow}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
