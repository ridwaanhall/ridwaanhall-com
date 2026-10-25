"use client";

import { useActionState } from "react";

import { BOXED_LABEL, CONTROL, ERROR_NOTE, PRIMARY_BUTTON } from "@/components/admin/control-classes";
import { restoreFromUpload, type RestoreState } from "@/lib/actions/backup";
import { RESTORE_CONFIRMATION } from "@/lib/backup/order";

/**
 * Upload a backup and replace every row with it.
 *
 * Plain controls -- a native file input and a text box -- so the form posts
 * before the bundle arrives, like every other form here. The typed word is
 * the confirmation, checked again on the server, where it counts.
 */
export function RestoreForm() {
  const [state, action, pending] = useActionState<RestoreState, FormData>(restoreFromUpload, null);

  return (
    <form action={action} className="grid max-w-xl gap-5">
      <label className="grid gap-2">
        <span className="text-sm text-zinc-300">Backup file</span>
        <input name="backup" type="file" accept="application/json,.json" required className={CONTROL} />
      </label>
      <label className="grid gap-2">
        <span className="text-sm text-zinc-300">
          Type <code className="fh-mono text-zinc-100">{RESTORE_CONFIRMATION}</code> to replace every row
        </span>
        <input name="confirm" type="text" autoComplete="off" spellCheck={false} required className={CONTROL} />
      </label>
      <div className={BOXED_LABEL}>
        <button type="submit" disabled={pending} className={PRIMARY_BUTTON}>
          {pending ? "Restoring…" : "Restore"}
        </button>
      </div>
      <div aria-live="polite">
        {state && !state.ok ? <p className={ERROR_NOTE}>{state.error}</p> : null}
        {state?.ok ? (
          <p className="text-sm text-zinc-300">
            Restored {state.rows.toLocaleString("en")} rows across {state.tables} tables. Every public page rebuilds on its next request.
          </p>
        ) : null}
      </div>
    </form>
  );
}
