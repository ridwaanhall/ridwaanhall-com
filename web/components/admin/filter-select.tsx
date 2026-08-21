"use client";

/**
 * A `list_filter` dropdown that applies itself.
 *
 * It is a plain `<select name=…>` inside the toolbar's `method="get"` form, so
 * the filter is expressed entirely in the URL and the page stays a server
 * render. The only thing this adds is submitting on change: without it the
 * reader has to pick a value and then find the Apply button, which is two steps
 * for what feels like one.
 *
 * The form keeps its submit button regardless, so the toolbar still works with
 * JavaScript unavailable -- the same reason the comment forms are POST-then-
 * redirect while the guestbook posts over fetch.
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
  return (
    <label className="flex items-center gap-1.5 text-xs text-zinc-500">
      {/* Shown at every width. Hiding it below `sm` to save room left two
          dropdowns both reading "All" with nothing to say which was which,
          and the toolbar wraps on a phone anyway, so there was room. */}
      <span>{label}</span>
      <select
        name={name}
        defaultValue={value}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        // A `select` takes its intrinsic width from its widest option, and the
        // category filter reads its options from the data -- one long category
        // name pushed the page 108px past a 360px viewport. Capping it costs
        // nothing: the full text is still there when the list is open.
        className="max-w-56 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:border-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
      >
        <option value="">{anyLabel}</option>
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </label>
  );
}
