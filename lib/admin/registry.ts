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
  | "Users";

export const ADMIN_GROUPS: AdminGroup[] = [
  "About",
  "Blog",
  "Projects",
  "Open to work",
  "Legal",
  "Guestbook",
  "Comments",
  "Users",
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
    key: "skill",
    label: "Skill",
    labelPlural: "Skills",
    group: "About",
    blurb: "The catalogue behind the marquee and the tech stacks.",
  },
  {
    key: "application",
    label: "Application",
    labelPlural: "Applications",
    group: "About",
    blurb: "Job applications and their journey steps.",
  },
  {
    key: "organization",
    label: "Organization",
    labelPlural: "Organizations",
    group: "About",
    blurb: "The shared company, school and issuer record.",
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
];

export const ADMIN_ENTRIES_BY_KEY = new Map(ADMIN_ENTRIES.map((entry) => [entry.key, entry]));

/** The entries in one group, in registry order. */
export function entriesInGroup(group: AdminGroup): AdminEntry[] {
  return ADMIN_ENTRIES.filter((entry) => entry.group === group);
}
