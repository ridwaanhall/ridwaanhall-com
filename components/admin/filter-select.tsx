"use client";

import { useId, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { AdminSelect } from "@/components/admin/controls/select";

/**
 * A `list_filter` dropdown that applies itself.
 *
 * The filter is expressed entirely in the URL and the page stays a server
 * render: the control lives inside the toolbar's `method="get"` form and its
 * value becomes a query parameter. The only thing this adds is submitting on
 * change, because otherwise the reader has to pick a value and then find the
 * Apply button, which is two steps for what feels like one.
 *
 * The form keeps its submit button regardless, and `AdminSelect` keeps a real
 * `<select name=…>` underneath, so the toolbar still works with JavaScript
 * unavailable -- the same reason the comment forms are POST-then-redirect while
 * the guestbook posts over fetch.
 */
export function FilterSelect({
  name,
  label,
  value,
  choices,
  anyLabel,
}: {
  name: string;
  label: string;
  value: string;
  choices: { value: string; label: string }[];
  anyLabel: string;
}) {
  const [current, setCurrent] = useState(value);
  const wrapRef = useRef<HTMLDivElement>(null);
  const id = useId();

  /*
   * Submitted from the wrapper rather than from the event's own target.
   *
   * The drawn control is a button in a portal, not the select, so there is no
   * `event.currentTarget.form` to reach for -- and the native select it writes
   * to is `hidden` by then, which is still inside the form but no longer
   * something an event travels up from. Asking the DOM for the enclosing form
   * works whichever of the two the change came from.
   *
   * `requestSubmit` and not `submit`, so the form's own validation and its
   * submit event still run.
   *
   * **The flush is the whole of this working, and is not a tidy-up to remove.**
   * The select this posts through is controlled, so its DOM value changes only
   * when React re-renders -- and React defers a state write made in an event
   * handler until after that handler returns. Submitting on the next line
   * serialises the form while the select still holds the *old* value, so every
   * filter navigated to `?q=&category=` with every parameter blank: the value
   * was written a moment after the browser had already read it. Flushing first
   * puts the value in the DOM while this is still one user gesture. Writing
   * `select.value` by hand would also work and would leave React's copy of the
   * truth disagreeing with the element; deferring the submit to an effect
   * splits one gesture across two turns of the event loop.
   *
   * None of this applies without JavaScript, which is the path that kept
   * working throughout: the browser commits the picked option before it fires
   * `change`, and the toolbar's own submit button posts the form.
   */
  const apply = (next: string) => {
    flushSync(() => setCurrent(next));
    wrapRef.current?.closest("form")?.requestSubmit();
  };

  return (
    <div ref={wrapRef} className="flex items-center gap-1.5 text-xs text-zinc-500">
      {/* Shown at every width. Hiding it below `sm` to save room left two
          dropdowns both reading "All" with nothing to say which was which,
          and the toolbar wraps on a phone anyway, so there was room. */}
      <label htmlFor={id}>{label}</label>
      <AdminSelect
        id={id}
        name={name}
        value={current}
        onValueChange={apply}
        options={choices}
        emptyLabel={anyLabel}
        /*
         * A select takes its intrinsic width from its widest option, and the
         * category filter reads its options from the data -- one long category
         * name pushed the page 108px past a 360px viewport. Capping it costs
         * nothing: the full text is still there when the list is open, and the
         * list is no longer bound to the trigger's width.
         */
        className="admin-select max-w-56 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
        triggerClassName="admin-select w-full max-w-56 rounded-md border border-zinc-800 bg-zinc-900 py-1.5 pl-2 text-xs text-zinc-300 transition-colors hover:border-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      />
    </div>
  );
}
