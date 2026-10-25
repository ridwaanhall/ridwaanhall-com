import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { BACKUP_FORMAT, BACKUP_VERSION, insertOrder, parentsFirst, parseBackup, schemaMismatch, type Edge } from "./order";

/*
 * The live schema's foreign keys between distinct tables, as `pg_constraint`
 * listed them on 2026-10-25. A fixture rather than a query so the suite needs
 * no database; what it proves is that the real graph has an order at all.
 */
const LIVE =
  "account_identity>account admin_access>account application_step>application application>application_source application>application_status application>employment_type application>location application>organization application>work_mode award>organization blog_image>blog_post blog_image>media_asset blog_post>category blog_post>media_asset blog_tag>blog_post blog_tag>tag certification_achievement>certification certification>organization comment>account education_achievement>education education>location education>organization experience_task>experience experience>employment_type experience>location experience>organization experience>work_mode guest_message>account hiring_list_item>hiring_profile job_opening_list_item>job_opening job_opening>employment_type job_opening>hiring_profile job_opening>location legal_document>legal_document_type legal_section>legal_document membership_task>membership membership>location membership>organization open_to_work_list_item>location open_to_work_list_item>open_to_work_profile open_to_work_profile>availability open_to_work_profile>contact_preference open_to_work_profile>experience_level open_to_work_profile>notice_period open_to_work_profile>open_to_work_status open_to_work_profile>work_authorization organization>media_asset portfolio_highlight>open_to_work_profile profile_link>profile profile_skill_highlight>profile profile_skill_highlight>skill profile>location profile>media_asset project_feature>project project_image>media_asset project_image>project project_skill>project project_skill>skill project_tag>project project_tag>tag project>category project>project_status public_access>account skill>category skill>media_asset"
    .split(" ")
    .map((pair) => {
      const [child, parent] = pair.split(">");
      return { child, parent };
    });

describe("insertOrder", () => {
  it("puts every table after each table it references, on the live graph", () => {
    const tables = [...new Set(LIVE.flatMap(({ child, parent }) => [child, parent]))];
    const order = insertOrder(tables, LIVE);
    assert.equal(order.length, tables.length);
    for (const { child, parent } of LIVE) {
      assert.ok(order.indexOf(parent) < order.indexOf(child), `${parent} must come before ${child}`);
    }
  });

  it("ignores a table's reference to itself", () => {
    assert.deepEqual(insertOrder(["comment", "account"], [{ child: "comment", parent: "comment" }, { child: "comment", parent: "account" }]), [
      "account",
      "comment",
    ]);
  });

  it("refuses a cycle between tables rather than guessing", () => {
    const edges: Edge[] = [{ child: "a", parent: "b" }, { child: "b", parent: "a" }];
    assert.throws(() => insertOrder(["a", "b"], edges), /cycle/);
  });
});

describe("parentsFirst", () => {
  it("puts a reply after the message it answers, however they arrive", () => {
    const rows = [
      { id: "c", parent_id: "b" },
      { id: "b", parent_id: "a" },
      { id: "a", parent_id: null },
      { id: "d", parent_id: "gone" },
    ];
    const order = parentsFirst(rows, "parent_id").map((row) => row.id);
    assert.ok(order.indexOf("a") < order.indexOf("b") && order.indexOf("b") < order.indexOf("c"));
    assert.ok(order.includes("d"), "a row whose parent is missing is a root, not dropped");
  });

  it("refuses rows that are each other's parent", () => {
    assert.throws(() => parentsFirst([{ id: "a", parent_id: "b" }, { id: "b", parent_id: "a" }], "parent_id"), /cycle/);
  });
});

describe("a backup file", () => {
  const good = { format: BACKUP_FORMAT, version: BACKUP_VERSION, created_at: "2026-10-25T00:00:00Z", tables: { tag: [{ id: "1", slug: "x" }] } };

  it("is recognised by its format and version", () => {
    assert.equal(typeof parseBackup(good), "object");
    assert.match(parseBackup({ ...good, format: "other" }) as string, /not a backup made by this site/);
    assert.match(parseBackup({ ...good, version: 2 }) as string, /version 2/);
    assert.match(parseBackup({ ...good, tables: { tag: "x" } }) as string, /not a list/);
    assert.match(parseBackup({ ...good, tables: { "tag; drop": [] } }) as string, /not a table name/);
  });

  it("is refused when it holds a table or column this database lacks, and not for one it lacks", () => {
    const columns = new Map([["tag", new Set(["id", "slug", "label"])]]);
    assert.deepEqual(schemaMismatch(good as never, columns), []);
    assert.deepEqual(schemaMismatch({ ...good, tables: { tag: [{ id: "1", colour: "red" }], gone: [] } } as never, columns), [
      "column tag.colour does not exist here",
      "table gone does not exist here",
    ]);
  });
});
