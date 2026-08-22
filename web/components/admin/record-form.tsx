"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useTransition } from "react";

import { Field } from "@/components/admin/field";
import { InlineEditor, type ClientInline, type InlineRow } from "@/components/admin/inline-editor";
import { useConfirm } from "@/components/providers/confirm-dialog";
import { deleteRecord, saveRecord, type SaveResult } from "@/lib/actions/admin";
import type { ClientFieldset, FormValues } from "@/lib/admin/form";
import { notify } from "@/lib/notify";

/**
 * The change form.
 *
 * A real `<form action={…}>` bound to a server action, so it posts and saves
 * with JavaScript unavailable -- the same property the comment forms have and
 * for the same reason. What JavaScript adds is the toast, the pending state and
 * the field-level errors staying put without a reload.
 *
 * **The wording is the server's.** `saveRecord` returns "Saved." / "Created." /
 * "Deleted." and this hands them straight to `notify()`. Django's admin says
 * the same kind of thing through `django.contrib.messages`; putting the strings
 * in the client would be the second definition that the guestbook and comments
 * deliberately avoid.
 */
export function RecordForm({
  modelKey,
  id,
  fieldsets,
  inlines = [],
  inlineRows = {},
  values,
  label,
  typeLabel,
  canDelete,
  deleteWarning,
  listHref,
}: {
  modelKey: string;
  /** `null` when creating. */
  id: number | null;
  fieldsets: ClientFieldset[];
  inlines?: ClientInline[];
  /** The child rows of each inline, keyed by the inline's name. */
  inlineRows?: Record<string, InlineRow[]>;
  values: FormValues;
  /** The record, named -- shown quoted in the confirm dialog. */
  label: string;
  /** The model, named -- "Skill", "Message". */
  typeLabel: string;
  canDelete: boolean;
  deleteWarning?: string;
  listHref: Route;
}) {
  const [state, action, saving] = useActionState<SaveResult | null, FormData>(
    saveRecord.bind(null, modelKey, id),
    null,
  );
  const [deleting, startDelete] = useTransition();
  const confirm = useConfirm();
  const router = useRouter();

  /*
   * Announce each result once.
   *
   * `useActionState` hands back the same object until the next submission, and
   * an effect keyed on it alone fires again on every unrelated re-render. The
   * ref records which result has already been spoken, so a re-render caused by
   * anything else stays silent.
   */
  const announced = useRef<SaveResult | null>(null);
  useEffect(() => {
    if (!state || announced.current === state) return;
    announced.current = state;
    if (state.ok) notify(state.notice, "success");
    else notify(state.error, "error");
  }, [state]);

  const fieldErrors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  async function onDelete() {
    const confirmed = await confirm({
      title: `Delete this ${typeLabel.toLowerCase()}?`,
      message: deleteWarning ?? "This cannot be undone.",
      detail: label,
      label: "Delete",
      variant: "danger",
    });
    if (!confirmed) return;

    startDelete(async () => {
      const result = await deleteRecord(modelKey, id as number);
      if (!result.ok) {
        notify(result.error, "error");
        return;
      }
      // The record is gone, so its own page is not somewhere to stay. The list
      // is refreshed as well: the action revalidated it on the server, but the
      // client cache is what this navigation reads.
      notify(result.notice, "success");
      router.push(listHref);
      router.refresh();
    });
  }

  const busy = saving || deleting;

  return (
    <form action={action} className="space-y-6">
      {fieldsets.map((fieldset, index) => (
        <fieldset key={fieldset.title ?? index} disabled={busy} className="min-w-0">
          {fieldset.title && (
            <legend className="mb-1 text-xs font-medium tracking-wide text-zinc-500 uppercase">
              {fieldset.title}
            </legend>
          )}
          {fieldset.help && <p className="mb-2 text-xs text-zinc-500">{fieldset.help}</p>}
          <div className="divide-y divide-zinc-900 rounded-lg border border-zinc-800 px-3 py-2">
            {fieldset.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                value={values[field.name] ?? null}
                error={fieldErrors[field.name]}
              />
            ))}
          </div>
        </fieldset>
      ))}

      {inlines.map((inline) => (
        <InlineEditor
          key={inline.name}
          inline={inline}
          rows={inlineRows[inline.name] ?? []}
          errors={fieldErrors}
        />
      ))}

      {/* The form-level message, for a rule no single field owns -- the pin cap,
          or removing your own staff access. Field-level problems are shown at
          the field and summarised here as one line. */}
      {state && !state.ok && (
        <p role="alert" className="rounded-md border border-red-900 bg-red-500/5 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full border border-indigo-800 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 transition-colors hover:bg-indigo-500/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:opacity-60"
        >
          {saving ? "Saving…" : id === null ? "Create" : "Save"}
        </button>

        {canDelete && id !== null && (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="ml-auto rounded-full border border-zinc-800 px-4 py-1.5 text-sm text-red-400 transition-colors hover:border-red-900 hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </form>
  );
}
