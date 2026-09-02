import type { SQL } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";
import { normaliseNewlines } from "@/lib/utils/newlines";
import { isUuid } from "@/lib/utils/uuid";

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
  /** `list[str]` from a fixed vocabulary, edited as checkboxes. Stored as `jsonb`. */
  | "choice-list"
  /** A foreign key, edited as a select over the referenced rows. */
  | "reference"
  /** HTML, edited with the rich-text editor and sanitised on save. */
  | "rich-text"
  /** A many-to-many, edited as a checklist over the referenced rows. */
  | "many-to-many";

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
  /**
   * Where a `reference` field's options come from. A list for a column whose
   * target is polymorphic -- `comment.target_id` is a blog post or a project --
   * in which case each source needs a `groupLabel` to head its rows.
   */
  reference?: ReferenceSource | ReferenceSource[];
  /** The join table behind a `many-to-many` field. */
  manyToMany?: ManyToManySource;
  /**
   * Shown but not writable: a value the record is identified by rather than
   * edited through.
   *
   * `"afterCreate"` is the third state, and it exists because several records
   * are *about* somebody: a guestbook message, a comment, a reader's profile
   * all name an account. Which account has to be chosen when the row is made
   * and must never be changed afterwards -- reassigning one moves what a
   * person said onto somebody else's name. A plain boolean cannot say that,
   * so it said "never writable", and those models could not be created at all.
   *
   * Resolved by `formFieldsFor`, which every reader goes through. Only
   * meaningful on a form's own fields: an inline row is created and removed
   * with its parent and has no equivalent question.
   */
  readOnly?: boolean | "afterCreate";
  /**
   * What to load for display instead of `column`, for a read-only field whose
   * value lives on another table -- a message's author is `user_id` on the row
   * and a username to a person. Only meaningful with `readOnly`, since a write
   * still goes to `column`.
   */
  display?: SQL;
  /**
   * Derive from another field when left blank -- a slug from a title, say.
   * Done on the server, deliberately: a browser-side version of this stores an
   * empty slug the moment the form is posted with JavaScript unavailable.
   */
  slugFrom?: string;
};

/**
 * The text an option shows, falling back to its key when nothing labels it.
 *
 * One rule, because four places used to build a label independently and three
 * of them wrote `label ?? value` -- which catches null and lets `""` straight
 * through. That is not a hypothetical: `location`'s three name parts are each
 * `NOT NULL DEFAULT ''` because a country with no city is a real place, so a
 * country-only row labelled by its city column labelled itself with nothing,
 * and the dropdown drew a blank, clickable strip.
 *
 * Falling back to the key rather than dropping the row: a row that exists and
 * cannot be named is still a row somebody may need to point at, and a bare
 * identifier reads as obviously wrong, which is how it gets fixed. Dropping it
 * would hide both the row and the fault.
 */
export function optionLabel(label: unknown, value: unknown): string {
  const text = label == null ? "" : String(label).trim();
  return text || String(value);
}

/** The columns a composed label is built from. */
export type LabelParts = Record<string, PgColumn>;

/**
 * A label no single column holds.
 *
 * `location` is the case that needed it -- city, region and country are three
 * columns and the label is all of them -- and the join rule already exists as a
 * pure, tested function on the read side, so this carries the columns to select
 * and lets that function do the joining. Composed here rather than in SQL for
 * that reason: a `concat_ws` doing the same work is the same rule written twice,
 * in two languages, free to drift.
 */
export type ComposedLabel<P extends LabelParts = LabelParts> = {
  parts: P;
  format: (row: { [K in keyof P]: string | null }) => string;
};

/** How a row is labelled: one column, or several and a way to join them. */
export type ReferenceLabel = PgColumn | ComposedLabel;

/**
 * Declare a composed label.
 *
 * A function rather than an object literal so the part names are inferred at
 * the call site: `format` is then typed against the exact columns named beside
 * it, and handing it a formatter expecting different ones is a type error
 * rather than a blank dropdown.
 */
