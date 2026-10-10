import type { Route } from "next";
import Link from "next/link";

import type { PostView, ProjectView } from "@/components/foothill/rows";
import { Avail, ProjectStatus, Thumb } from "@/components/foothill/ui";

/*
 * Projects and posts as pictures on the page: the screenshot in its own
 * colour, the title on one line (the whole of it on hover), two lines of
 * summary so cards in a row line up, and a line of facts. Pure markup; a
 * grid's entrance is its wrapper's job.
 */

export function ProjectCard({ project, priority = false }: { project: ProjectView; priority?: boolean }) {
  return (
    <Link className="pcard" href={`/projects/${project.slug}` as Route}>
      <Thumb src={project.image} alt={project.imageAlt} title={project.title} kind={project.kindSlug} priority={priority} />
      <div style={{ display: "grid", gap: 6 }}>
        <h3 className="t3" title={project.title}>
          {project.title}
        </h3>
        <p>{project.headline}</p>
      </div>
      <div className="row-meta">
        <ProjectStatus slug={project.status} label={project.statusLabel} description={project.statusDescription} />
        <span>{project.kind}</span>
        {project.year && <span className="mono">{project.year}</span>}
        <Avail demo={Boolean(project.demo)} source={Boolean(project.source)} />
      </div>
    </Link>
  );
}

export function PostCard({ post, priority = false }: { post: PostView; priority?: boolean }) {
  return (
    <Link className="pcard" href={`/blog/${post.slug}` as Route}>
      <Thumb src={post.image} alt={post.imageAlt} title={post.title} motif="page" priority={priority} />
      <div style={{ display: "grid", gap: 6 }}>
        <h3 className="t3" title={post.title}>
          {post.title}
        </h3>
        <p>{post.summary}</p>
      </div>
      <div className="row-meta">
        <span className="mono">{post.date}</span>
        <span>{post.minutes} min read</span>
        <span>{post.category}</span>
      </div>
    </Link>
  );
}
