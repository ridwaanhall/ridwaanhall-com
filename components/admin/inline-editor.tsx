"use client";

import { useState } from "react";

import { CloseIcon, PlusIcon } from "@/components/admin/admin-icons";
import { Field } from "@/components/admin/field";
import { inlineCountName, INLINE_ID, type ClientField, type FormValues } from "@/lib/admin/form";

/**
 * The child rows of a record, edited on the record's own screen.
 *
 * **A row's position in the list is its order**, and every field name is
 * derived from the array index, so moving a row renumbers its inputs and the
 * server writes the new position straight into the order column. There is no
 * separate order input that could disagree with what is on screen -- which is
 * exactly what goes wrong when a row is inserted between two others and the
 * numbers are carried in fields of their own.
 *
 * Removing a row drops it from the array and its inputs go with it. The server
 * treats an id it stored but did not receive as deleted, so nothing has to
 * carry a "delete me" flag either.
 */
export type ClientInline = {
  name: string;
  title: string;
  help?: string;
  itemLabel: string;
  fields: ClientField[];
  ordered: boolean;
};

export type InlineRow = FormValues & { __id: string | null };

const ICON_BUTTON =
  "rounded-md border border-zinc-800 px-1.5 py-1 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent";

export function InlineEditor({
  imageUrls,
  inline,
  rows: initial,
  errors,
}: {
  /** Stored images for this inline's rows, resolved server-side. See `Field`. */
  imageUrls?: Record<string, string>;
  inline: ClientInline;
  rows: InlineRow[];
  errors: Record<string, string>;
}) {
  /*
   * Keyed separately from the array index, so React keeps an input's DOM node
   * with its row when the row moves. Keying on the index instead would move the
   * *values* between nodes and take focus and cursor position with them.
   */
  const [rows, setRows] = useState(() =>
    initial.map((row, index) => ({ key: `existing-${row.__id ?? index}`, row })),
  );
  const [nextKey, setNextKey] = useState(0);

  const move = (index: number, by: number) => {
    const target = index + by;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
  };

  return (
    <fieldset className="min-w-0">
      <legend className="mb-1.5 text-xs font-medium tracking-wide text-zinc-400 uppercase">
        {inline.title}
      </legend>
      {inline.help && <p className="mb-2 text-xs text-zinc-500">{inline.help}</p>}

      <input type="hidden" name={inlineCountName(inline.name)} value={rows.length} />

      <div className="space-y-2">
        {rows.map(({ key, row }, index) => (
          <div key={key} className="rounded-lg border border-zinc-800 bg-zinc-950/40 px-3.5 py-2">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-1.5">
              <span className="text-xs text-zinc-600 tabular-nums">
                {inline.itemLabel} {index + 1}
              </span>
              <div className="ml-auto flex gap-1">
                {inline.ordered && (
                  <>
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className={ICON_BUTTON}
                      aria-label={`Move ${inline.itemLabel} ${index + 1} up`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === rows.length - 1}
                      className={ICON_BUTTON}
                      aria-label={`Move ${inline.itemLabel} ${index + 1} down`}
                    >
                      ↓
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setRows(rows.filter((_, position) => position !== index))}
                  className={ICON_BUTTON}
                  aria-label={`Remove ${inline.itemLabel} ${index + 1}`}
                >
                  <CloseIcon height={12} width={12} />
                </button>
              </div>
            </div>

            {/* Empty for a row the editor just added, which is how the server
                tells an insert from an update. Present even when empty: an
                absent marker means the row was not submitted at all. */}
            <input
              type="hidden"
              name={`${inline.name}:${index}:${INLINE_ID}`}
              value={row.__id ?? ""}
            />

            <div className="divide-y divide-zinc-900">
              {inline.fields.map((field) => (
                <Field
                  imageUrls={imageUrls}
                  key={field.name}
                  field={field}
                  namePrefix={`${inline.name}:${index}:`}
                  value={row[field.name] ?? null}
                  error={errors[`${inline.name}:${index}:${field.name}`]}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-800 px-3.5 py-4 text-center text-xs text-zinc-500">
          No {inline.itemLabel} rows yet.
        </p>
      )}

      <button
        type="button"
        onClick={() => {
          setRows([...rows, { key: `new-${nextKey}`, row: blankRow(inline) }]);
          setNextKey(nextKey + 1);
        }}
        className="mt-2.5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      >
        <PlusIcon height={12} width={12} />
        Add {inline.itemLabel}
      </button>
    </fieldset>
  );
}

function blankRow(inline: ClientInline): InlineRow {
  const row: InlineRow = { __id: null };
  for (const field of inline.fields) {
    row[field.name] = field.kind === "checkbox" ? false : field.kind === "string-list" ? [] : null;
  }
  return row;
}