export function composedLabel<P extends LabelParts>(
  parts: P,
  format: (row: { [K in keyof P]: string | null }) => string,
): ComposedLabel {
  return { parts, format } as ComposedLabel;
}

/** Whether a label has to be composed rather than read from one column. */
export function isComposedLabel(label: ReferenceLabel): label is ComposedLabel {
  return "parts" in label && "format" in label;
}

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
  label: ReferenceLabel;
  /** Offered when the column is nullable. `Award.organization` is not. */
  emptyLabel?: string;
  /**
   * The heading this source's rows sit under. Required only where a field has
   * several sources, since one source needs no heading to tell it apart.
   */
  groupLabel?: string;
  /**
   * Narrows the rows offered, for a table holding more than one vocabulary.
   *
   * `category` is the reason it exists: skills, projects and blog posts each
   * have their own set of categories in one table, told apart by `kind` and
   * kept apart by a CHECK constraint -- and all three dropdowns queried the
   * whole table, so a skill's Category control offered every blog and project
   * category too. Choosing one was a category that would render on the about
   * page as a section nobody wrote, and nothing in the schema objected, because
   * the foreign key is satisfied by any row.
   */
  where?: SQL;
};

/**
 * A many-to-many, through its join table.
 *
 * `Project.tech_stack` is the only one, and it is a *plain* M2M on purpose:
 * unlike `Profile.skills_highlight`, its order genuinely does not matter, which
 * is why that one needed a through model with an `order` column and this one
 * did not.
 */
export type ManyToManySource = {
  /** The join table carrying the pairs, e.g. `project_skill`. */
  join: PgTable;
  /** The column pointing at the record being edited. */
  ownerFk: PgColumn;
  /** The column pointing at the other side. */
  targetFk: PgColumn;
  /** Where the options come from. */
  options: ReferenceSource;
};

export type Fieldset = { title?: string; help?: string; fields: FormField[] };

/**
 * A set of child rows edited alongside their parent.
 *
 * Field names are prefixed and indexed (`positions:0:title`) rather than the
 * whole set travelling as JSON in one control, the way the `string-list` editor
 * does it. An inline can contain a file input, and a file cannot be serialised
 * into a JSON value on the way to the server.
 *
 * **The row's position in the submission is its order.** The editor renders its
 * rows in array order and derives every name from the array index, so moving a
 * row renumbers its fields; the server writes `orderColumn = index`. There is no
 * separate order input to fall out of step with what is on screen.
 */
export type AdminInline = {
  /** Prefix of every field name this posts, and the key of its state. */
  name: string;
  table: PgTable;
  pk: PgColumn;
  /** The foreign key back to the parent record. */
  parent: PgColumn;
  title: string;
  help?: string;
  /** What one row is called: "link", "position", "step". */
  itemLabel: string;
  fields: FormField[];
  /** Written from the row's position on save. Omit for an unordered set. */
  orderColumn?: PgColumn;
  /** How rows are loaded. Defaults to `orderColumn`, then the primary key. */
  orderBy?: PgColumn;
  /**
   * A second key this inline is scoped by, on top of the parent.
   *
   * Several child tables hold more than one list: `hiring_list_item` carries
   * the application process, the culture notes and both requirement lists,
   * discriminated by `kind`. They were four JSONB arrays on one row before, and
   * one table with a discriminator is what replaced them -- so an inline needs
   * to say which of the lists it edits, both when reading and when inserting.
   *
   * Without this an inline would load every kind at once and save them all as
   * whichever kind it thought it was.
   */
  scope?: { column: PgColumn; value: string };
};

/** The name one inline field posts under. */
export function inlineFieldName(inline: string, index: number, field: string): string {
  return `${inline}:${index}:${field}`;
}

/** How many rows an inline submitted. Rows the editor removed simply are not there. */
export function inlineCountName(inline: string): string {
  return `${inline}:__count`;
}

/** The existing row's id, empty for one the editor just added. */
export const INLINE_ID = "__id";


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
  "column" | "display" | "slugFrom" | "reference" | "readOnly"
