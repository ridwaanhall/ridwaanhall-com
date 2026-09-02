"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { saveAccess, type AccessResult } from "@/lib/actions/access";
import { ADMIN_ACTIONS, withImpliedView, type AdminAction, type Grant } from "@/lib/auth/permissions";
import { ACCESS_PRESETS, grantsForPreset, type AccessPreset } from "@/lib/auth/presets";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils/cn";

/**
 * One account's role and its grants, as a grid.
 *
 * **The one screen in this admin that is not a descriptor.** Everything else is
 * a changelist and a form generated from `lib/admin/models/`, and adding a
 * screen is adding data. This cannot be: its rows are the registry's *entries*,
 * not the columns of a table, and its cells are four booleans on a join row. A
 * form descriptor has no way to say "one row per screen, four checkboxes each",
 * and inventing a field kind for a shape that occurs exactly once would put the
 * complexity somewhere thirty-four other screens have to carry it.
 *
 * So it is written out, and it borrows rather than reinvents: `.admin-check`
 * from `styles/admin-controls.css` is the same box every other form here draws,
 * the footer bar is `record-form.tsx`'s, and the table chrome is the
 * changelist's. A superuser arriving from a record form should not be able to
 * tell that this screen was built differently.
 *
 * **The rows are grouped exactly as the rail groups them**, in registry order.
 * Somebody deciding what to grant is thinking in the same areas they navigate
 * in, and a flat list of thirty-four keys is a list nobody can check their work
 * against.
 */

/** What the server sends down: one row per grantable screen. */
export type MatrixRow = {
  key: string;
  label: string;
  group: string;
  /**
   * Actions this screen cannot offer anybody, from its descriptor.
   *
   * A singleton has no add and no delete; `user` has no add; the three profile
   * rows have neither. Rendered as a dash rather than as a disabled checkbox:
   * a box that can never be ticked is a question that should not have been
   * asked, and a disabled one still reads as "off", which is a different claim.
   */
  unavailable: AdminAction[];
  /**
   * Actions only a superuser gets, from `canCreate`/`canDelete: "superuser"`.
   *
   * Also a dash, and for the same reason -- but the reason is worth saying out
   * loud in the cell's title, because "why can I not grant delete on Users"
   * has an answer and it is not "that screen has no delete".
   */
  superuserOnly: AdminAction[];
  grant: Grant;
};

const ACTION_LABEL: Record<AdminAction, string> = {
  view: "View",
  add: "Add",
  change: "Change",
  delete: "Delete",
};

