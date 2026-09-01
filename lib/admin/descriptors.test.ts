import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formFields } from "./form";
import { ADMIN_FORM_MODELS, ADMIN_LIST_MODELS } from "./models";
import {
  ADMIN_ENTRIES,
  ADMIN_ENTRIES_BY_KEY,
  ADMIN_GROUPS,
  ADMIN_SECTIONS,
  adminPath,
  entriesInGroup,
  navItemsInGroup,
  sectionTabs,
} from "./registry";

/*
 * The admin is declarative: a screen is an entry here plus a descriptor there,
 * and no page is written for it. What that trades away is the compiler --
 * nothing type-checks that the two halves agree, and a mismatch is a link to a
 * 404 or a screen that cannot be opened.
 *
 * `scripts/check-admin.mjs` asserts some of this by driving a running server.
 * These are the same guarantees, offline, in milliseconds, in CI.
 */
describe("the registry", () => {
  it("registers screens", () => {
    assert.ok(ADMIN_ENTRIES.length > 0);
  });

  it("gives every entry a unique key, since the key is the URL", () => {
    const keys = ADMIN_ENTRIES.map((entry) => entry.key);
    assert.equal(new Set(keys).size, keys.length, "duplicate key in the registry");
  });

  it("gives every entry a key a URL can carry", () => {
    for (const entry of ADMIN_ENTRIES) {
      assert.match(entry.key, /^[a-z0-9-]+$/, `${entry.key} is not URL-safe`);
    }
  });

  it("gives every entry the labels and blurb its screens render", () => {
    for (const entry of ADMIN_ENTRIES) {
      assert.ok(entry.label, `${entry.key}: no label`);
      assert.ok(entry.labelPlural, `${entry.key}: no plural label`);
      assert.ok(entry.blurb, `${entry.key}: no blurb`);
    }
  });

  it("puts every entry in a group the sidebar knows how to render", () => {
    for (const entry of ADMIN_ENTRIES) {
      assert.ok(ADMIN_GROUPS.includes(entry.group), `${entry.key}: unknown group ${entry.group}`);
    }
  });

  it("indexes every entry by its key", () => {
    assert.equal(ADMIN_ENTRIES_BY_KEY.size, ADMIN_ENTRIES.length);
    for (const entry of ADMIN_ENTRIES) {
      assert.equal(ADMIN_ENTRIES_BY_KEY.get(entry.key), entry);
    }
  });
});

describe("the registry and the descriptors agree", () => {
  /*
   * The record route renders a form or nothing -- there is no read-only
   * fallback. An entry without a form descriptor is a screen that cannot be
   * opened at all.
   */
  it("gives every registered screen a form descriptor", () => {
    for (const entry of ADMIN_ENTRIES) {
      assert.ok(entry.key in ADMIN_FORM_MODELS, `${entry.key}: no form descriptor`);
    }
  });

  it("gives every screen that is not a single row a changelist", () => {
    for (const entry of ADMIN_ENTRIES.filter((candidate) => !candidate.singleton)) {
      assert.ok(entry.key in ADMIN_LIST_MODELS, `${entry.key}: no list descriptor`);
    }
  });

  it("gives a single-row screen no changelist, since its screen is the form", () => {
    for (const entry of ADMIN_ENTRIES.filter((candidate) => candidate.singleton)) {
      assert.ok(!(entry.key in ADMIN_LIST_MODELS), `${entry.key}: a singleton should not have a list`);
    }
  });

  it("registers every descriptor it defines, so none is a screen nothing reaches", () => {
    for (const key of [...Object.keys(ADMIN_LIST_MODELS), ...Object.keys(ADMIN_FORM_MODELS)]) {
      assert.ok(ADMIN_ENTRIES_BY_KEY.has(key), `${key} has a descriptor but no registry entry`);
    }
  });

  it("keys every descriptor the way the registry and the URL do", () => {
    for (const [key, model] of Object.entries(ADMIN_FORM_MODELS)) {
      assert.equal(model.key, key, `form descriptor ${key} disagrees with its own key`);
    }
    for (const [key, model] of Object.entries(ADMIN_LIST_MODELS)) {
      assert.equal(model.key, key, `list descriptor ${key} disagrees with its own key`);
    }
  });
});

