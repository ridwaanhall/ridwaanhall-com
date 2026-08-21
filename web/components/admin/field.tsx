import { adminDateTime } from "@/lib/admin/format";
import type { ClientField, FormValues } from "@/lib/admin/form";
import { cn } from "@/lib/utils/cn";

/**
 * One labelled input, chosen by the field's `kind`.
 *
 * Uncontrolled -- `defaultValue`, not `value` -- so typing costs no React
 * render and the form works before hydration. A server action is a real form
 * post, so a save issued with JavaScript still loading is submitted by the
 * browser and handled the same way; keeping the inputs uncontrolled is what
 * makes that true rather than nominally true.
 */
const CONTROL =
  "w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors hover:border-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400";

const INVALID = "border-red-800 hover:border-red-700";

export function Field({
  field,
  value,
  error,
}: {
  field: ClientField;
  value: FormValues[string];
  error?: string;
}) {
  const id = `field-${field.name}`;
  const describedBy = [error ? `${id}-error` : null, field.help ? `${id}-help` : null]
    .filter(Boolean)
    .join(" ");

  if (field.readOnly) {
    const shown =
      field.kind === "datetime"
        ? adminDateTime(typeof value === "string" ? value : null)
        : field.kind === "checkbox"
          ? value
            ? "Yes"
            : "No"
          : value === null || value === ""
            ? "—"
            : String(value);

    return (
      <Row field={field} id={id} describedBy={describedBy} error={error}>
        {/* No hidden input alongside it: a read-only field is not submitted at
            all, and `parseFormValues` skips it, so there is nothing a crafted
            POST could put back. Rendering the value as text rather than a
            disabled input says the same thing more plainly. */}
        <p className="px-3 py-1.5 text-sm text-zinc-400">{shown}</p>
      </Row>
    );
  }

  if (field.kind === "checkbox") {
    return (
      <div className="grid gap-1 py-1 sm:grid-cols-3 sm:gap-4">
        <span className="hidden sm:block" aria-hidden="true" />
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              id={id}
              name={field.name}
              defaultChecked={Boolean(value)}
              aria-describedby={describedBy || undefined}
              className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            />
            {field.label}
          </label>
          <Notes id={id} field={field} error={error} />
        </div>
      </div>
    );
  }

  const common = {
    id,
    name: field.name,
    defaultValue: value === null || value === undefined ? "" : String(value),
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? (true as const) : undefined,
    className: cn(CONTROL, error && INVALID),
  };

  return (
    <Row field={field} id={id} describedBy={describedBy} error={error}>
      {field.kind === "textarea" ? (
        <textarea {...common} rows={5} maxLength={field.maxLength} />
      ) : field.kind === "select" ? (
        <select {...common}>
          <option value="">—</option>
          {(field.choices ?? []).map((choice) => (
            <option key={choice.value} value={choice.value}>
              {choice.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          {...common}
          type={
            field.kind === "number"
              ? "number"
              : field.kind === "date"
                ? "date"
                : field.kind === "email"
                  ? "email"
                  : "text"
          }
          // `url` fields take `type="text"`: a browser's URL validation rejects
          // the site-relative paths some of these hold, and the server checks
          // the ones that really are URLs anyway.
          maxLength={field.maxLength}
          min={field.min}
          required={field.required}
        />
      )}
    </Row>
  );
}

function Row({
  field,
  id,
  error,
  children,
}: {
  field: ClientField;
  id: string;
  describedBy: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 py-1 sm:grid-cols-3 sm:gap-4">
      <label htmlFor={id} className="pt-1.5 text-sm text-zinc-400">
        {field.label}
        {field.required && (
          <span className="ml-1 text-red-400" title="Required">
            *
          </span>
        )}
      </label>
      <div className="sm:col-span-2">
        {children}
        <Notes id={id} field={field} error={error} />
      </div>
    </div>
  );
}

function Notes({ id, field, error }: { id: string; field: ClientField; error?: string }) {
  return (
    <>
      {field.help && (
        <p id={`${id}-help`} className="mt-1 text-xs text-zinc-500">
          {field.help}
        </p>
      )}
      {/* `role="alert"` so a validation message is announced when it appears,
          rather than only being visible. */}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </>
  );
}
