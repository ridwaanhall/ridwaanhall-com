"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useEscape } from "@/lib/utils/use-modal";
import { useHydrated, useOutsidePointer, usePopoverPosition } from "@/lib/utils/use-popover";
import type { FilterChoice } from "@/lib/admin/list";
import { cn } from "@/lib/utils/cn";

/**
 * A `<select>` whose open list this site actually draws.
 *
 * The closed control was always themeable; the list that drops out of it never
 * was. It is operating-system chrome, in the OS's font and the OS's colours,
 * and it is what a reader spends the whole interaction looking at -- across 22
 * form fields and one filter per changelist.
 *
 * **The native select is still here, and is still what posts.** It renders on
 * the server, carries the `name`, and is hidden only once this component has
 * hydrated and can take over. Three things depend on that and would break if
 * the native element were replaced outright:
 *
 *   - the form saves with JavaScript unavailable, which every other control in
 *     the admin also does;
 *   - `scripts/check-admin.mjs` greps the *server-rendered body* for
 *     `<select name="category">` and counts its options;
 *   - a browser's own autofill and form restoration work on real controls.
 *
 * `hidden` rather than a visually-hidden class, because a hidden form control
 * still submits -- only a `disabled` one does not -- and `hidden` takes it out
 * of the tab order and the accessibility tree in one attribute instead of three
 * that have to agree.
 */

/** Above this many options the panel grows a filter box. */
const FILTER_THRESHOLD = 15;