describe("every changelist descriptor", () => {
  const lists = Object.entries(ADMIN_LIST_MODELS);

  it("shows at least one column", () => {
    for (const [key, model] of lists) {
      assert.ok(model.columns.length > 0, `${key}: no columns`);
    }
  });

  it("gives its columns unique keys, since the sort parameter names one", () => {
    for (const [key, model] of lists) {
      const keys = model.columns.map((column) => column.key);
      assert.equal(new Set(keys).size, keys.length, `${key}: duplicate column key`);
    }
  });

  it("labels every column", () => {
    for (const [key, model] of lists) {
      for (const column of model.columns) {
        assert.ok(column.label, `${key}.${column.key}: no label`);
      }
    }
  });

  /*
   * `?sort=` is validated against the descriptor before it reaches SQL, so a
   * default naming a column that is absent or unsortable silently falls back
   * and the list is ordered by something nobody chose.
   */
  it("has a default sort naming one of its own sortable columns", () => {
    for (const [key, model] of lists) {
      const column = model.columns.find((candidate) => candidate.key === model.defaultSort.key);
      assert.ok(column, `${key}: default sort "${model.defaultSort.key}" is not a column`);
      assert.ok(column.sort, `${key}: default sort "${model.defaultSort.key}" is not sortable`);
      assert.ok(["asc", "desc"].includes(model.defaultSort.dir), `${key}: bad sort direction`);
    }
  });

  it("gives every filter a unique key and a label", () => {
    for (const [key, model] of lists) {
      const keys = (model.filters ?? []).map((filter) => filter.key);
      assert.equal(new Set(keys).size, keys.length, `${key}: duplicate filter key`);
      for (const filter of model.filters ?? []) {
        assert.ok(filter.label, `${key}.${filter.key}: no label`);
      }
    }
  });

  it("gives a search box something to search and a placeholder to say so", () => {
    for (const [key, model] of lists) {
      if (!model.search) continue;
      assert.ok(model.search.fields.length > 0, `${key}: search with no fields`);
      assert.ok(model.search.placeholder, `${key}: search with no placeholder`);
    }
  });
});

describe("every form descriptor", () => {
  const forms = Object.entries(ADMIN_FORM_MODELS);

  it("offers at least one field to edit", () => {
    for (const [key, model] of forms) {
      assert.ok(formFields(model).length > 0, `${key}: no fields`);
    }
  });

  it("gives its fields unique names, since the name is the input's", () => {
    for (const [key, model] of forms) {
      const names = formFields(model).map((f) => f.name);
      assert.equal(new Set(names).size, names.length, `${key}: duplicate field name`);
    }
  });

  it("labels every field and backs it with a column", () => {
    for (const [key, model] of forms) {
      for (const f of formFields(model)) {
        assert.ok(f.label, `${key}.${f.name}: no label`);
        assert.ok(f.column, `${key}.${f.name}: no column`);
      }
    }
  });

  it("gives every select and choice-list a vocabulary to choose from", () => {
    for (const [key, model] of forms) {
      for (const f of formFields(model)) {
        if (f.kind !== "select" && f.kind !== "choice-list") continue;
        assert.ok(f.choices && f.choices.length > 0, `${key}.${f.name}: no choices`);
        const values = f.choices.map((choice) => choice.value);
        assert.equal(new Set(values).size, values.length, `${key}.${f.name}: duplicate choice`);
      }
    }
  });

  it("gives every reference field somewhere for its options to come from", () => {
    for (const [key, model] of forms) {
      for (const f of formFields(model)) {
        if (f.kind === "reference") assert.ok(f.reference, `${key}.${f.name}: no reference source`);
        if (f.kind === "many-to-many") assert.ok(f.manyToMany, `${key}.${f.name}: no join table`);
        if (f.kind === "image") assert.ok(f.prefix, `${key}.${f.name}: no upload prefix`);
      }
    }
  });

  it("names a slug's source as a field on the same form", () => {
    for (const [key, model] of forms) {
      const names = new Set(formFields(model).map((f) => f.name));
      for (const f of formFields(model)) {
        if (!f.slugFrom) continue;
        assert.ok(names.has(f.slugFrom), `${key}.${f.name}: slugFrom "${f.slugFrom}" is not a field here`);
      }
    }
  });

  it("gives every inline a name, a field and a unique place on its form", () => {
    for (const [key, model] of forms) {
      const names = (model.inlines ?? []).map((inline) => inline.name);
      assert.equal(new Set(names).size, names.length, `${key}: duplicate inline name`);
      for (const inline of model.inlines ?? []) {
        assert.ok(inline.fields.length > 0, `${key}.${inline.name}: no fields`);
        const fieldNames = inline.fields.map((f) => f.name);
        assert.equal(new Set(fieldNames).size, fieldNames.length, `${key}.${inline.name}: duplicate field`);
      }
    }
  });

  it("warns before a delete that takes children with it", () => {
    for (const [key, model] of forms) {
      if (model.canDelete === false) continue;
      const cascades = (model.inlines ?? []).length > 0;
      if (cascades) {
        assert.ok(model.deleteWarning, `${key}: deletes children but offers no warning`);
      }
    }
  });
});

