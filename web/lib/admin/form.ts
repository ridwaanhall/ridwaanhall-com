import type { SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

import type { FilterChoice } from "@/lib/admin/list";
import type { UploadPrefix } from "@/lib/storage/keys";

/**
 * What an admin form is, as data.
 *
 * The changelist is generic because every `list_display` is the same shape; the
 * forms are less uniform, but the *plain* part of them -- a labelled input of a
 * known kind, written to a known column -- is most of every form here and is
 * worth describing once. What is left over (the five JSON editors, the ordered
 * inlines, the image upload) gets its own kinds as it is built, rather than a
 * hand-written form per model.
 *
 * Fields name their column, and **only the declared fields are ever written**.
 * The submitted `FormData` is not iterated: `parseFormValues` walks the
 * descriptor and reads the names it expects, so an extra field posted by hand
 * reaches nothing. That is the same reasoning as the `isCommentable` allowlist
 * in `lib/actions/comments.ts` -- a writable column set that comes from the
 * request is not a column set.
 */
export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "slug"
  | "number"
  | "checkbox"
  | "select"
  | "date"
  | "datetime"
  | "image"
  /** `list[str]`, edited as repeatable rows. Stored as `jsonb`. */
  | "string-list"
  /** `dict[str, str]`, edited as label/description pairs. Stored as `jsonb`. */
  | "key-value"
  /** A foreign key, edited as a select over the referenced rows. */
  | "reference";

export type FormField = {
  /** The key in the loaded row, and the input's `name`. */
  name: string;
  column: PgColumn;
  label: string;
  kind: FieldKind;
  help?: string;
  required?: boolean;
  /** From the column's `varchar(n)`, so the browser and the server agree. */
  maxLength?: number;
  choices?: FilterChoice[];
  min?: number;
  /** Which `upload_to` folder an `image` field writes into. */
  prefix?: UploadPrefix;
  /** Multi-line inputs, for a `string-list` whose entries are prose. */
  multiline?: boolean;
  /** Says so in the UI: the entries are rendered as raw HTML, unescaped. */
  allowsHtml?: boolean;
  /** What one entry is called -- "story", "responsibility", "step". */
  itemLabel?: string;
  /** Column headings for a `key-value` editor. */
  keyLabel?: string;
  valueLabel?: string;
  /** Where a `reference` field's options come from. */
  reference?: ReferenceSource;
  /**
   * Shown but not writable. Django's `readonly_fields`, and the same use: a
   * value the record is identified by rather than edited through.
   */
  readOnly?: boolean;
  /**
   * What to load for display instead of `column`, for a read-only field whose
   * value lives on another table -- a message's author is `user_id` on the row
   * and a username to a person. Only meaningful with `readOnly`, since a write
   * still goes to `column`.
   */
  display?: SQL;
  /**
   * Derive from another field when left blank -- Django's
   * `prepopulated_fields`, moved to the server. Django did it in the browser
   * with JavaScript, which meant a form posted without it stored an empty slug.
   */
  slugFrom?: string;
};

/**
 * The rows a `reference` field offers, and how to label them.
 *
 * Resolved by the page rather than declared inline, the same way the
 * changelist's foreign-key filters are: the options are rows, and a descriptor
 * is data.
 */
export type ReferenceSource = {
  table: PgTable;
  value: PgColumn;
  label: PgColumn;
  /** Offered when the column is nullable. `Award.organization` is not. */
  emptyLabel?: string;
};

export type Fieldset = { title?: string; help?: string; fields: FormField[] };

/**
 * A field as the browser needs it.
 *
 * **The descriptor itself must never cross to a client component.** A
 * `FormField` carries a Drizzle `PgColumn`, and a column holds a reference to
 * its table, which holds every column back again -- so serialising one is an
 * infinite walk, and React answers it with `RangeError: Maximum call stack size
 * exceeded` rather than anything that names the cause. The rendering needs none
 * of it: what is left after dropping `column`, `display` and `slugFrom` is
 * exactly what an input is built from.
 */
export type ClientField = Omit<
  FormField,
  "column" | "display" | "slugFrom" | "reference"
> & {
  /** Resolved options for a `reference` field, loaded by the page. */
  options?: FilterChoice[];
};
export type ClientFieldset = { title?: string; help?: string; fields: ClientField[] };

export function toClientFieldsets(
  model: AdminFormModel,
  /** Options for the `reference` fields, keyed by field name. */
  options: Record<string, FilterChoice[]> = {},
): ClientFieldset[] {
  return model.fieldsets.map((fieldset) => ({
    title: fieldset.title,
    help: fieldset.help,
    // Built up rather than destructured down, so a field gaining a
    // non-serialisable property later is a compile error here and not a
    // stack overflow at render time.
    fields: fieldset.fields.map((field) => ({
      name: field.name,
      label: field.label,
      kind: field.kind,
      help: field.help,
      required: field.required,
      maxLength: field.maxLength,
      choices: field.choices,
      min: field.min,
      prefix: field.prefix,
      multiline: field.multiline,
      allowsHtml: field.allowsHtml,
      itemLabel: field.itemLabel,
      keyLabel: field.keyLabel,
      valueLabel: field.valueLabel,
      readOnly: field.readOnly,
      options: options[field.name],
    })),
  }));
}

export type FormValue = string | number | boolean | null | string[] | Record<string, string>;
export type FormValues = Record<string, FormValue>;

export type ValidationContext = {
  /** `null` when creating. */
  id: number | null;
  /** The staff user doing the editing, for rules about acting on yourself. */
  actorId: number;
};

export type AdminFormModel = {
  /** Matches the registry key, the changelist and the URL. */
  key: string;
  from: PgTable;
  pk: PgColumn;
  fieldsets: Fieldset[];
  /** Names the record in the heading, the toast and the confirm dialog. */
  label: (values: FormValues) => string;
  /**
   * Whether the admin may add and remove rows of this model. Both default to
   * true; each `false` here has a reason recorded at the descriptor -- a
   * guestbook message is written by a reader, an account by a sign-in, a
   * profile row by a signal.
   */
  canCreate?: boolean;
  canDelete?: boolean;
  /** What deleting takes with it, said plainly in the confirm dialog. */
  deleteWarning?: string;
  /**
   * Rules the field kinds cannot express, checked on the server after parsing.
   * Returns a message, or `null` to allow. Async so it can count rows.
   */
  validate?: (values: FormValues, context: ValidationContext) => Promise<string | null>;
};

/** Every field, in order, flattened out of the fieldsets. */
export function formFields(model: AdminFormModel): FormField[] {
  return model.fieldsets.flatMap((fieldset) => fieldset.fields);
}

/** The Drizzle select shape for loading a record into this form. */
export function formSelect(model: AdminFormModel): Record<string, PgColumn | SQL> {
  return Object.fromEntries(
    formFields(model).map((field) => [field.name, field.display ?? field.column]),
  );
}

export type ParseResult =
  | { ok: true; values: FormValues }
  | { ok: false; errors: Record<string, string> };

/**
 * What an optional field left blank stores.
 *
 * Read from the column rather than assumed, because Django's two ways of saying
 * "optional" produce different columns: `blank=True` alone leaves a `NOT NULL`
 * column that holds the empty string, while `blank=True, null=True` allows a
 * real null. Writing `null` into the first raises a not-null violation -- which
 * is what every optional field on the skill form did on the first attempt, since
 * `description`, `icon_svg` and `category` are all `blank=True` and none of them
 * is nullable.
 */
function blankValue(field: FormField): FormValue {
  if (field.kind === "string-list") return [];
  if (field.kind === "key-value") return {};
  if (!field.column.notNull) return null;
  if (field.kind === "number") return 0;
  return "";
}

/**
 * Undo any CRLF the browser introduced.
 *
 * The stored data contains no carriage return at all, and a textarea's
 * *submission* value is CRLF-normalised per the HTML spec. Django sidestepped
 * that by reading `.value` from JavaScript rather than the posted field; here
 * the value really is posted, so it is normalised on arrival.
 *
 * **This is the only normalising these editors do.** Nothing is trimmed: two
 * stored `class` strings contain double spaces, and block text is raw HTML.
 */
function normaliseNewlines(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

/**
 * Read a `string-list` or `key-value` field.
 *
 * Both arrive as JSON in one control rather than as one input per entry. Django
 * had four form-level reasons for that shape, none of which apply here -- they
 * were about `construct_instance`, formset prefixes and textarea CRLF. The
 * reason it is kept is simpler: the value is a list or a mapping, and one
 * control that carries it is one thing to validate rather than N to reassemble.
 */
function parseJsonField(
  field: FormField,
  raw: FormDataEntryValue | null,
): { value: FormValue } | { error: string } {
  const text = typeof raw === "string" ? raw.trim() : "";
  if (!text) return { value: blankValue(field) };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { error: `${field.label} could not be read.` };
  }

  if (field.kind === "string-list") {
    if (!Array.isArray(parsed)) return { error: `${field.label} must be a list.` };
    const out: string[] = [];
    for (const [index, entry] of parsed.entries()) {
      if (typeof entry !== "string") {
        return { error: `Entry ${index + 1} of ${field.label} must be text.` };
      }
      out.push(normaliseNewlines(entry));
    }
    // Empty rows are dropped rather than stored: the editor's "add" button
    // leaves one behind, and a list of blank strings renders as blank bullets.
    return { value: out.filter((entry) => entry !== "") };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: `${field.label} must be a set of label/description pairs.` };
  }
  const out: Record<string, string> = {};
  for (const [key, entry] of Object.entries(parsed)) {
    if (typeof entry !== "string") return { error: `"${key}" in ${field.label} must be text.` };
    if (key === "") continue;
    out[key] = normaliseNewlines(entry);
  }
  return { value: out };
}