> & {
  /**
   * Already resolved against the record: the browser is told whether *this*
   * form may write the field, not the rule that decides it.
   */
  readOnly?: boolean;
  /** Resolved options for a `reference` field, loaded by the page. */
  options?: FilterChoice[];
};
export type ClientFieldset = { title?: string; help?: string; fields: ClientField[] };

export function toClientFieldsets(
  model: AdminFormModel,
  /** Options for the `reference` fields, keyed by field name. */
  options: Record<string, FilterChoice[]> = {},
  /** `null` when creating. Settles every `afterCreate` field. */
  id: string | null = null,
): ClientFieldset[] {
  return model.fieldsets.map((fieldset) => ({
    title: fieldset.title,
    help: fieldset.help,
    // Built up rather than destructured down, so a field gaining a
    // non-serialisable property later is a compile error here and not a
    // stack overflow at render time.
    fields: fieldset.fields.map((raw) => resolveReadOnly(raw, id)).map((field) => ({
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
      // Already a boolean: `resolveReadOnly` ran above.
      readOnly: field.readOnly === true,
      options: options[field.name],
    })),
  }));
}

export type FormValue = string | number | boolean | null | string[] | Record<string, string>;
export type FormValues = Record<string, FormValue>;

export type ValidationContext = {
  /** `null` when creating. */
  id: string | null;
  /** The signed-in staff account's uuid, for rules about acting on yourself. */
  actorId: string;
  /**
   * Whether any row of `table` has `column = value`.
   *
   * Handed in rather than queried by the descriptor, and that is a constraint
   * worth keeping: `lib/admin/models/` is imported by the check harnesses, so a
   * descriptor that reached for `lib/db/client.ts` would open a connection
   * every time one of them read a form's shape. The rules that need a row
   * counted get this instead, and the descriptors stay data.
   *
   * Every use is a lookup by a key, and a key here is a uuid -- a value that is
   * not one is answered `false` rather than being sent to Postgres, which
   * raises `22P02` on a malformed uuid instead of returning no rows.
   */
  exists: (table: PgTable, column: PgColumn, value: string) => Promise<boolean>;
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
   * Whether the admin may add and remove rows of this model.
   *
   * Both default to true, and each `false` has a reason recorded at the
   * descriptor -- a guestbook message is written by a reader, an account by a
   * sign-in, a profile row by a signal.
   *
   * `"superuser"` is the third state: refused to staff, offered to a
   * superuser. It exists for the two refusals that were about *consequences*
   * rather than about impossibility -- deleting an account takes every comment
   * and guestbook message that person wrote with it, and deleting a project
   * status removes an option the projects page sorts on -- as against the three
   * singletons, where the row cannot be recreated by anything in this admin and
   * the site has no page without it. Those stay `false` for everybody.
   *
   * **`"superuser"` is a truthy string**, exactly like `readOnly:
   * "afterCreate"` above, and it fails the same way: `model.canDelete !== false`
   * reads it as *allowed* and offers the button to everyone. Every reader goes
   * through `permits` or `roleAllows` in `lib/auth/permissions.ts`; nothing
   * tests these properties directly.
   */
  canCreate?: boolean | "superuser";
  canDelete?: boolean | "superuser";
  /** What deleting takes with it, said plainly in the confirm dialog. */
  deleteWarning?: string;
  /**
   * Rules the field kinds cannot express, checked on the server after parsing.
   * Returns a message, or `null` to allow. Async so it can count rows.
   */
  validate?: (values: FormValues, context: ValidationContext) => Promise<string | null>;
  /** Child rows edited on the same screen. */
  inlines?: AdminInline[];
  /**
   * Columns the form does not carry that still need a value on insert.
   *
   * A function, not an object: one of these is the current time, and a literal
   * would capture the moment the module was imported -- so every record created
   * by a warm server would be stamped with when that server started.
   */
  insertDefaults?: InsertDefaults;
  /**
   * What has to be removed before this record can be.
   *
   * The foreign keys declare their own actions, so the database would resolve
   * most of this by itself. This list exists so the *application* resolves it
   * first, and the difference is what the person deleting sees: a `RESTRICT`
   * that reaches Postgres is an integrity error to translate after the fact,
   * while a child cleared here is a delete that simply works. Each inline is a
   * cascade automatically; anything else -- a self-reference, a child with no
   * editor -- is listed here.
   */
  cascades?: CascadeTarget[];
};

