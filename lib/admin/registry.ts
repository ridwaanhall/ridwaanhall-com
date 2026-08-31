/**
 * Every screen the admin offers, in the order the sidebar lists them.
 *
 * The declarative half: it names the screens, groups them for the sidebar, and
 * says which are one-row singletons. The *behavioural* half -- which columns a
 * list shows, what it filters and searches on -- lives per model under
 * `lib/admin/models/`, because those need the Drizzle columns and cannot be
 * plain data.
 *
 * Adding a screen is adding an entry here and a descriptor there. There is no
 * page to write; `scripts/check-admin.mjs` fails if the two ever disagree.
 *
 * URLs are `/admin/<key>` -- one flat segment, not `<area>/<model>`. Every
 * model name in this project is unique, so an area segment would carry no
 * information, and one segment leaves `/admin/<key>/new` and
 * `/admin/<key>/<id>` unambiguous.
 */
export type AdminGroup =
  | "About"
  | "Blog"
  | "Projects"
  | "Open to work"
  | "Legal"
  | "Guestbook"
  | "Comments"
  | "Users"
  | "Settings";

/**
 * The sidebar's order, and the index page's. There is no `order` field on an
 * entry -- this array and `ADMIN_ENTRIES` are the only two orderings there are.
 *
 * Settings sits last because it is the vocabularies the other screens choose
 * *from*: a dropdown's options are configuration, and nobody opens the admin to
 * edit them the way they open it to write a post.
 */
export const ADMIN_GROUPS: AdminGroup[] = [
  "About",
  "Blog",
  "Projects",
  "Open to work",
  "Legal",
  "Guestbook",
  "Comments",
  "Users",
  "Settings",
];

/**
 * A Settings page, and the vocabularies that are tabs on it.
 *
 * Seventeen of the thirty-four screens here are the dropdown vocabularies
 * every other screen chooses from. As seventeen rows they were half the
 * sidebar and ran past the fold, which made the Settings heading a label on a
 * list rather than something that could put the list away.
 *
 * A section is one sidebar row and one page. Its tabs keep their own keys,
 * their own descriptors and their own changelist state -- only the URL moves,
 * from `/admin/<key>` to `/admin/<section>/<key>`.
 *
 * **A section key and a model key are one namespace**, because they are one
 * URL segment. Nothing types that; `descriptors.test.ts` asserts it.
 */
export type AdminSectionKey =
  | "catalogue"
  | "taxonomy"
  | "work"
  | "applying"
  | "job-preferences"
  | "publishing";

export type AdminSection = {
  /** URL segment under `/admin`, and the page's identity. */
  key: AdminSectionKey;
  label: string;
  group: AdminGroup;
  /** One line under the name on the index page. */
  blurb: string;
};

/**
 * The six, in the order the sidebar lists them.
 *
 * Two names avoid the obvious choice. **Applying**, not "Applications",
 * because About already has an `application` screen whose plural label is
 * exactly that, and two sidebar rows reading the same word would trade one
 * confusion for another in an interface whose whole job here is to shorten a
 * list. **Job preferences**, not "Open to work", because that string is
 * already a group heading three rows above -- and `availability`, the other
 * candidate, is one of its own tabs and so cannot be its key.
 */
export const ADMIN_SECTIONS: AdminSection[] = [
  {
    key: "catalogue",
    label: "Catalogue",
    group: "Settings",
    blurb: "The three records other screens point at: skills, organizations, places.",
  },
  {
    key: "taxonomy",
    label: "Taxonomy",
    group: "Settings",
    blurb: "Categories and tags, shared by posts, projects and skills.",
  },
  {
    key: "work",
    label: "Work",
    group: "Settings",
    blurb: "How a role is held: employment type and work mode.",
  },
  {
    key: "applying",
    label: "Applying",
    group: "Settings",
    blurb: "Where an application got to, and the board it went through.",
  },
  {
    key: "job-preferences",
    label: "Job preferences",
    group: "Settings",
    blurb: "The six answers the open-to-work page is built from.",
  },
  {
    key: "publishing",
    label: "Publishing",
    group: "Settings",
    blurb: "The project lifecycle, and what kind of document a policy page is.",
  },
];

export const ADMIN_SECTIONS_BY_KEY = new Map<string, AdminSection>(
  ADMIN_SECTIONS.map((section) => [section.key, section]),
);