const URL_PATTERN = /^https?:\/\/\S+$/i;
const SLUG_PATTERN = /^[-a-z0-9_]+$/;

/**
 * Read the submitted form against the descriptor.
 *
 * Plain text is trimmed, which is what Django's `CharField(strip=True)` did and
 * is not the rule the JSON widgets follow -- those must never normalise, because
 * two stored `class` strings contain double spaces and block text is raw HTML.
 * These are names, slugs and URLs, where a trailing space is a typo.
 */
export function parseFormValues(model: AdminFormModel, data: FormData): ParseResult {
  const values: FormValues = {};
  const errors: Record<string, string> = {};

  for (const field of formFields(model)) {
    if (field.readOnly) continue;
    // Handled by `saveRecord`: an upload is bytes and a network call, and this
    // stays synchronous so it can be reasoned about and tested on its own.
    if (field.kind === "image") continue;

    if (field.kind === "string-list" || field.kind === "key-value") {
      const parsed = parseJsonField(field, data.get(field.name));
      if ("error" in parsed) errors[field.name] = parsed.error;
      else values[field.name] = parsed.value;
      continue;
    }

    if (field.kind === "checkbox") {
      // An unchecked box posts nothing at all, which is why presence is the
      // test and a missing key is `false` rather than an error.
      values[field.name] = data.get(field.name) !== null;
      continue;
    }

    const raw = data.get(field.name);
    const text = typeof raw === "string" ? raw.trim() : "";

    if (!text) {
      if (field.required) {
        errors[field.name] = `${field.label} is required.`;
        continue;
      }
      // A slug left blank is filled from its source below, once every field has
      // been read -- Django's model `save()` did the same, as the backstop
      // behind the browser-side `prepopulated_fields`.
      values[field.name] = blankValue(field);
      continue;
    }

    switch (field.kind) {
      case "number": {
        const parsed = Number(text);
        if (!Number.isInteger(parsed)) {
          errors[field.name] = `${field.label} must be a whole number.`;
        } else if (field.min !== undefined && parsed < field.min) {
          errors[field.name] = `${field.label} cannot be below ${field.min}.`;
        } else {
          values[field.name] = parsed;
        }
        break;
      }
      case "reference": {
        const parsed = Number(text);
        if (!Number.isInteger(parsed) || parsed <= 0) {
          errors[field.name] = `${field.label} is not a valid choice.`;
        } else {
          values[field.name] = parsed;
        }
        break;
      }
      case "select": {
        const allowed = (field.choices ?? []).some((choice) => choice.value === text);
        if (!allowed) errors[field.name] = `${field.label} is not one of the options.`;
        else values[field.name] = text;
        break;
      }
      case "url": {
        if (!URL_PATTERN.test(text)) {
          errors[field.name] = `${field.label} must start with http:// or https://.`;
        } else {
          values[field.name] = text;
        }
        break;
      }
      case "email": {
        if (!text.includes("@")) errors[field.name] = `${field.label} does not look like an email.`;
        else values[field.name] = text;
        break;
      }
      case "slug": {
        if (!SLUG_PATTERN.test(text)) {
          errors[field.name] = "A slug may only contain lowercase letters, numbers, - and _.";
        } else {
          values[field.name] = text;
        }
        break;
      }
      case "date": {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) errors[field.name] = `${field.label} must be a date.`;
        else values[field.name] = text;
        break;
      }
      case "datetime": {
        const when = new Date(text);
        if (Number.isNaN(when.getTime())) errors[field.name] = `${field.label} must be a date and time.`;
        else values[field.name] = when.toISOString();
        break;
      }
      default:
        values[field.name] = text;
    }

    // Checked after coercion so the message names the stored length, not the
    // typed one. The browser enforces it too; that is a convenience, not the rule.
    const stored = values[field.name];
    if (field.maxLength && typeof stored === "string" && stored.length > field.maxLength) {
      errors[field.name] = `${field.label} is limited to ${field.maxLength} characters.`;
    }
  }

  for (const field of formFields(model)) {
    if (field.slugFrom && !values[field.name]) {
      const source = values[field.slugFrom];
      values[field.name] = slugify(typeof source === "string" ? source : "");
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values };
}

/**
 * Django's `slugify`, for the fields that fill themselves in.
 *
 * `lib/utils/format.ts` already carries this rule for blog tags; it is repeated
 * rather than imported because that module is part of the public rendering path
 * and this is a write path, and the two must be free to diverge if Django's
 * `SlugField` and the tag filter ever disagree.
 */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[-\s]+/g, "-");
}

/**
 * The largest upload accepted, and the reason for the number.
 *
 * Vercel caps a serverless request body at 4.5MB, so anything above this
 * would fail as a gateway error with nothing useful to say. Refusing it here
 * means the reader is told, in words, before a byte is sent anywhere.
 */
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/** The name of the checkbox that empties an image field. */
export const clearFieldName = (field: string) => `${field}__clear`;