describe("the settings sections", () => {
  /*
   * A section key and a model key share one URL segment, so they share one
   * namespace -- and nothing in the type system says so, since both are
   * strings. `/admin/taxonomy` can be a section or a model, never both.
   */
  it("keeps section keys clear of model keys", () => {
    const modelKeys = new Set(ADMIN_ENTRIES.map((entry) => entry.key));
    for (const section of ADMIN_SECTIONS) {
      assert.ok(!modelKeys.has(section.key), `${section.key} is both a section and a model`);
    }
  });

  it("gives every section a unique key", () => {
    const keys = ADMIN_SECTIONS.map((section) => section.key);
    assert.equal(new Set(keys).size, keys.length, "duplicate section key");
  });

  it("gives every section a key a URL can carry", () => {
    for (const section of ADMIN_SECTIONS) {
      assert.match(section.key, /^[a-z0-9-]+$/, `${section.key} is not URL-safe`);
    }
  });

  it("gives every section the label and blurb its screens render", () => {
    for (const section of ADMIN_SECTIONS) {
      assert.ok(section.label, `${section.key}: no label`);
      assert.ok(section.blurb, `${section.key}: no blurb`);
      assert.ok(ADMIN_GROUPS.includes(section.group), `${section.key}: unknown group`);
    }
  });

  // A section with no tabs is a sidebar entry linking to nothing.
  it("gives every section at least one tab", () => {
    for (const section of ADMIN_SECTIONS) {
      assert.ok(sectionTabs(section.key).length > 0, `${section.key} has no tabs`);
    }
  });

  it("names a section that exists", () => {
    const keys = new Set(ADMIN_SECTIONS.map((section) => section.key));
    for (const entry of ADMIN_ENTRIES) {
      if (!entry.section) continue;
      assert.ok(keys.has(entry.section), `${entry.key} names no such section`);
    }
  });

  /*
   * The whole point of the change: without this, a vocabulary added later
   * falls back to the top level and reappears as a row in the rail.
   */
  it("puts every Settings entry in a section", () => {
    for (const entry of ADMIN_ENTRIES) {
      if (entry.group !== "Settings") continue;
      assert.ok(entry.section, `${entry.key} is in Settings with no section`);
    }
  });

  it("keeps a section's tabs in the section's own group", () => {
    for (const section of ADMIN_SECTIONS) {
      for (const tab of sectionTabs(section.key)) {
        assert.equal(tab.group, section.group, `${tab.key} is not in ${section.group}`);
      }
    }
  });
});

describe("adminPath", () => {
  it("puts a sectioned screen under its section", () => {
    assert.equal(adminPath(ADMIN_ENTRIES_BY_KEY.get("tag")!), "/admin/taxonomy/tag");
  });

  it("leaves an unsectioned screen flat", () => {
    assert.equal(adminPath(ADMIN_ENTRIES_BY_KEY.get("blog-post")!), "/admin/blog-post");
  });

  it("builds a path a URL can carry for every entry", () => {
    for (const entry of ADMIN_ENTRIES) {
      assert.match(adminPath(entry), /^\/admin\/[a-z0-9-]+(\/[a-z0-9-]+)?$/);
    }
  });
});

describe("navItemsInGroup", () => {
  it("collapses Settings to one row per section", () => {
    assert.equal(navItemsInGroup("Settings").length, ADMIN_SECTIONS.length);
  });

  it("points a section at its first tab, so one click lands on a screen", () => {
    const taxonomy = navItemsInGroup("Settings").find((item) => item.label === "Taxonomy");
    assert.equal(taxonomy?.href, "/admin/taxonomy/category");
  });

  it("lists a group's sections in ADMIN_SECTIONS order, not first-entry order", () => {
    assert.deepEqual(
      navItemsInGroup("Settings").map((item) => item.label),
      ["Catalogue", "Taxonomy", "Work", "Applying", "Job preferences", "Publishing"],
    );
  });

  /*
   * The sidebar's current test is `pathname === match || startsWith(match + "/")`.
   * Without a prefix distinct from `href`, opening the second tab would
   * un-highlight the section holding it.
   */
  it("marks a section current from any of its tabs", () => {
    for (const item of navItemsInGroup("Settings")) {
      assert.ok(item.tabs?.length, `${item.label} carries no tabs`);
      for (const tab of item.tabs ?? []) {
        assert.ok(
          adminPath(tab).startsWith(`${item.match}/`),
          `${tab.key} is not under ${item.match}`,
        );
      }
    }
  });

  it("leaves a group with no sections as one row per entry", () => {
    assert.equal(navItemsInGroup("About").length, entriesInGroup("About").length);
  });

  it("carries the singleton flag through, since the rail prints it", () => {
    const profile = navItemsInGroup("About").find((item) => item.href === "/admin/profile");
    assert.equal(profile?.singleton, true);
  });

  it("lists every screen exactly once, as a row or as a tab", () => {
    const reachable = new Set<string>();
    for (const group of ADMIN_GROUPS) {
      for (const item of navItemsInGroup(group)) {
        if (item.tabs) for (const tab of item.tabs) reachable.add(adminPath(tab));
        else reachable.add(item.href);
      }
    }
    assert.equal(reachable.size, ADMIN_ENTRIES.length);
  });
});
