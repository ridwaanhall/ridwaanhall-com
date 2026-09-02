import { ADMIN_ENTRIES, type AdminGroup } from "@/lib/admin/registry";
import {
  NO_GRANT,
  grantableEntries,
  withImpliedView,
  type Grant,
  type Grants,
} from "@/lib/auth/permissions";

/**
 * Three shapes a staff account usually wants, as a starting point.
 *
 * The permission model is one row per screen and four booleans, which is the
 * right thing to store and a poor thing to fill in: thirty-odd screens is a
 * hundred and twenty checkboxes, and the account that arrives with none of them
 * ticked gets an admin whose rail draws nothing -- indistinguishable, from the
 * inside, from a broken deployment.
 *
 * **Declared per registry group, not as a list of keys.** A preset naming its
 * screens would be one more transcription that goes out of date the first time
 * somebody adds one: the new screen would silently land outside every preset,
 * which is the same failure the organizations "Used by" column had. A group is
 * the unit the rail already thinks in, so a screen added to Blog inherits what
 * Blog gets and nobody has to remember.
 *
 * Pure, like `permissions.ts` beside it: no database and no `server-only`, so
 * the matrix can offer these in the browser, `seed-admin-access.mjs` can apply
 * one from a terminal, and the unit suite can read them without a connection.
 */

/** All four. Written once rather than at each group that wants it. */
const FULL: Grant = { view: true, add: true, change: true, delete: true };
const READ: Grant = { view: true, add: false, change: false, delete: false };
const MODERATE: Grant = { view: true, add: false, change: true, delete: true };

export type AccessPresetKey = "editor" | "moderator" | "viewer";

export type AccessPreset = {
  key: AccessPresetKey;
  label: string;
  /** One sentence, shown beside the button. */
  blurb: string;
  /** Per group. A group left out gets nothing at all. */
  groups: Partial<Record<AdminGroup, Grant>>;
};

/**
 * **`Users` is in none of them, and that is the whole point of the split.**
 *
 * Everything else here is the site's own content -- posts, projects, the about
 * page, the vocabularies they are written from -- and it is the site owner's to
 * lose. `Users` is other people: the accounts that signed in to leave a comment
 * or a guestbook message, their addresses and their sign-in identities. Reaching
 * that is a decision somebody makes about one account, deliberately, on the
 * Access screen; it is not something a preset should hand out on the way past.
 *
 * `Access` is absent for a harder reason and is not merely unlisted: it is not
 * grantable at all (`grantableEntries` drops it, and `can` refuses it even if a
 * row said otherwise), because granting the ability to grant is granting
 * everything.
 */
export const ACCESS_PRESETS: AccessPreset[] = [
  {
    key: "editor",
    label: "Editor",
    blurb:
      "Writes and publishes everything on the site. Reads the guestbook and the comments without moderating them, and cannot reach accounts.",
    groups: {
      About: FULL,
      Blog: FULL,
      Projects: FULL,
      "Open to work": FULL,
      Legal: FULL,
      Settings: FULL,
      Guestbook: READ,
      Comments: READ,
    },
  },
  {
    key: "moderator",
    label: "Moderator",
    blurb:
      "Edits and removes what readers wrote, and nothing else. Blog and Projects are readable so a comment's subject is legible.",
    groups: {
      Guestbook: MODERATE,
      Comments: MODERATE,
      Blog: READ,
      Projects: READ,
    },
  },
  {
    key: "viewer",
    label: "Read-only",
    blurb: "Opens every screen except accounts, and changes nothing anywhere.",
    groups: {
      About: READ,
      Blog: READ,
      Projects: READ,
      "Open to work": READ,
      Legal: READ,
      Settings: READ,
      Guestbook: READ,
      Comments: READ,
    },
  },
];

/** The one a newly promoted staff account starts on. */
export const DEFAULT_STAFF_PRESET: AccessPresetKey = "editor";

export const ACCESS_PRESETS_BY_KEY = new Map(
  ACCESS_PRESETS.map((preset) => [preset.key, preset] as const),
);

export function presetByKey(key: string): AccessPreset | null {
  return ACCESS_PRESETS_BY_KEY.get(key as AccessPresetKey) ?? null;
}

/**
 * A preset spread over every grantable screen.
 *
 * Every key the registry offers appears in the result, including the ones the
 * preset says nothing about -- as `NO_GRANT`. A partial map would read as "leave
 * these alone", and the matrix writes a whole matrix rather than a diff, so
 * "not mentioned" has to mean "not granted" or applying a narrower preset would
 * quietly keep whatever the wider one left behind.
 *
 * `withImpliedView` on the way out, so a group given `change` without `view`
 * cannot produce a row that grants an edit to a screen the rail will not draw.
 */
export function grantsForPreset(preset: AccessPreset): Grants {
  const grants: Grants = {};
  for (const entry of grantableEntries(ADMIN_ENTRIES)) {
    const grant = preset.groups[entry.group];
    grants[entry.key] = grant ? withImpliedView(grant) : NO_GRANT;
  }
  return grants;
}