/**
 * One child relation to clear on delete.
 *
 * `selfReference` means the foreign key points back at the same table, so the
 * branch has to be walked: a legal section nested under a section nested under
 * the one being deleted is still in the way.
 */
export type CascadeTarget = {
  table: PgTable;
  /** The column pointing at the parent. */
  fk: PgColumn;
  pk: PgColumn;
  selfReference?: boolean;
};

/** Every child relation of a model: its inlines, plus anything declared. */
export function cascadeTargets(model: AdminFormModel): CascadeTarget[] {
  return [
    ...(model.inlines ?? []).map((inline) => ({
      table: inline.table,
      fk: inline.parent,
      pk: inline.pk,
    })),
    ...(model.cascades ?? []),
  ];
}

/** Every field, in order, flattened out of the fieldsets. */
export function formFields(model: AdminFormModel): FormField[] {
  return model.fieldsets.flatMap((fieldset) => fieldset.fields);
}

/**
 * The same fields, with `readOnly` settled against the record being edited.
 *
 * Every reader of `readOnly` goes through this rather than testing the property
 * itself, and that is the point: `"afterCreate"` is a truthy string, so a
 * reader that kept checking `if (field.readOnly)` would treat it as *always*
 * read-only and silently drop the field from the insert -- a not-null violation
 * on the one save it was added to make work.
 *
 * `id === null` is the create form.
 */
export function formFieldsFor(model: AdminFormModel, id: string | null): FormField[] {
  return formFields(model).map((field) => resolveReadOnly(field, id));
}

/** One field, with `readOnly` settled. */
export function resolveReadOnly(field: FormField, id: string | null): FormField {
  return field.readOnly === "afterCreate" ? { ...field, readOnly: id !== null } : field;
}

/**
 * The Drizzle select shape for loading a record into this form.
 *
 * A `many-to-many` field is skipped: it has no column on this record, and its
 * `column` only names the primary key so the descriptor has something to point
 * at. `loadFormValues` reads it from the join table instead.
 */
export function formSelect(model: AdminFormModel): Record<string, PgColumn | SQL> {
  return Object.fromEntries(
    formFields(model)
      .filter((field) => field.kind !== "many-to-many")
      .map((field) => [field.name, field.display ?? field.column]),
  );
}

export type ParseResult =
  | { ok: true; values: FormValues }
  | { ok: false; errors: Record<string, string> };

/**
 * What an optional field left blank stores.
 *
 * Read from the column rather than assumed, because "optional" is two different
 * columns here. Some are `NOT NULL DEFAULT ''` and hold the empty string; some
 * are genuinely nullable. Writing `null` into the first raises a not-null
 * violation, which is what every optional field on the skill form did on the
 * first attempt -- `description` and `category` are not nullable and never
 * were.
 */
function blankValue(field: FormField): FormValue {
  if (field.kind === "string-list" || field.kind === "choice-list") return [];
  if (field.kind === "many-to-many") return [];
  if (field.kind === "key-value") return {};
  if (!field.column.notNull) return null;
  if (field.kind === "number") return 0;
  return "";
}

/**
 * Undo any CRLF the browser introduced.
 *
 * The stored data contains no carriage return at all, and a textarea's
 * *submission* value is CRLF-normalised per the HTML spec -- so a value that
 * makes the round trip through a real form post comes back changed. Reading
 * `.value` from JavaScript sidesteps it; posting the field does not. These
 * forms post, so it is normalised on arrival.
 *
 * **This is the only normalising these editors do.** Nothing is trimmed: two
 * stored `class` strings contain double spaces, and block text is raw HTML.
 */
