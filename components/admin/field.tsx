import { useState } from "react";

import { BOXED_LABEL, CONTROL, INVALID } from "@/components/admin/control-classes";
import { AdminDatePicker, toInputValue } from "@/components/admin/controls/date-picker";
import { AdminSelect } from "@/components/admin/controls/select";
import { ImageField } from "@/components/admin/image-field";
import { KeyValueEditor, StringListEditor } from "@/components/admin/json-fields";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { adminDateTime } from "@/lib/admin/format";
import { optionLabel, type ClientField, type FormValues } from "@/lib/admin/form";
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

export function Field({
  field,
  value,
  error,
  namePrefix = "",
  imageUrls,
}: {
  field: ClientField;
  value: FormValues[string];
  error?: string;
  /** Set for a field inside an inline row: `positions:0:`. */
  namePrefix?: string;
  /**
   * Stored images, resolved to URLs on the server and keyed by input name.
   *
   * This file is in the client bundle, and the storage host is not a
   * `NEXT_PUBLIC_` variable, so calling `mediaUrl` here produced one URL on the
   * server and a different one in the browser -- see `imageUrlMap`.
   */
  imageUrls?: Record<string, string>;
}) {
  const name = `${namePrefix}${field.name}`;
  // The id has to be unique across the page, not only within one row, or a
  // label in the third inline row would focus the input in the first.
  const id = `field-${name.replace(/:/g, "-")}`;
  const describedBy = [error ? `${id}-error` : null, field.help ? `${id}-help` : null]
    .filter(Boolean)
    .join(" ");

  if (field.readOnly) {
    /*
     * A field that is not writable still has to be *readable*, and for a choice
     * that means its label rather than the value behind it: a comment's stored
     * `blog_post` reads as "Blog post", and the key in `target_id` reads as the
     * post it names instead of as 36 characters of uuid.
     *
     * The lookup misses harmlessly for a field carrying a `display`, which
     * loads a name in the column's place -- there is no key to match, and the
     * name is already what should be shown.
     */
    const labelled = (raw: string) =>
      optionLabel(
        (field.choices ?? field.options ?? []).find((choice) => choice.value === raw)?.label,
        raw,
      );

    const shown =
      Array.isArray(value)
        ? value.map((entry) => labelled(String(entry))).join(", ") || "—"
        : field.kind === "datetime"
        ? adminDateTime(typeof value === "string" ? value : null)
        : field.kind === "checkbox"
          ? value
            ? "Yes"
            : "No"
          : value === null || value === ""
            ? "—"
            : labelled(String(value));

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

  if (field.kind === "string-list" || field.kind === "key-value") {
    return (
      <Row field={field} id={id} describedBy={describedBy} error={error}>
        {field.kind === "string-list" ? (
          <StringListEditor name={name} field={field} value={Array.isArray(value) ? value : []} />
        ) : (
          <KeyValueEditor
            name={name}
            field={field}
            value={value && typeof value === "object" && !Array.isArray(value) ? value : {}}
          />
        )}
      </Row>
    );
  }

  if (field.kind === "rich-text") {
    return (
      <Row field={field} id={id} describedBy={describedBy} error={error}>
        <RichTextEditor name={name} value={typeof value === "string" ? value : ""} />
      </Row>
    );
  }

  if (field.kind === "many-to-many") {
    const chosen = new Set((Array.isArray(value) ? value : []).map(String));
    return (
      <Row field={field} id={id} describedBy={describedBy} error={error}>
        <div className="custom-scroll max-h-56 overflow-y-auto rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-2">
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {(field.options ?? []).map((option) => (
              <label key={option.value} className={cn(BOXED_LABEL, "text-sm text-zinc-300")}>
                <input
                  type="checkbox"
                  name={name}
                  value={option.value}
                  defaultChecked={chosen.has(option.value)}
                  className="admin-check"
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </Row>
    );
  }

  if (field.kind === "choice-list") {
    // Server-rendered: the checked boxes post as repeats of one name and nothing
    // needs to be held in state for that to work.
    const chosen = new Set(Array.isArray(value) ? value : []);
    return (
      <Row field={field} id={id} describedBy={describedBy} error={error}>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {(field.choices ?? []).map((choice) => (
            <label key={choice.value} className={cn(BOXED_LABEL, "text-sm text-zinc-300")}>
              <input
                type="checkbox"
                name={name}
                value={choice.value}
                defaultChecked={chosen.has(choice.value)}
                className="admin-check"
              />
              {choice.label}
            </label>
          ))}
        </div>
      </Row>
    );
  }

  if (field.kind === "reference") {
    return (
      <Row field={field} id={id} describedBy={describedBy} error={error}>
        <ValueHolder value={value}>
          {(current, set) => (
            <AdminSelect
              id={id}
              name={name}
              value={current}
              onValueChange={set}
              options={field.options ?? []}
              required={field.required}
              describedBy={describedBy}
              invalid={Boolean(error)}
              className={cn(CONTROL, "admin-select", error && INVALID)}
            />
          )}
        </ValueHolder>
      </Row>
    );
  }

  if (field.kind === "date" || field.kind === "datetime") {
    const withTime = field.kind === "datetime";
    return (
      <Row field={field} id={id} describedBy={describedBy} error={error}>
        <ValueHolder value={value} format={(raw) => toInputValue(raw, withTime)}>
          {(current, set) => (
            <AdminDatePicker
              id={id}
              name={name}
              value={current}
              onValueChange={set}
              withTime={withTime}
              required={field.required}
              describedBy={describedBy}
              invalid={Boolean(error)}
              className={cn(CONTROL, error && INVALID)}
            />
          )}
        </ValueHolder>
      </Row>
    );
  }

  if (field.kind === "image") {
    return (
      <Row field={field} id={id} describedBy={describedBy} error={error}>
        <ImageField
          field={field}
          name={name}
          id={id}
          describedBy={describedBy}
          invalid={Boolean(error)}
          storedKey={typeof value === "string" ? value : ""}
          previewUrl={imageUrls?.[name] ?? ""}
        />
      </Row>
    );
  }

  if (field.kind === "checkbox") {
    return (
      <div className="grid gap-1 py-1 sm:grid-cols-3 sm:gap-4">
        <span className="hidden sm:block" aria-hidden="true" />
        <div className="min-w-0 sm:col-span-2">
          <label className={cn(BOXED_LABEL, "text-sm text-zinc-300")}>
            <input
              type="checkbox"
              id={id}
              name={name}
              defaultChecked={Boolean(value)}
              aria-describedby={describedBy || undefined}
              className="admin-check"
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
    name,
    defaultValue: value === null || value === undefined ? "" : String(value),
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? (true as const) : undefined,
    className: cn(CONTROL, error && INVALID),
  };

  return (
    <Row field={field} id={id} describedBy={describedBy} error={error}>
      {field.kind === "textarea" ? (
        <textarea
          {...common}
          className={cn(common.className, "admin-textarea")}
          rows={5}
          maxLength={field.maxLength}
        />
      ) : field.kind === "select" ? (
        <ValueHolder value={value}>
          {(current, set) => (
            <AdminSelect
              id={id}
              name={name}
              value={current}
              onValueChange={set}
              options={field.choices ?? []}
              required={field.required}
              describedBy={describedBy}
              invalid={Boolean(error)}
              className={cn(common.className, "admin-select")}
            />
          )}
        </ValueHolder>
      ) : (
        <input
          {...common}
          // `date` and `datetime` are handled above, by the picker.
          type={field.kind === "number" ? "number" : field.kind === "email" ? "email" : "text"}
          // `url` fields take `type="text"`: a browser's URL validation rejects
          // the site-relative paths some of these hold, and the server checks
          // the ones that really are URLs anyway.
          className={cn(common.className, field.kind === "number" && "admin-number")}
          maxLength={field.maxLength}
          min={field.min}
          required={field.required}
        />
      )}
    </Row>
  );
}

/**
 * Holds one control's value in state, so the drawn control and the native one
 * behind it are always the same value.
 *
 * A render prop rather than lifting the state into `Field`, because `Field` is
 * a plain function called once per field and cannot own hooks conditionally --
 * the checkbox branch returns long before the select branch is reached, so a
 * `useState` at the top would be a hook whose position depends on `kind`.
 *
 * `format` converts what the record stores into what the input accepts, and
 * runs once: a date column arrives as `YYYY-MM-DD` and a timestamp as a UTC
 * ISO string, neither of which a `datetime-local` input can take as it stands.
 */
function ValueHolder({
  value,
  format = String,
  children,
}: {
  value: FormValues[string];
  format?: (raw: string) => string;
  children: (value: string, set: (next: string) => void) => React.ReactNode;
}) {
  const [current, setCurrent] = useState(() =>
    value === null || value === undefined ? "" : format(String(value)),
  );
  return <>{children(current, setCurrent)}</>;
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
      {/*
        `justify-self-start self-start` keeps the label's box around its word.
        A grid item is stretched to its cell unless told otherwise, and this one
        shares a row with the control it names -- so the box ran the full width
        of the label column and the full height of whatever stood beside it,
        and a label activates its control from anywhere inside its box. Beside a
        rich-text field that was a 230x1257 rectangle of apparently blank page;
        beside an image field, 95% of the cell opened a file picker.
      */}
      <label htmlFor={id} className="justify-self-start self-start pt-1.5 text-sm text-zinc-400">
        {field.label}
        {field.required && (
          <span className="ml-1 text-red-400" title="Required">
            *
          </span>
        )}
      </label>
      {/*
        `min-w-0` is load-bearing, not tidiness. A grid item's `min-width`
        defaults to `auto`, which is its *min-content* width -- so a wide table
        inside the rich-text editor pushed this column to 889px in a 360px
        viewport and took the whole page with it. Every scroll container inside
        is powerless until the item itself is allowed to be narrower than its
        contents.
      */}
      <div className="min-w-0 sm:col-span-2">
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
