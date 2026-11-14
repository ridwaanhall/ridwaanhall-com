/**
 * Cache tag namespaces.
 *
 * A dependency map: which tags an edit to a given model has to invalidate.
 *
 * Tag revalidation is cross-instance by construction, so there is no version
 * stamp to keep in the database -- an edit handled by one instance cannot leave
 * another serving a stale copy.
 *
 * The rule that makes the map work: listing a dependency that is not
 * real only costs an occasional needless rebuild, whereas *omitting* a real one
 * serves stale content. Err towards listing it.
 */
export const TAGS = {
  profile: "profile",
  experience: "experience",
  membership: "membership",
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
  settings: "settings",
  patchNotes: "patchNotes",
  /*
   * Not a table: every WakaTime read, which is fetched rather than queried.
   * Nothing in `MODEL_TAGS` expires it and no write here changes it; it is
   * listed so the reads name one constant rather than four copies of a string.
   */
  wakatime: "wakatime",
} as const;

export type Tag = (typeof TAGS)[keyof typeof TAGS];

/**
 * Which table, when written, invalidates which namespaces.
 *
 * `lib/actions/admin.ts` looks this up as `MODEL_TAGS[getTableName(model.from)]`
 * with a `?? []` behind it, so **the keys have to be the real table names**. Key
 * it by anything else and every lookup misses in silence: `updateTag` is never
 * called, the admin still looks right because it revalidates its own path
 * separately, and the public site serves a cached copy until its lifetime runs
 * out. `tags.test.ts` asserts the keys against the descriptors for exactly that
 * reason.
 *
 * Child tables are listed as well as parents. They are written through their
 * parent's inlines rather than a screen of their own, but the page that renders
 * them is cached under the parent's tag.
 *
 * Lookup tables reach further than they look. An organization shows on four
 * different sections, so renaming one has to expire all four.
 */
export const MODEL_TAGS: Record<string, readonly Tag[]> = {
  // Profile, and the rows that hang off it. Its portrait choice also decides
  // the byline photo on every post that shares the profile's photo.
  profile: [TAGS.profile, TAGS.blog],
  profile_link: [TAGS.profile],
  profile_skill_highlight: [TAGS.profile],

  // About.
  experience: [TAGS.experience],
  experience_task: [TAGS.experience],
  membership: [TAGS.membership],
  membership_task: [TAGS.membership],
  education: [TAGS.education],
  education_achievement: [TAGS.education],
  certification: [TAGS.certification],
  certification_achievement: [TAGS.certification],
  award: [TAGS.award],
  skill: [TAGS.skill],
  application: [TAGS.application],
  application_step: [TAGS.application],

  // Blog and projects.
  blog_post: [TAGS.blog],
  blog_image: [TAGS.blog],
  blog_tag: [TAGS.blog],
  project: [TAGS.project],
  project_feature: [TAGS.project],
  project_image: [TAGS.project],
  project_skill: [TAGS.project],
  project_tag: [TAGS.project],

  // Hiring and open-to-work.
  hiring_profile: [TAGS.hiring],
  hiring_list_item: [TAGS.hiring],
  job_opening: [TAGS.hiring],
  job_opening_list_item: [TAGS.hiring],
  open_to_work_profile: [TAGS.opentowork],
  open_to_work_list_item: [TAGS.opentowork],
  portfolio_highlight: [TAGS.opentowork],

  // Site-wide settings, read by the public layout.
  site_setting: [TAGS.settings],

  // Legal.
  legal_document: [TAGS.legal],
  legal_section: [TAGS.legal],

  // Patch notes, written by the release workflow and corrected in the admin.
  patch_note: [TAGS.patchNotes],
  patch_note_entry: [TAGS.patchNotes],

  /*
   * Shared lookups, which is where the "err towards listing it" rule earns its
   * keep. An organization is named by experience, education, certifications,
   * awards and applications; a tag by blog posts and projects; a location by
   * the profile and by anything that records one.
   *
   * Applications were missing from that list, and the miss was invisible in the
   * way these always are: `getApplications` selects `organization.name` and
   * renders it on every card, so renaming an organization left the old name on
   * screen for a `cacheLife("days")` window while every other area updated at
   * once. Nothing was stored wrong and no check went red -- `location` two
   * entries down had already been corrected for the same reason, which is what
   * makes a hand-written list like this the thing to distrust.
   */
  organization: [
    TAGS.organization,
    TAGS.experience,
    TAGS.membership,
    TAGS.education,
    TAGS.certification,
    TAGS.award,
    TAGS.application,
  ],
  tag: [TAGS.blog, TAGS.project],
  category: [TAGS.skill, TAGS.blog, TAGS.project],
  location: [TAGS.profile, TAGS.experience, TAGS.membership, TAGS.education, TAGS.application, TAGS.hiring, TAGS.opentowork],
  project_status: [TAGS.project],
  // An application card names both of these, which the two lines below missed
  // until the vocabularies got a screen and renaming one stopped being
  // hypothetical.
  employment_type: [TAGS.experience, TAGS.application, TAGS.hiring, TAGS.opentowork],
  work_mode: [TAGS.experience, TAGS.application, TAGS.hiring, TAGS.opentowork],
  application_status: [TAGS.application],
  application_source: [TAGS.application],
  legal_document_type: [TAGS.legal],

  /*
   * The six the open-to-work profile answers from. One page reads all of them,
   * so they expire the same tag.
   */
  open_to_work_status: [TAGS.opentowork],
  availability: [TAGS.opentowork],
  experience_level: [TAGS.opentowork],
  notice_period: [TAGS.opentowork],
  work_authorization: [TAGS.opentowork],
  contact_preference: [TAGS.opentowork],

  /*
   * An image is referenced from every area that can show one, so replacing the
   * file behind an asset has to expire all of them.
   */
  media_asset: [
    TAGS.profile,
    TAGS.skill,
    TAGS.organization,
    TAGS.blog,
    TAGS.project,
    TAGS.certification,
    TAGS.award,
  ],
};