/**
 * Read a `string-list` or `key-value` field.
 *
 * Both arrive as JSON in one control rather than as one input per entry: the
 * value is a list or a mapping, and one control that carries it whole is one
 * thing to validate rather than N to reassemble in the right order.
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
 * Plain text is trimmed. That is deliberately not the rule the JSON editors
 * follow -- those must never normalise, because whitespace inside a stored value
 * can be significant. These are names, slugs and URLs, where a trailing space is
 * a typo and nothing else.
 */
export function parseFormValues(
  model: AdminFormModel,
  data: FormData,
  /** `null` when creating -- what an `afterCreate` field is resolved against. */
  id: string | null,
): ParseResult {
  return parseFields(formFieldsFor(model, id), data);
}

/**
 * The same parsing, over an arbitrary field list.
 *
 * `prefix` is what makes an inline row work: its fields post under
 * `positions:0:title` rather than `title`, and everything else about reading
 * them is identical to the parent record.
 */
export function parseFields(
  fields: FormField[],
  data: FormData,
  prefix = "",
): ParseResult {
  const values: FormValues = {};
  const errors: Record<string, string> = {};
  const nameOf = (field: FormField) => `${prefix}${field.name}`;

  for (const field of fields) {
    if (field.readOnly) continue;
    // Handled by `saveRecord`: an upload is bytes and a network call, and this
    // stays synchronous so it can be reasoned about and tested on its own.
    if (field.kind === "image") continue;

    if (field.kind === "many-to-many") {
      // A checklist: the ticked boxes arrive as repeats of one name, and each is
      // the primary key of a row on the other side. Written to the join table by
      // `saveManyToMany`, never as a column on this record.
      values[field.name] = data
        .getAll(nameOf(field))
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(isUuid);
      continue;
    }

    if (field.kind === "choice-list") {
      /*
       * A checkbox set: the checked boxes arrive as repeats of one name, in the
       * order the vocabulary declares them. Anything outside the vocabulary is
       * dropped rather than stored. A `jsonb` column cannot express a
       * vocabulary the way a lookup table can, so the constraint has to be
       * applied here, on the way in.
       */
      const allowed = new Set((field.choices ?? []).map((choice) => choice.value));
      values[field.name] = data
        .getAll(nameOf(field))
        .map(String)
        .filter((entry) => allowed.has(entry));
      continue;
    }

    if (field.kind === "string-list" || field.kind === "key-value") {
      const parsed = parseJsonField(field, data.get(nameOf(field)));
      if ("error" in parsed) errors[field.name] = parsed.error;
      else values[field.name] = parsed.value;
      continue;
    }

    if (field.kind === "checkbox") {
      // An unchecked box posts nothing at all, which is why presence is the
      // test and a missing key is `false` rather than an error.
      values[field.name] = data.get(nameOf(field)) !== null;
      continue;
    }

    const raw = data.get(nameOf(field));
    const text = typeof raw === "string" ? raw.trim() : "";

    if (!text) {
      if (field.required) {
        errors[field.name] = `${field.label} is required.`;
        continue;
      }
      // A slug left blank is filled from its source below, once every field
      // has been read -- the source may not have been parsed yet.
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
      /*
       * `normaliseNewlines` is not optional for either of these.
       *
       * Form submission converts every line break in *every* field value to
       * CRLF, and the stored data has no carriage return in it anywhere. So an
       * untouched save of a multi-paragraph value rewrites the whole column
       * with characters that were never there -- which is invisible in the
       * admin, invisible in a diff, and shows up as `
` in the rendered page.
       *
       * The JSON editors escape their newlines inside a JSON string, so nothing
       * real reaches the encoder and they are handled elsewhere. These two
       * carry actual newlines: `rich-text` is HTML, and a `textarea` is
       * whatever prose somebody typed -- a bio, a comment, a guestbook message.
       *
       * The sanitiser runs in `lib/actions/admin.ts`, not here: `sanitize-html`
       * is a server package and this module is reachable from a client
       * component, so importing it would put the whole allow-list and its HTML
       * parser into the browser bundle.
       */
      case "rich-text":
      case "textarea": {
        values[field.name] = normaliseNewlines(text);
        break;
      }
      case "reference": {
        /*
         * A key, and keys are uuids. This read the value with `Number` and
         * required a positive integer, which was right while they were serial
         * and rejects every real one now -- the form came back saying the
         * category chosen from its own select was not a valid choice.
         *
         * Whether the key exists is not settled here. That is the foreign key's
         * job, and `saveRecord` turns its violation into a message.
         */
        if (!isUuid(text)) {
          errors[field.name] = `${field.label} is not a valid choice.`;
        } else {
          values[field.name] = text;
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

  for (const field of fields) {
    if (field.slugFrom && !values[field.name]) {
      const source = values[field.slugFrom];
      values[field.name] = slugify(typeof source === "string" ? source : "");
    }
  }

  return Object.keys(errors).length > 0 ? { ok: false, errors } : { ok: true, values };
}

/**
 * Slugify, for the fields that fill themselves in.
 *
 * `lib/utils/format.ts` already carries this rule for blog tags; it is repeated
 * rather than imported because that module is part of the public rendering path
 * and this is a write path. What a stored slug must look like and what a tag
 * filter matches on are two questions, and they have to stay free to diverge.
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

/**
 * The name of the text box that takes a link instead of a file.
 *
 * Derived from the field's name the same way the clear box is, so an inline row
 * gets it prefixed for free: `positions:0:mediaId__link` posts alongside
 * `positions:0:mediaId` without `applyImageFields` having to know which of the
 * two shapes it is reading.
 */
export const linkFieldName = (field: string) => `${field}__link`;

/** The inline as the browser needs it -- same rule as `toClientFieldsets`. */
export function toClientInlines(
  model: AdminFormModel,
  options: Record<string, FilterChoice[]> = {},
): {
  name: string;
  title: string;
  help?: string;
  itemLabel: string;
  fields: ClientField[];
  ordered: boolean;
}[] {
  return (model.inlines ?? []).map((inline) => ({
    name: inline.name,
    title: inline.title,
    help: inline.help,
    itemLabel: inline.itemLabel,
    ordered: Boolean(inline.orderColumn),
    fields: inline.fields.map((field) => ({
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
      // `afterCreate` is meaningless on an inline field -- a child row has no
      // identity apart from the save that writes it -- so anything but `true`
      // is writable, and a descriptor that tried it gets the honest answer
      // rather than a string leaking into the browser.
      readOnly: field.readOnly === true,
      options: options[`${inline.name}:${field.name}`],
    })),
  }));
}

/** Fields whose value must be sanitised before it is stored. */
export function richTextFields(model: AdminFormModel): FormField[] {
  return formFields(model).filter((field) => field.kind === "rich-text");
}

/** The `many-to-many` fields, which are written to a join table, not a column. */
export function manyToManyFields(model: AdminFormModel): FormField[] {
  return formFields(model).filter((field) => field.kind === "many-to-many");
}

/**
 * Values applied only when creating, for columns the form does not carry.
 *
 * A handful of columns are `NOT NULL` with no database default, because their
 * value is not a constant -- a creation timestamp, or a counter that starts at
 * zero and is then owned by the site rather than by whoever is typing. They are
 * not on the form, so an insert that did not supply them would simply fail.
 */
export type InsertDefaults = () => Record<string, unknown>;

/** Every `reference` field on the model and its inlines, keyed for lookup. */
export function referenceFields(
  model: AdminFormModel,
): { key: string; field: FormField }[] {
  return [
    ...formFields(model)
      .filter((field) => field.reference)
      .map((field) => ({ key: field.name, field })),
    ...(model.inlines ?? []).flatMap((inline) =>
      inline.fields
        .filter((field) => field.reference)
        .map((field) => ({ key: `${inline.name}:${field.name}`, field })),
    ),
  ];
}
