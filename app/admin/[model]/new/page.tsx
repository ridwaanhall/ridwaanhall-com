import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BackIcon } from "@/components/admin/admin-icons";
import { RecordForm } from "@/components/admin/record-form";
import { toClientFieldsets, toClientInlines } from "@/lib/admin/form";
import { formModelFor } from "@/lib/admin/models";
import { blankFormValues, loadReferenceOptions } from "@/lib/admin/record";
import { adminPath, ADMIN_ENTRIES_BY_KEY } from "@/lib/admin/registry";
import { permits } from "@/lib/auth/permissions";
import { getStaffUser, requireStaff } from "@/lib/auth/staff";

/**
 * The add form.
 *
 * Static, so it takes precedence over `[id]` and `new` can never be read as a
 * record id. It answers not-found for a model with no form, for one whose
 * descriptor refuses creation, and for an account without `add` on the screen
 * -- an account is made by a sign-in, a guestbook message by a reader, a
 * profile row by a signal, and offering an empty form for any of those is
 * offering something that cannot work. `saveRecord` refuses each case again on
 * the server, since a form that is not rendered is not a form that cannot be
 * posted.
 *
 * The three questions are one call: `permits` combines the descriptor's flag
 * with this account's grant, and it is the only thing that reads the flag.
 * `canCreate` is `boolean | "superuser"`, so the `!== false` this used to test
 * would read the third state as *allowed* and hand every staff account an add
 * form for accounts.
 */
type Params = { params: Promise<{ model: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { model } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(model);
  // The same condition the page 404s on, so a refused route does not sit in the
  // browser's tab and history offering to add something it will not add.
  const form = entry ? formModelFor(entry.key) : null;
  // The actor, because "may this be added" now depends on who is asking. Free:
  // `getStaffUser` is memoised per request and the layout has already run it.
  const actor = await getStaffUser();
  const offered =
    entry && !entry.section && form && actor && permits(actor, entry.key, "add", form);
  return { title: offered ? `Add ${entry.label.toLowerCase()} · Admin` : "Admin" };
}

/**
 * Never prerendered, for the same reasons as the changelist beside it: the first
 * thing this page does is read the session, so there is no shell to build ahead
 * of the request.
 */
export const instant = false;

export default async function AdminCreatePage({ params }: Params) {
  const actor = await requireStaff();

  const { model: key } = await params;
  const entry = ADMIN_ENTRIES_BY_KEY.get(key);
  const form = formModelFor(key);
  if (!entry || entry.section || !form) notFound();
  if (!permits(actor, key, "add", form)) notFound();

  const referenceOptions = await loadReferenceOptions(form);
  // Through `adminPath` rather than composing the key back into a path here.
  // A second way of writing an admin URL is exactly the drift that having one
  // function for it exists to prevent.
  const listHref = adminPath(entry) as Route;

  return (
    <div className="admin-fade space-y-5">
      <Link
        href={listHref}
        className="inline-flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-indigo-400"
      >
        <BackIcon height={14} width={14} />
        {entry.labelPlural}
      </Link>

      <div>
        <h1 className="text-xl font-medium text-zinc-100">Add {entry.label.toLowerCase()}</h1>
        <p className="mt-1 text-sm text-zinc-500">{entry.blurb}</p>
      </div>

      <RecordForm
        modelKey={key}
        id={null}
        fieldsets={toClientFieldsets(form, referenceOptions)}
        inlines={toClientInlines(form, referenceOptions)}
        values={blankFormValues(form)}
        label={entry.label}
        typeLabel={entry.label}
        canSave
        canDelete={false}
        listHref={listHref}
      />
    </div>
  );
}
