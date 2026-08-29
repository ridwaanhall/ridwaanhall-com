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
  // Profile, and the rows that hang off it.
  profile: [TAGS.profile],
  profile_link: [TAGS.profile],
  profile_skill_highlight: [TAGS.profile],

  // About.
  experience: [TAGS.experience],
  experience_task: [TAGS.experience],
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

  // Legal.
  legal_document: [TAGS.legal],
  legal_section: [TAGS.legal],

  /*
   * Shared lookups, which is where the "err towards listing it" rule earns its
   * keep. An organization is named by experience, education, certifications and
   * awards; a tag by blog posts and projects; a location by the profile and by
   * anything that records one.
   */
  organization: [
    TAGS.organization,
    TAGS.experience,
    TAGS.education,
    TAGS.certification,
    TAGS.award,
  ],
  tag: [TAGS.blog, TAGS.project],
  category: [TAGS.skill, TAGS.blog, TAGS.project],
  location: [TAGS.profile, TAGS.experience, TAGS.education, TAGS.application, TAGS.hiring, TAGS.opentowork],
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
 * The guestbook, comments and accounts are deliberately absent. None of those
 * read paths is cached -- a message has to appear the moment it is posted -- so
 * there is no tag to expire and listing one would suggest otherwise.
 */
