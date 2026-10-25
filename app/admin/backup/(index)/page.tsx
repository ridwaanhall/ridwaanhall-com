import type { Metadata } from "next";

import { RestoreForm } from "@/components/admin/restore-form";
import { SECTION_TITLE, PRIMARY_BUTTON } from "@/components/admin/control-classes";
import { ScreenHead } from "@/components/admin/screen-head";
import { requireSuperuser } from "@/lib/auth/staff";

/**
 * Back up the database, or restore it from a backup. Superuser only.
 *
 * **Not a registry entry.** The registry's screens are a descriptor pair or a
 * `custom` changelist, and this is neither: there are no rows to list. It is a
 * static segment, which beats `[model]`, linked from the admin index for a
 * superuser. `requireSuperuser()` is the gate, and the download route and the
 * restore action each ask again for themselves.
 */
export const metadata: Metadata = {
  title: "Backup · Admin",
};

export const instant = false;

export default async function AdminBackupPage() {
  await requireSuperuser();

  return (
    <div className="admin-fade space-y-12">
      <ScreenHead
        title="Backup"
        lead="Every row of the database, out to one file and back in. Uploaded images stay in Supabase Storage; a backup keeps their keys, so a restored database pointed at the same bucket shows them."
      />

      <section className="grid max-w-2xl gap-4">
        <h2 className={SECTION_TITLE}>Download a backup</h2>
        <p className="text-[15px] leading-relaxed text-zinc-400">
          One JSON file with all of it, accounts and their email addresses included. Keep it somewhere private.
        </p>
        <div>
          {/* A plain link: the route answers with an attachment, so the browser saves it. */}
          <a href="/api/admin/backup" className={`${PRIMARY_BUTTON} inline-block`} download>
            Download backup
          </a>
        </div>
      </section>

      <section className="grid max-w-2xl gap-4 border-t border-zinc-800 pt-10">
        <h2 className={SECTION_TITLE}>Restore from a backup</h2>
        <p className="text-[15px] leading-relaxed text-zinc-400">
          <strong className="text-zinc-200">This replaces every row in the database</strong> with the file&apos;s, in one
          transaction: it all succeeds or nothing changes. Accounts are restored too, so a file without your own account
          locks you out of this admin. Download a backup first. A file over 4MB is too large to upload
          here; restore it with <code className="fh-mono">npx tsx scripts/backup.mjs restore &lt;file&gt;</code> instead.
        </p>
        <RestoreForm />
      </section>
    </div>
  );
}
