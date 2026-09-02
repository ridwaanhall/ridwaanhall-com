import { ADMIN_ENTRIES_BY_KEY, type AdminEntry } from "@/lib/admin/registry";

/**
 * What a staff account may do, on which screen.
 *
 * **Pure, and deliberately so.** No `server-only`, no database, no Drizzle
 * column -- the same constraint `lib/admin/route.ts` and `lib/admin/models/`
 * keep, and for the same reason: the check harnesses and the unit suite both
 * import this, and a module that opened a connection would do so every time one
 * of them asked a question about shape. `lib/auth/staff.ts` reads the rows; this
 * decides what they mean.
 *
 * Until now there was one privilege here, `is_staff`, held or not held, and
 * anyone holding it reached every screen. Two roles sit above the grants now:
 *
 *   * **superuser** -- answers yes to everything, including the screen that
 *     hands out grants. It is a column on `account`, not a row in
 *     `admin_access`, because it is not a grant: it is the absence of the
 *     question.
 *   * **staff** -- answers from `admin_access`, one row per screen, four
 *     booleans. No row is no permission; the table is not a list of exceptions.
 *
 * Read every question through `can` or `permits`. Reaching for
 * `actor.grants[key]` directly skips rules that are not visible in the shape of
 * the data, and each of them fails *open*.
 */

/**
 * The four things a screen offers, named as the admin already names them.
 *
 * `change` rather than `edit` because that is the word the changelist, the
 * record form and the save action all use for the same act, and one word for
 * one thing is what keeps a permission legible beside the button it governs.
 */
export const ADMIN_ACTIONS = ["view", "add", "change", "delete"] as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[number];

/** One screen's four answers, as stored. */
export type Grant = {
  view: boolean;
  add: boolean;
  change: boolean;
  delete: boolean;
};

/** Registry key to what is granted on it. A key with no entry is no grant. */
export type Grants = Record<string, Grant>;

export const NO_GRANT: Grant = { view: false, add: false, change: false, delete: false };

/**
 * Who is asking.
 *
 * The shape `lib/auth/staff.ts` produces and every gate consumes. It carries no
 * Drizzle column, so it can cross to a client component -- which the rail needs
 * -- and it carries the grants rather than a way to fetch them, so nothing
 * downstream can issue a second query per question asked.
 */
export type AdminActor = {
  /** A uuid. */
  id: string;
  username: string;
  fullName: string;
  email: string;
  isSuperuser: boolean;
  grants: Grants;
};

/**
 * Whether this actor may do `action` on the screen named `key`.
 *
 * Three rules live here rather than at the call sites, because every one of
 * them fails open when it is forgotten:
 *
 *   1. **A superuser answers yes to everything**, including a key that is not
 *      in the registry -- there is nothing to protect from somebody who could
 *      grant it to themselves in the next click.
 *   2. **An unknown key is refused.** `model_key` is a text column with no
 *      foreign key behind it, so a grant naming a screen that no longer exists
 *      is a row the database is perfectly happy to keep. A renamed screen must
 *      not carry its old permissions forward silently; it fails closed, and the
 *      superuser re-grants it.
 *   3. **A `superuserOnly` screen is never granted.** The Access screen is the
 *      one: granting the ability to grant is granting everything, so a row
 *      naming it is ignored rather than honoured.
 *
 * What is *not* here is the descriptor's own refusal -- `canCreate: false` on a
 * singleton, say. A grant may not widen that, and the two are combined by
 * `permits` below rather than folded in here, because this answers about a
 * screen and that one answers about a model.
 */
export function can(actor: AdminActor, key: string, action: AdminAction): boolean {
  if (actor.isSuperuser) return true;

  const entry = ADMIN_ENTRIES_BY_KEY.get(key);
  if (!entry || entry.superuserOnly) return false;

  return actor.grants[key]?.[action] === true;
}

/**
 * The screens this actor may open, for the rail, the index and the tab strips.
 *
 * Registry order, so the nav does not have to sort it back. An array rather
 * than a `Set` because it is passed to a client component -- see
 * `PermittedKeys` in the registry for what a `Set` does at that boundary.
 */
export function permittedKeys(actor: AdminActor): string[] {
  return [...ADMIN_ENTRIES_BY_KEY.values()]
    .filter((entry) => can(actor, entry.key, "view"))
    .map((entry) => entry.key);
}

/**
 * Whether this actor reaches anything at all.
 *
 * A superuser with no rows in `admin_access` still sees everything, which is
 * the point of the role. A staff account with no rows sees an admin with
 * nothing in it -- a real state that the index page says out loud, rather than
 * a fault to guard against here.
 */
export function hasAnyAccess(actor: AdminActor): boolean {
  return actor.isSuperuser || permittedKeys(actor).length > 0;
}

/**
 * What the *model* permits, before anyone's grants are consulted.
 *
 * `canCreate` and `canDelete` on a form descriptor are `boolean | "superuser"`,
 * and the third state is why this function exists. **`"superuser"` is a truthy
 * string**, exactly like `readOnly: "afterCreate"` next door in
 * `lib/admin/form.ts`, so a caller that keeps testing `model.canDelete !== false`
 * reads it as *allowed* and offers a superuser-only delete to every staff
 * account. That type checks, lints, builds, and stays invisible until somebody
 * deletes an account.
 *
 * It takes the flag rather than the model, so `lib/admin/form.ts` need not
 * import an actor type and the harnesses can ask it about a literal.
 */
export function roleAllows(flag: boolean | "superuser" | undefined, isSuperuser: boolean): boolean {
  if (flag === undefined) return true;
  if (flag === "superuser") return isSuperuser;
  return flag;
}

/**
 * The whole answer for one action on one model: the descriptor **and** the
 * grant.
 *
 * A grant never widens what a descriptor refuses. `profile` is one row that
 * every page in the public layout renders and that nothing in this admin can
 * recreate, so its delete is refused to everyone including a superuser; a grant
 * saying otherwise changes nothing. The rule sits here rather than in each
 * descriptor so there is one place to read it from.
 *
 * A model with no form descriptor answers `false` for everything but `view`:
 * there is a record page for it, and no way to write through it.
 */
export function permits(
  actor: AdminActor,
  key: string,
  action: AdminAction,
  model: { canCreate?: boolean | "superuser"; canDelete?: boolean | "superuser" } | null,
): boolean {
  if (!can(actor, key, action)) return false;
  if (action === "view") return true;
  if (!model) return false;
  if (action === "add") return roleAllows(model.canCreate, actor.isSuperuser);
  if (action === "delete") return roleAllows(model.canDelete, actor.isSuperuser);
  return true;
}

/**
 * The screens a matrix may offer, which is not every screen.
 *
 * `superuserOnly` entries are left out rather than drawn and disabled: a row
 * nobody can ever tick is a question that should not have been asked.
 */
export function grantableEntries(entries: readonly AdminEntry[]): AdminEntry[] {
  return entries.filter((entry) => !entry.superuserOnly);
}

/**
 * Normalise one screen's four booleans.
 *
 * **Add, change and delete each imply view.** A grant that cannot open the
 * screen it governs is a dead row: the changelist answers not-found, so the Add
 * button it was meant to reveal is never drawn and the record it was meant to
 * edit is never reachable. Applied on the way in and on the way out, so the
 * matrix cannot store one and a reader cannot be handed one from an older row.
 */
export function withImpliedView(grant: Grant): Grant {
  return { ...grant, view: grant.view || grant.add || grant.change || grant.delete };
}
