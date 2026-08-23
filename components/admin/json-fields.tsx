"use client";

import { useState } from "react";

import { CloseIcon, PlusIcon } from "@/components/admin/admin-icons";
import type { ClientField } from "@/lib/admin/form";

/**
 * The structured editors for the `jsonb` columns.
 *
 * Two editors, not five. The three that are gone had nothing left to edit: two
 * served a privacy-policy model that no longer exists, and the third edited
 * a post's body, which is `content_html` and a rich-text editor instead.
 *
 * **The value travels in one control, not one input per entry.** The value is a
 * list or a mapping, and one control carrying it whole is one thing to validate
 * rather than N to reassemble in the right order -- and a cleared list still
 * arrives as an empty list rather than as nothing at all.
 *
 * It also means these degrade honestly. A client component still renders on the
 * server, so with JavaScript unavailable the rows are visible and the hidden
 * control carries the stored value -- editing does nothing, but saving the
 * record does not blank the field.
 */

const CONTROL =
  "w-full rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors hover:border-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

const ICON_BUTTON =
  "rounded-md border border-zinc-800 px-1.5 py-1 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-30 disabled:hover:bg-transparent";

const ADD_BUTTON =
  "inline-flex items-center gap-1 rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200";

export function StringListEditor({
  name,
  field,
  value,
}: {
  /** Already prefixed by `Field`, so these work inside an inline row too. */
  name: string;
  field: ClientField;
  value: string[];
}) {
  const [items, setItems] = useState<string[]>(value);
  const noun = field.itemLabel ?? "entry";

  const update = (index: number, next: string) =>
    setItems(items.map((item, position) => (position === index ? next : item)));

  /**
   * Up and down rather than drag.
   *
   * List order is real -- `jsonb` preserves array order, and these render as
   * ordered steps and numbered bullets -- so reordering has to be possible.
   * Buttons work with a keyboard, a screen reader and a thumb without any of
   * the announcement and focus-management work a drag surface needs to be
   * usable by all three.
   */
  const move = (index: number, by: number) => {
    const target = index + by;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(items)} />

      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-1.5">
          <span className="w-5 pt-1.5 text-right text-xs text-zinc-600 tabular-nums">
            {index + 1}
          </span>
          {field.multiline ? (
            <textarea
              value={item}
              rows={2}
              onChange={(event) => update(index, event.target.value)}
              aria-label={`${noun} ${index + 1}`}
              className={CONTROL}
            />
          ) : (
            <input
              type="text"
              value={item}
              onChange={(event) => update(index, event.target.value)}
              aria-label={`${noun} ${index + 1}`}
              className={CONTROL}
            />
          )}
          <div className="flex shrink-0 gap-1 pt-0.5">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              className={ICON_BUTTON}
              aria-label={`Move ${noun} ${index + 1} up`}
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === items.length - 1}
              className={ICON_BUTTON}
              aria-label={`Move ${noun} ${index + 1} down`}
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => setItems(items.filter((_, position) => position !== index))}
              className={ICON_BUTTON}
              aria-label={`Remove ${noun} ${index + 1}`}
            >
              <CloseIcon height={12} width={12} />
            </button>
          </div>
        </div>
      ))}

      {items.length === 0 && <p className="text-xs text-zinc-500">No {noun} entries yet.</p>}

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setItems([...items, ""])} className={ADD_BUTTON}>
          <PlusIcon height={12} width={12} />
          Add {noun}
        </button>
        {field.allowsHtml && (
          <span className="text-xs text-zinc-500">
            Rendered as raw HTML — tags like &lt;strong&gt; work here.
          </span>
        )}
      </div>
    </div>
  );
}

export function KeyValueEditor({
  name,
  field,
  value,
}: {
  name: string;
  field: ClientField;
  value: Record<string, string>;
}) {
  /**
   * Held as pairs, not as the object itself, so a label can be edited a
   * character at a time without the row jumping or colliding with its
   * neighbour halfway through a rename.
   */
  const [pairs, setPairs] = useState<[string, string][]>(() => Object.entries(value));

  const update = (index: number, key: string, entry: string) =>
    setPairs(pairs.map((pair, position) => (position === index ? [key, entry] : pair)));

  const asObject = Object.fromEntries(pairs.filter(([key]) => key !== ""));

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(asObject)} />

      {pairs.map(([key, entry], index) => (
        <div key={index} className="flex items-start gap-1.5">
          <input
            type="text"
            value={key}
            onChange={(event) => update(index, event.target.value, entry)}
            placeholder={field.keyLabel ?? "Label"}
            aria-label={`${field.keyLabel ?? "Label"} ${index + 1}`}
            className={`${CONTROL} w-1/3`}
          />
          <textarea
            value={entry}
            rows={2}
            onChange={(event) => update(index, key, event.target.value)}
            placeholder={field.valueLabel ?? "Description"}
            aria-label={`${field.valueLabel ?? "Description"} ${index + 1}`}
            className={CONTROL}
          />
          <button
            type="button"
            onClick={() => setPairs(pairs.filter((_, position) => position !== index))}
            className={`${ICON_BUTTON} mt-0.5 shrink-0`}
            aria-label={`Remove entry ${index + 1}`}
          >
            <CloseIcon height={12} width={12} />
          </button>
        </div>
      ))}

      {pairs.length === 0 && <p className="text-xs text-zinc-500">No entries yet.</p>}

      {/*
        No reordering here, and that is deliberate rather than unfinished.
        Production stores these as Postgres `jsonb`, which normalises object key
        order -- a reorder control would appear to work locally and be a silent
        no-op live. List order *is* preserved, which is why the string list above
        does offer it.
      */}
      <button type="button" onClick={() => setPairs([...pairs, ["", ""]])} className={ADD_BUTTON}>
        <PlusIcon height={12} width={12} />
        Add entry
      </button>
    </div>
  );
}
