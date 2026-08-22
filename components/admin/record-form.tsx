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
 *
 * **The layout is derived from the descriptor, not declared in it.** Every form
 * used to be one 768px column, which on a 1440px screen left a third of the
 * window empty and put the save button four thousand pixels below the title.
 * The shape now follows what the fieldsets contain -- see `splitFieldsets` --
 * so a model gets a sensible layout by declaring fields, which is the same
 * bargain the rest of the admin makes.
 */

/**
 * Where the columns go.
 *
 * Three shapes, chosen by what is in the form rather than by a flag:
 *
 *   editor   A form with a rich-text field is a document with details attached.
 *            The body and everything above it stay in a wide main column; the
 *            fieldsets that follow it -- author, dates, links, placement -- are
 *            the details, and go in a narrower column that stays put while the
 *            body scrolls. Blog posts, projects and the profile are this.
 *   split    No body, but more than one fieldset: they flow two-up.
 *   single   One fieldset has nothing to sit beside, so it keeps a readable
 *            measure instead of stretching to the window.
 *
 * **The split is by position, not by picking fieldsets out.** Fieldsets before
 * the body stay before it and the rest stay after, so the DOM order is the
 * descriptor's order and tabbing runs title, slug, description, body, then the
 * details -- which is also the order someone fills them in.
 */
function splitFieldsets(fieldsets: ClientFieldset[]) {
  const bodyAt = fieldsets.findIndex((fieldset) =>
    fieldset.fields.some((field) => field.kind === "rich-text"),
  );

  if (bodyAt !== -1) {
    return {
      shape: "editor" as const,
      main: fieldsets.slice(0, bodyAt + 1),
      aside: fieldsets.slice(bodyAt + 1),
    };
  }

  return {
    shape: fieldsets.length > 1 ? ("split" as const) : ("single" as const),
    main: fieldsets,
    aside: [],
  };
}
export function RecordForm({
  modelKey,
  id,
  fieldsets,
  inlines = [],
  inlineRows = {},
  values,
  imageUrls,
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
  /**
   * Stored images, resolved to URLs on the server and keyed by input name.
   *
   * See `imageUrlMap`: this file is `"use client"`, which puts `Field` in the
   * client bundle with it, and the storage host is not a `NEXT_PUBLIC_`
   * variable -- so the URL has to arrive already built.
   */
  imageUrls?: Record<string, string>;
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
  const { shape, main, aside } = splitFieldsets(fieldsets);

  const renderFieldset = (fieldset: ClientFieldset, index: number) => (
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
            imageUrls={imageUrls}
          />
        ))}
      </div>
    </fieldset>
  );

  return (
    <form action={action} className="space-y-6">
      {shape === "editor" ? (
        /*
          `items-start` so the details column is only as tall as its contents --
          without it a grid item stretches to the row, and `sticky` inside a
          full-height item has nothing to move against and never sticks.
        */
        <div className="grid items-start gap-6 xl:grid-cols-3">
          <div className="min-w-0 space-y-6 xl:col-span-2">{main.map(renderFieldset)}</div>
          {aside.length > 0 && (
            <div className="min-w-0 space-y-6 xl:sticky xl:top-6">{aside.map(renderFieldset)}</div>
          )}
        </div>
      ) : shape === "split" ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">{main.map(renderFieldset)}</div>
      ) : (
        <div className="max-w-3xl space-y-6">{main.map(renderFieldset)}</div>
      )}

      {/* Inlines are tables of child rows and are the widest thing on the page,
          so they take the whole width whatever the fieldsets above them did. */}
      {inlines.map((inline) => (
        <InlineEditor
          key={inline.name}
          inline={inline}
          imageUrls={imageUrls}
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

      {/*
        Sticky, because these forms are long -- a blog post runs to about seven
        thousand pixels, and the save button used to be all of it away from the
        title. The negative margin lets the bar meet the edges of the admin's
        content column rather than floating inside its padding; the `px-*` puts
        the padding back so the buttons stay where they were.

        Opaque rather than translucent: `backdrop-blur` over a scrolling form is
        a repaint of the whole strip on every frame, and the palette has a solid
        background that reads just as well.
      */}
      <div className="sticky bottom-0 -mx-4 flex items-center gap-2 border-t border-zinc-800 bg-black px-4 py-3 lg:-mx-6 lg:px-6">
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
