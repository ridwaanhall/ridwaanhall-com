/**
 * Cache tag namespaces.
 *
 * A direct port of `MODEL_NAMESPACES` / `ENTRY_DEPENDENCIES` in
 * apps/core/cache.py. That design existed because payloads lived in each
 * lambda's own memory, so correctness needed a version stamp in Postgres that
 * every instance could read. Next's tag revalidation is cross-instance by
 * construction, so the stamp table goes away -- but the *dependency map* is
 * still exactly right and is kept verbatim.
 *
 * The rule that made it work still applies: listing a dependency that is not
 * real only costs an occasional needless rebuild, whereas *omitting* a real one
 * serves stale content. Err towards listing it.
 */
export const TAGS = {
  profile: "profile",
  experience: "experience",
  education: "education",
  certification: "certification",
  award: "award",
  skill: "skill",
  organization: "organization",
  application: "application",
  blog: "blog",
  project: "project",
  hiring: "hiring",
  opentowork: "opentowork",
  legal: "legal",
} as const;

export type Tag = (typeof TAGS)[keyof typeof TAGS];

/**
 * Which model, when written, invalidates which namespaces. Used by the admin's
 * mutation handlers so a save bumps only what it actually affects -- saving a
 * blog post must not throw away the projects, about and legal caches, each of
 * which costs a fresh set of round trips to rebuild.
 */
export const MODEL_TAGS: Record<string, readonly Tag[]> = {
  about_profile: [TAGS.profile],
  about_donatelink: [TAGS.profile],
  about_profileskillhighlight: [TAGS.profile],
  about_experience: [TAGS.experience],
  about_education: [TAGS.education],
  about_certification: [TAGS.certification],
  about_award: [TAGS.award],
  about_skill: [TAGS.skill],
  about_organization: [TAGS.organization],
  about_application: [TAGS.application],
  about_journeystep: [TAGS.application],
  blog_blogpost: [TAGS.blog],
  blog_blogimage: [TAGS.blog],
  projects_project: [TAGS.project],
  projects_feature: [TAGS.project],
  projects_projectimage: [TAGS.project],
  projects_project_tech_stack: [TAGS.project],
  openhire_hiringprofile: [TAGS.hiring],
  openhire_position: [TAGS.hiring],
  openhire_opentoworkprofile: [TAGS.opentowork],
  openhire_portfoliohighlight: [TAGS.opentowork],
  legal_legaldocument: [TAGS.legal],
  legal_legalsection: [TAGS.legal],
};