/*
 * The guestbook, comments, accounts and public access are deliberately absent.
 * None of those read paths is cached -- a message has to appear the moment it is
 * posted, and a permission taken away has to bite on the next request -- so
 * there is no tag to expire and listing one would suggest otherwise.
 */

/**
 * The tags each per-slug public route reads: its own area, plus everything the
 * site layout around it reads (the profile, highlighted skills, the hiring and
 * open-to-work banners, the image settings).
 *
 * **Expiring a tag does not reach every page that read it.** The build leaves
 * one generic shell per route for every slug it did not prerender, and that
 * shell carries a snapshot of the cached reads it was built with --
 * `getProjects()` included, all 300KB of it. A slug rendered from the shell
 * reads that snapshot rather than the live cache, and the shell is listed under
 * the layout's tags only, never `project`. So expiring `project` moved the
 * listing on and left every slug added since the deploy reading the deploy's
 * list: five projects published that way answered "not out yet" in production
 * through every save until the site was redeployed, and a project edited after
 * the deploy would have kept its old text the same way.
 *
 * Revalidating the route itself does reach the shell, so a write that expires
 * any of these tags also revalidates the route (`expire()` in
 * `lib/data/expire.ts`), and the shell is rebuilt from current data.
 * `scripts/check-publish-reaches-page.mjs` drives that against a production
 * server.
 *
 * **Keyed by the file's path under `app/`, route group included.** The page
 * carries the implicit tag `_N_T_/(site)/projects/[slug]/page`, and
 * `revalidatePath("/projects/[slug]", "page")` expires
 * `_N_T_/projects/[slug]/page` instead -- a perfectly valid call that matches
 * nothing, which is exactly what the first version of this fix did.
 */
export const ROUTE_TAGS: Record<string, readonly Tag[]> = {
  "/(site)/projects/[slug]": [TAGS.project, TAGS.profile, TAGS.skill, TAGS.hiring, TAGS.opentowork, TAGS.settings],
  "/(site)/blog/[slug]": [TAGS.blog, TAGS.profile, TAGS.skill, TAGS.hiring, TAGS.opentowork, TAGS.settings],
  "/(site)/legal/[slug]": [TAGS.legal, TAGS.profile, TAGS.skill, TAGS.hiring, TAGS.opentowork, TAGS.settings],
};

/** The routes that read any of `tags`, each once. */
export function routesReading(tags: readonly Tag[]): string[] {
  return Object.entries(ROUTE_TAGS)
    .filter(([, read]) => read.some((tag) => tags.includes(tag)))
    .map(([route]) => route);
}
