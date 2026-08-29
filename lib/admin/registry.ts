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
  },
  {
    key: "organization",
    label: "Organization",
    labelPlural: "Organizations",
    group: "Settings",
    blurb: "The shared company, school and issuer record.",
  },
  {
    key: "location",
    label: "Location",
    labelPlural: "Locations",
    group: "Settings",
    blurb: "The shared place record, named by every form that has a location.",
  },
  {
    key: "category",
    label: "Category",
    labelPlural: "Categories",
    group: "Settings",
    blurb: "Three vocabularies in one table, kept apart by kind.",
  },
  {
    key: "tag",
    label: "Tag",
    labelPlural: "Tags",
    group: "Settings",
    blurb: "Shared by blog posts and projects, so the spelling is settled once.",
  },
  {
    key: "application-status",
    label: "Application status",
    labelPlural: "Application statuses",
    group: "Settings",
    blurb: "Where an application got to. The slug carries its colour.",
  },
  {
    key: "application-source",
    label: "Applied via",
    labelPlural: "Applied via",
    group: "Settings",
    blurb: "The boards and sites an application was submitted through.",
  },
  {
    key: "employment-type",
    label: "Employment type",
    labelPlural: "Employment types",
    group: "Settings",
    blurb: "Full-time, contract and the rest, shared by four screens.",
  },
  {
    key: "work-mode",
    label: "Work mode",
    labelPlural: "Work modes",
    group: "Settings",
    blurb: "Remote, on-site, hybrid.",
  },
  {
    key: "project-status",
    label: "Project status",
    labelPlural: "Project statuses",
    group: "Settings",
    blurb: "The project lifecycle. Rename and reorder; the set itself is fixed.",
  },
  {
    key: "legal-document-type",
    label: "Legal document type",
    labelPlural: "Legal document types",
    group: "Settings",
    blurb: "What kind of document a policy page is.",
  },
  {
    key: "open-to-work-status",
    label: "Open to work status",
    labelPlural: "Open to work statuses",
    group: "Settings",
    blurb: "How actively you are looking.",
  },
  {
    key: "availability",
    label: "Availability",
    labelPlural: "Availability",
    group: "Settings",
    blurb: "How soon you could start.",
  },
  {
    key: "experience-level",
    label: "Experience level",
    labelPlural: "Experience levels",
    group: "Settings",
    blurb: "The seniority band shown on the open-to-work page.",
  },
  {
    key: "notice-period",
    label: "Notice period",
    labelPlural: "Notice periods",
    group: "Settings",
    blurb: "How much notice your current commitment needs.",
  },
  {
    key: "work-authorization",
    label: "Work authorization",
    labelPlural: "Work authorizations",
    group: "Settings",
    blurb: "Citizenship and sponsorship, as an employer would ask it.",
  },
  {
    key: "contact-preference",
    label: "Contact preference",
    labelPlural: "Contact preferences",
    group: "Settings",
    blurb: "How you would rather be reached about a role.",
  },
];

export const ADMIN_ENTRIES_BY_KEY = new Map(ADMIN_ENTRIES.map((entry) => [entry.key, entry]));

/** The entries in one group, in registry order. */
export function entriesInGroup(group: AdminGroup): AdminEntry[] {
  return ADMIN_ENTRIES.filter((entry) => entry.group === group);
}