export function AdminSelect({
  id,
  name,
  value,
  onValueChange,
  options,
  emptyLabel = "—",
  required,
  describedBy,
  invalid,
  className,
  triggerClassName,
}: {
  id?: string;
  name: string;
  /** Controlled, so the native element and the drawn one cannot disagree. */
  value: string;
  onValueChange: (next: string) => void;
  options: FilterChoice[];
  /** The label for the empty choice. Omitted entirely when `required`. */
  emptyLabel?: string;
  required?: boolean;
  describedBy?: string;
  invalid?: boolean;
  /** Applied to the native select, so both look the same before the swap. */
  className?: string;
  /** Applied to the drawn trigger. Defaults to `className`. */
  triggerClassName?: string;
}) {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const filtering = options.length > FILTER_THRESHOLD;

  const visible = useMemo(() => {
    if (!filtering || query.trim() === "") return options;
    const needle = query.trim().toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        (option.group ?? "").toLowerCase().includes(needle),
    );
  }, [options, query, filtering]);

  const selected = options.find((option) => option.value === value) ?? null;

  const close = useCallback(() => {
    // `setQuery("")` is not here: closing is what clears it, and that is done
    // in the render-time adjustment below so the two cannot disagree about
    // when it happens.
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEscape(open, close);
  useOutsidePointer(open, () => setOpen(false), triggerRef, panelRef);
  const placement = usePopoverPosition(open, triggerRef, panelRef);

  /*
   * Both of these are adjustments *during render*, not effects, which is the
   * pattern `search-modal.tsx` uses for the same two moments -- React 19 flags
   * a `setState` in an effect body as a cascading render.
   *
   * Opening puts the highlight on the current value, so a list of eighty-four
   * rows starts where the reader left it rather than at the top. Typing resets
   * it, because a filtered list is a different list and the old index would
   * point past the end of it.
   */
  const [wasOpen, setWasOpen] = useState(open);
  if (wasOpen !== open) {
    setWasOpen(open);
    if (open) {
      const at = options.findIndex((option) => option.value === value);
      setHighlighted(at === -1 ? 0 : at);
    } else {
      setQuery("");
    }
  }

  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setHighlighted(0);
  }

  // Focus is a DOM side effect, not state, so it genuinely belongs here.
  useEffect(() => {
    if (open && filtering) filterRef.current?.focus();
  }, [open, filtering]);

  const choose = (next: string) => {
    onValueChange(next);
    close();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlighted((current) => {
        if (visible.length === 0) return 0;
        const step = event.key === "ArrowDown" ? 1 : -1;
        return (current + step + visible.length) % visible.length;
      });
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      if (!open) return;
      event.preventDefault();
      setHighlighted(event.key === "Home" ? 0 : Math.max(0, visible.length - 1));
      return;
    }
    if (event.key === "Enter" || (event.key === " " && !filtering)) {
      if (!open) {
        event.preventDefault();
        setOpen(true);
        return;
      }
      event.preventDefault();
      const option = visible[highlighted];
      if (option) choose(option.value);
      return;
    }
    if (event.key === "Tab" && open) setOpen(false);
  };

  return (
    <>
      {/*
        The value lives here. It is `value`/`onChange` rather than
        `defaultValue` from the first render so the element never switches
        between controlled and uncontrolled -- React warns about that, and the
        switch would happen exactly at hydration, where it is hardest to see.
      */}
      <select
        /*
         * `name` first, deliberately. React emits attributes in the order they
         * are written, and `scripts/check-admin.mjs` greps the response body
         * for the literal `<select name="category"` -- an `id` in front of it
         * is invisible to `tsc`, to `eslint` and to a browser, and turns that
         * check red.
         */
        name={name}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        id={hydrated ? undefined : id}
        hidden={hydrated}
        required={required}
        aria-describedby={describedBy || undefined}
        aria-invalid={invalid ? true : undefined}
        className={className}
      >
        {!required && <option value="">{emptyLabel}</option>}
        <Grouped options={options} />
      </select>

      {hydrated && (
        <button
          ref={triggerRef}
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-haspopup="listbox"
          aria-describedby={describedBy || undefined}
          aria-invalid={invalid ? true : undefined}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={onKeyDown}
          className={cn(
            "admin-select flex items-center justify-between text-left",
            triggerClassName ?? className,
          )}
        >
          <span className={cn("truncate", !selected && "text-zinc-500")}>
            {selected ? selected.label : emptyLabel}
          </span>
        </button>
      )}

      {hydrated &&
        open &&
        createPortal(
          <div
            ref={panelRef}
            className="admin-popover custom-scroll fixed z-50 overflow-y-auto"
            style={{
              top: placement?.top ?? -9999,
              left: placement?.left ?? -9999,
              minWidth: placement?.width ?? undefined,
              maxHeight: "min(20rem, 60vh)",
              // Hidden until measured. Without this the panel paints once at
              // the fallback coordinates and jumps, which reads as a flicker
              // in the corner of the screen.
              visibility: placement ? "visible" : "hidden",
            }}
          >
            {filtering && (
              <div className="sticky top-0 border-b border-zinc-800 bg-zinc-950 p-1.5">
                <input
                  ref={filterRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Type to filter…"
                  aria-label="Filter the options"
                  aria-controls={listId}
                  className="w-full rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-400"
                />
              </div>
            )}

            <ul id={listId} role="listbox" className="py-1">
              {!required && query.trim() === "" && (
                <Option
                  label={emptyLabel}
                  selected={value === ""}
                  highlighted={false}
                  onPick={() => choose("")}
                />
              )}

              {visible.map((option, index) => (
                <li key={`${option.group ?? ""}:${option.value}`}>
                  {/* The group heading is printed with the first row that
                      carries it rather than by grouping the array, so a filter
                      that removes every row of a group removes its heading
                      too, instead of leaving one standing over nothing. */}
                  {option.group && option.group !== visible[index - 1]?.group && (
                    <div
                      role="presentation"
                      className="px-3 pt-2 pb-1 text-[0.625rem] font-medium tracking-wide text-zinc-500 uppercase"
                    >
                      {option.group}
                    </div>
                  )}
                  <Option
                    label={option.label}
                    selected={option.value === value}
                    highlighted={index === highlighted}
                    onPick={() => choose(option.value)}
                  />
                </li>
              ))}

              {visible.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-zinc-500">Nothing matches.</li>
              )}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}

function Option({
  label,
  selected,
  highlighted,
  onPick,
}: {
  label: string;
  selected: boolean;
  highlighted: boolean;
  onPick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep the highlight in view when the arrows walk past the edge of the panel.
  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={selected}
      data-highlighted={highlighted ? "true" : undefined}
      /*
       * `onMouseDown` with the default prevented, not `onClick`. The panel is
       * portalled and the trigger keeps focus; a plain click would let the
       * pointer-down blur something first, and on a filtered list that closed
       * the panel before the click could land on the row underneath.
       */
      onMouseDown={(event) => {
        event.preventDefault();
        onPick();
      }}
      className="admin-option flex items-center justify-between gap-2 px-3 py-1.5 text-sm"
    >
      <span className="truncate">{label}</span>
    </div>
  );
}

/** The native element's own options, grouped the way the drawn list groups. */
function Grouped({ options }: { options: FilterChoice[] }) {
  if (!options.some((option) => option.group)) {
    return (
      <>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </>
    );
  }

  const groups: { label: string; options: FilterChoice[] }[] = [];
  for (const option of options) {
    const label = option.group ?? "";
    const last = groups.at(-1);
    if (last && last.label === label) last.options.push(option);
    else groups.push({ label, options: [option] });
  }

  return (
    <>
      {groups.map((group) => (
        <optgroup key={group.label} label={group.label}>
          {group.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