export function AccessMatrix({
  accountId,
  username,
  isSelf,
  initialSuperuser,
  rows,
  listHref,
}: {
  accountId: string;
  username: string;
  /** The signed-in superuser is editing their own account. */
  isSelf: boolean;
  initialSuperuser: boolean;
  rows: MatrixRow[];
  listHref: Route;
}) {
  const [state, action, saving] = useActionState<AccessResult | null, FormData>(
    saveAccess.bind(null, accountId),
    null,
  );
  const router = useRouter();

  const [superuser, setSuperuser] = useState(initialSuperuser);
  const [grants, setGrants] = useState<Record<string, Grant>>(() =>
    Object.fromEntries(rows.map((row) => [row.key, row.grant])),
  );

  /*
   * Announce each result once. `useActionState` hands back the same object
   * until the next submission, so an effect keyed on it alone fires again on
   * every unrelated re-render -- the ref records what has already been spoken.
   * The same guard `record-form.tsx` carries, for the same reason.
   */
  const announced = useRef<AccessResult | null>(null);
  useEffect(() => {
    if (!state || announced.current === state) return;
    announced.current = state;
    if (state.ok) {
      notify(state.notice, "success");
      // The rail this account sees is built from these rows, and the signed-in
      // superuser's own rail is on screen right now. Refreshing is what makes a
      // change to your own account visible without a reload.
      router.refresh();
    } else {
      notify(state.error, "error");
    }
  }, [state, router]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, MatrixRow[]>();
    for (const row of rows) {
      const list = byGroup.get(row.group);
      if (list) list.push(row);
      else byGroup.set(row.group, [row]);
    }
    return [...byGroup];
  }, [rows]);

  /**
   * Whether a cell exists at all for this screen and action, **for the role
   * currently ticked**.
   *
   * Three answers, not two, and conflating the last two is what made this
   * screen lie. `unavailable` is refused to everybody -- a singleton has no
   * add, so no box could ever mean anything. `superuserOnly` is refused to
   * *staff*: `user.delete` and `project-status.delete` are real actions that a
   * superuser really has. Drawing both as a dash meant a superuser's own matrix
   * showed "cannot be granted" beside a Delete they could perform, which is the
   * screen describing the opposite of the truth.
   *
   * So a superuser-only cell is a cell once the role is ticked, and
   * `granting` below fills it.
   */
  const offered = (row: MatrixRow, act: AdminAction) => {
    if (row.unavailable.includes(act)) return false;
    if (row.superuserOnly.includes(act)) return superuser;
    return true;
  };

  /**
   * What a cell shows.
   *
   * **A superuser's boxes do not come from the stored rows**, because neither
   * does their access: `can()` short-circuits on the role before it looks at
   * the grant map, so a superuser with a half-filled `admin_access` set still
   * reaches everything. Rendering those rows would show a matrix of mostly
   * unticked boxes above an account that has every one of them -- which is what
   * this screen did, and what it was reported for.
   *
   * The stored values are still held in state and still shown the moment the
   * role is unticked, so taking the role away reveals what would come back
   * rather than blanking it.
   */
  const shown = (row: MatrixRow, act: AdminAction) =>
    superuser ? true : (grants[row.key] ?? row.grant)[act];

  function setGrant(key: string, next: Grant) {
    setGrants((current) => ({ ...current, [key]: withImpliedView(next) }));
  }

  function toggle(row: MatrixRow, act: AdminAction, on: boolean) {
    const current = grants[row.key] ?? row.grant;
    const next = { ...current, [act]: on };
    /*
     * Unticking View clears the row. The implication runs the other way in
     * `withImpliedView` -- add, change and delete each turn View on -- and
     * without this the two rules disagree: unticking View while Change is
     * ticked would turn View straight back on and look like the click did
     * nothing. Read as an interface, unticking View means "this account has no
     * business on this screen", which is what this does.
     */
    if (act === "view" && !on) {
      setGrant(row.key, { view: false, add: false, change: false, delete: false });
      return;
    }
    setGrant(row.key, next);
  }

  /** Tick or clear every cell a whole group offers. */
  function toggleGroup(rowsInGroup: MatrixRow[], on: boolean) {
    setGrants((current) => {
      const next = { ...current };
      for (const row of rowsInGroup) {
        const grant: Grant = { view: false, add: false, change: false, delete: false };
        if (on) for (const act of ADMIN_ACTIONS) grant[act] = offered(row, act);
        next[row.key] = withImpliedView(grant);
      }
      return next;
    });
  }

  const allOn = (rowsInGroup: MatrixRow[]) =>
    rowsInGroup.every((row) =>
      ADMIN_ACTIONS.every((act) => !offered(row, act) || shown(row, act)),
    );

  /**
   * Fill the whole matrix from a preset.
   *
   * Every cell goes through `offered`, so a preset can never tick something the
   * descriptor refuses -- a singleton has no add whatever a preset says about
   * its group, and a superuser-only action stays out unless the role is ticked.
   * The preset decides the shape; the descriptor still decides what is possible.
   *
   * Nothing is written here. This ticks boxes and the reader presses Save,
   * which is the point: a preset is a starting point to adjust, not a second
   * way to grant.
   */
  function applyPreset(preset: AccessPreset) {
    const wanted = grantsForPreset(preset);
    setGrants(() => {
      const next: Record<string, Grant> = {};
      for (const row of rows) {
        const grant: Grant = { view: false, add: false, change: false, delete: false };
        for (const act of ADMIN_ACTIONS) {
          grant[act] = (wanted[row.key]?.[act] ?? false) && offered(row, act);
        }
        next[row.key] = withImpliedView(grant);
      }
      return next;
    });
  }

  const granted = rows.filter((row) => (grants[row.key] ?? row.grant).view).length;

  return (
    <form action={action} className="space-y-6">
      {/*
        The role, above the matrix and separated from it, because it is not a
        row in it: a superuser's answers do not come from these boxes at all.
      */}
      <fieldset disabled={saving} className="min-w-0">
        <legend className="mb-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
          Role
        </legend>
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3.5 py-3">
          <label className="flex w-fit items-center gap-2.5 text-sm text-zinc-200">
            <input
              type="checkbox"
              name="isSuperuser"
              className="admin-check"
              checked={superuser}
              onChange={(event) => setSuperuser(event.target.checked)}
            />
            Superuser
          </label>
          <p className="mt-2 text-xs text-zinc-500">
            {superuser
              ? "Every screen and every action, including this one and the ones no grant can reach. The boxes below show that, and are not what is stored — untick this to see the grants that would come back."
              : "A superuser answers yes to every screen, and is the only role that can open this page."}
          </p>
          {isSelf && (
            <p className="mt-1.5 text-xs text-amber-500/80">
              This is your own account. You cannot remove your own superuser access.
            </p>
          )}
        </div>
      </fieldset>

      {/*
        Disabled wholesale while the superuser box is ticked. Disabled controls
        do not post, which is exactly right: `saveAccess` takes a ticked
        superuser as "do not touch the grants" and leaves the stored rows where
        they are, so taking the role away later restores what was there.
      */}
      <fieldset disabled={saving || superuser} className="min-w-0 space-y-4">
        <legend className="mb-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
          Screens
        </legend>

        {/*
          Starting points, not roles. Nothing here is stored: a preset fills the
          boxes below and the reader adjusts them and saves, so what ends up in
          `admin_access` is still one row per screen and four booleans. Naming
          them is what makes a hundred and twenty checkboxes approachable
          without inventing a second permission model to keep in step.
        */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-zinc-500">Start from</span>
            {ACCESS_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                title={preset.blurb}
                onClick={() => applyPreset(preset)}
                className="cursor-pointer rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-indigo-700/60 hover:bg-zinc-800 hover:text-indigo-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Each one ticks the boxes below and changes nothing until you save.
            None of them grants anything on Users.
          </p>
        </div>

        {groups.map(([group, rowsInGroup]) => (
          <div key={group} className="overflow-hidden rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 bg-zinc-950/60 px-3 py-2">
              <h2 className="text-xs font-medium tracking-wide text-zinc-300 uppercase">
                {group}
              </h2>
              <span className="text-[0.6875rem] text-zinc-600 tabular-nums">
                {rowsInGroup.length}
              </span>
              <button
                type="button"
                onClick={() => toggleGroup(rowsInGroup, !allOn(rowsInGroup))}
                className="ml-auto cursor-pointer rounded-md border border-zinc-800 px-2 py-1 text-[0.6875rem] text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
              >
                {allOn(rowsInGroup) ? "Clear all" : "Grant all"}
              </button>
            </div>

            {/* Its own scroller. Four columns and a name do not fit a phone,
                and the page body must never scroll sideways. */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-md border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-900 text-left">
                    <th scope="col" className="px-3 py-2 font-medium text-zinc-500">
                      Screen
                    </th>
                    {ADMIN_ACTIONS.map((act) => (
                      <th
                        key={act}
                        scope="col"
                        className="w-20 px-3 py-2 text-center font-medium text-zinc-500"
                      >
                        {ACTION_LABEL[act]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsInGroup.map((row) => {
                    return (
                      <tr key={row.key} className="border-b border-zinc-900 last:border-b-0">
                        <th
                          scope="row"
                          className="px-3 py-2 text-left font-normal whitespace-nowrap text-zinc-300"
                        >
                          {row.label}
                        </th>
                        {ADMIN_ACTIONS.map((act) => (
                          <td key={act} className="px-3 py-2 text-center">
                            {offered(row, act) ? (
                              /*
                                The label wraps the box and nothing else, so its
                                hit area is the box plus its own padding. A
                                label stretched to a table cell is 95% dead
                                space wired to a checkbox -- which is how a
                                click well clear of a control came to flip a
                                published flag on the record forms.
                              */
                              <label className="inline-flex cursor-pointer p-1">
                                <span className="sr-only">
                                  {ACTION_LABEL[act]} {row.label}
                                </span>
                                <input
                                  type="checkbox"
                                  name={`${row.key}.${act}`}
                                  className="admin-check"
                                  checked={shown(row, act)}
                                  onChange={(event) => toggle(row, act, event.target.checked)}
                                />
                              </label>
                            ) : (
                              <span
                                aria-hidden="true"
                                title={
                                  row.superuserOnly.includes(act)
                                    ? `${ACTION_LABEL[act]} on ${row.label} is a superuser action. Give this account the superuser role to grant it.`
                                    : `${row.label} has no ${ACTION_LABEL[act].toLowerCase()}, for anybody.`
                                }
                                className={cn("text-zinc-700")}
                              >
                                —
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </fieldset>

      {state && !state.ok && (
        <p
          role="alert"
          className="rounded-md border border-red-900 bg-red-500/5 px-3 py-2 text-sm text-red-400"
        >
          {state.error}
        </p>
      )}

      {/* The record form's bar, to the pixel: this is a save button on an admin
          form, and it should be in the same place with the same weight. */}
      <div className="sticky bottom-0 -mx-4 flex items-center gap-3 border-t border-zinc-800 bg-black px-4 py-3 lg:-mx-6 lg:px-6">
        <button
          type="submit"
          disabled={saving}
          className="cursor-pointer rounded-full border border-indigo-800 bg-indigo-500/10 px-5 py-1.5 text-sm font-medium text-indigo-300 transition-colors hover:bg-indigo-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:cursor-default disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save"}
        </button>

        <Link
          href={listHref}
          className="rounded-full px-2 py-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
        >
          Cancel
        </Link>

        <span className="ml-auto text-xs text-zinc-600 tabular-nums">
          {superuser ? `${username} has full access` : `${granted} of ${rows.length} screens`}
        </span>
      </div>
    </form>
  );
}