export type AdminEntry = {
  /** URL segment under `/admin`, and the key `lib/admin/models/` files use. */
  key: string;
  label: string;
  labelPlural: string;
  group: AdminGroup;
  /**
   * A model that only ever holds one row: `Profile`, `HiringProfile`,
   * `OpenToWorkProfile`. There is no list and no delete -- `/admin/<key>` *is*
   * that record's edit form.
   */
  singleton?: boolean;
  /** One line under the name on the index page. */
  blurb: string;
  /**
   * The Settings page this screen is a tab on, if any.
   *
   * Set, the URL is `/admin/<section>/<key>` and the top-level `/admin/<key>`
   * answers 404 -- one screen at two URLs is the drift this replaced.
   */
  section?: AdminSectionKey;
};

export const ADMIN_ENTRIES: AdminEntry[] = [
  {
    key: "profile",
    label: "Profile",
    labelPlural: "Profile",
    group: "About",
    singleton: true,
    blurb: "Name, bio, links, location and the status flags.",
  },
  {
    key: "experience",
    label: "Experience",
    labelPlural: "Experience",
    group: "About",
    blurb: "Roles, ordered by the sort column the about page follows.",
  },
  {
    key: "education",
    label: "Education",
    labelPlural: "Education",
    group: "About",
    blurb: "Degrees and the achievements listed under each.",
  },
  {
    key: "certification",
    label: "Certification",
    labelPlural: "Certifications",
    group: "About",
    blurb: "Credentials, and which of them are featured.",
  },
  {
    key: "award",
    label: "Award",
    labelPlural: "Awards",
    group: "About",
    blurb: "Honours and the organisation that issued them.",
  },
  {
    key: "application",
    label: "Application",
    labelPlural: "Applications",
    group: "About",
    blurb: "Job applications and their journey steps.",
  },
  {
    key: "blog-post",
    label: "Blog post",
    labelPlural: "Blog posts",
    group: "Blog",
    blurb: "Articles, their tags, and the images each one uses.",
  },
  {
    key: "project",
    label: "Project",
    labelPlural: "Projects",
    group: "Projects",
    blurb: "Work, its features, its gallery and its tech stack.",
  },
  {
    key: "hiring-profile",
    label: "Hiring profile",
    labelPlural: "Hiring profile",
    group: "Open to work",
    singleton: true,
    blurb: "What you are hiring for, and the open positions.",
  },
  {
    key: "job-opening",
    label: "Open position",
    labelPlural: "Open positions",
    group: "Open to work",
    blurb: "Roles being hired for, with their skills, duties and benefits.",
  },
  {
    key: "open-to-work-profile",
    label: "Open to work profile",
    labelPlural: "Open to work profile",
    group: "Open to work",
    singleton: true,
    blurb: "What you are looking for, and the portfolio highlights.",
  },
  {
    key: "legal-document",
    label: "Legal document",
    labelPlural: "Legal documents",
    group: "Legal",
    blurb: "The privacy policy and terms, with their sections.",
  },
  {
    key: "legal-section",
    label: "Legal section",
    labelPlural: "Legal sections",
    group: "Legal",
    blurb: "Sections on their own, for searching across documents.",
  },
  {
    key: "chat-message",
    label: "Message",
    labelPlural: "Messages",
    group: "Guestbook",
    blurb: "The guestbook thread, and which messages are pinned.",
  },
  {
    key: "user-profile",
    label: "User profile",
    labelPlural: "User profiles",
    group: "Guestbook",
    blurb: "Author and co-author flags, and the co-author order.",
  },
  {
    key: "comment",
    label: "Comment",
    labelPlural: "Comments",
    group: "Comments",
    blurb: "Comments on posts and projects, including deleted ones.",
  },
  {
    key: "user",
    label: "User",
    labelPlural: "Users",
    group: "Users",
    blurb: "Accounts, and who may reach this admin at all.",
  },

  /*
   * Settings: every vocabulary a dropdown elsewhere in this admin offers.
   *
   * The three records first -- a skill, an organization and a place each carry
   * content of their own (an icon, a logo and a website, a map link) as well as
   * being something other forms point at. Then the closed vocabularies, which
   * are a slug, a label and an order and nothing else.
   */
  {
    key: "skill",
    label: "Skill",
    labelPlural: "Skills",
    group: "Settings",
    blurb: "The catalogue behind the marquee and the tech stacks.",
    section: "catalogue",
  },
  {
    key: "organization",
    label: "Organization",
    labelPlural: "Organizations",
    group: "Settings",
    blurb: "The shared company, school and issuer record.",
    section: "catalogue",
  },
  {
    key: "location",
    label: "Location",
    labelPlural: "Locations",
    group: "Settings",
    blurb: "The shared place record, named by every form that has a location.",
    section: "catalogue",
  },
  {
    key: "category",
    label: "Category",
    labelPlural: "Categories",
    group: "Settings",
    blurb: "Three vocabularies in one table, kept apart by kind.",
    section: "taxonomy",
  },
  {
    key: "tag",
    label: "Tag",
    labelPlural: "Tags",
    group: "Settings",
    blurb: "Shared by blog posts and projects, so the spelling is settled once.",
    section: "taxonomy",
  },
  {
    key: "application-status",
    label: "Application status",
    labelPlural: "Application statuses",
    group: "Settings",
    blurb: "Where an application got to. The slug carries its colour.",
    section: "applying",
  },
  {
    key: "application-source",
    label: "Applied via",
    labelPlural: "Applied via",
    group: "Settings",
    blurb: "The boards and sites an application was submitted through.",
    section: "applying",
  },
  {
    key: "employment-type",
    label: "Employment type",
    labelPlural: "Employment types",
    group: "Settings",
    blurb: "Full-time, contract and the rest, shared by four screens.",
    section: "work",
  },
  {
    key: "work-mode",
    label: "Work mode",
    labelPlural: "Work modes",
    group: "Settings",
    blurb: "Remote, on-site, hybrid.",
    section: "work",
  },
  {
    key: "project-status",
    label: "Project status",
    labelPlural: "Project statuses",
    group: "Settings",
    blurb: "The project lifecycle. Rename and reorder; the set itself is fixed.",
    section: "publishing",
  },
  {
    key: "legal-document-type",
    label: "Legal document type",
    labelPlural: "Legal document types",
    group: "Settings",
    blurb: "What kind of document a policy page is.",
    section: "publishing",
  },
  {
    key: "open-to-work-status",
    label: "Open to work status",
    labelPlural: "Open to work statuses",
    group: "Settings",
    blurb: "How actively you are looking.",
    section: "job-preferences",
  },
  {
    key: "availability",
    label: "Availability",
    labelPlural: "Availability",
    group: "Settings",
    blurb: "How soon you could start.",
    section: "job-preferences",
  },
  {
    key: "experience-level",
    label: "Experience level",
    labelPlural: "Experience levels",
    group: "Settings",
    blurb: "The seniority band shown on the open-to-work page.",
    section: "job-preferences",
  },
  {
    key: "notice-period",
    label: "Notice period",
    labelPlural: "Notice periods",
    group: "Settings",
    blurb: "How much notice your current commitment needs.",
    section: "job-preferences",
  },
  {
    key: "work-authorization",
    label: "Work authorization",
    labelPlural: "Work authorizations",
    group: "Settings",
    blurb: "Citizenship and sponsorship, as an employer would ask it.",
    section: "job-preferences",
  },
  {
    key: "contact-preference",
    label: "Contact preference",
    labelPlural: "Contact preferences",
    group: "Settings",
    blurb: "How you would rather be reached about a role.",
    section: "job-preferences",
  },
];

export const ADMIN_ENTRIES_BY_KEY = new Map(ADMIN_ENTRIES.map((entry) => [entry.key, entry]));

/** The entries in one group, in registry order. */
export function entriesInGroup(group: AdminGroup): AdminEntry[] {
  return ADMIN_ENTRIES.filter((entry) => entry.group === group);
}

/** The tabs of one section, in registry order — which is the strip's order. */
export function sectionTabs(key: AdminSectionKey): AdminEntry[] {
  return ADMIN_ENTRIES.filter((entry) => entry.section === key);
}

/**
 * Where a screen lives.
 *
 * **The only place an admin URL is built.** It was `/admin/${key}` in twelve
 * places before sections existed, and a sectioned key makes every one of them
 * wrong in a way nothing reports: both halves are strings, so a stale caller
 * type checks, lints, builds, and 404s. Everything else composes on this --
 * `${adminPath(entry)}/new`, `${adminPath(entry)}/${id}`.
 */
export function adminPath(entry: AdminEntry): string {
  return entry.section ? `/admin/${entry.section}/${entry.key}` : `/admin/${entry.key}`;
}
