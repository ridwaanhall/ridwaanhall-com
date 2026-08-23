/**
 * Exercise the comment rules against the real schema, then roll it back.
 *
 * The table is empty on live, so there is nothing to compare a rendered page
 * against the way `compare-guestbook.mjs` does. What can still be checked for
 * real are the rules applied on write and enforced with the
 * database — and those are worth checking precisely because they are security
 * properties, not cosmetics:
 *
 *   - a reply is flattened to one level, so a reply-to-a-reply attaches to the
 *     root instead of rendering nowhere
 *   - a reply's parent is scoped to the same target, so a crafted `reply_to`
 *     cannot graft a comment onto a thread on a different post
 *   - deleting is soft, so a removed parent does not take its replies with it
 *   - a deleted comment blanks its body and stops being deletable
 *
 * Everything runs inside one transaction and throws at the end to undo it; the
 * final check re-counts the table to prove nothing was left behind.
 *
 *   npx tsx scripts/check-comments.mjs
 */
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });

const { db, pool } = await import("../lib/db/client.ts");
const { commentIdsOnTarget, getCommentSection } = await import("../lib/data/comments.ts");
const { canDeleteComment } = await import("../lib/data/comment-shapes.ts");
const { comment } = await import("../lib/db/app-schema.ts");
const { sql } = await import("drizzle-orm");

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const count = async (database) =>
  (await database.execute(sql`select count(*)::int c from app.comment`)).rows[0].c;

const before = await count(db);
console.log(`live comment rows before: ${before}\n`);

const ROLLBACK = Symbol("rollback");

try {
  await db.transaction(async (tx) => {
    /*
     * The target is named directly now. A comment used to reach its subject
     * through a generic reference, a foreign key into a table of every model in
     * the project, so "what is this a comment on" was a join and picking a
     * target meant resolving `blog.blogpost` to a number first. `target_kind`
     * holds the kind and a CHECK constraint holds the vocabulary.
     */
    const BLOG = "blog_post";
    const PROJECT = "project";

    // A real post and project, and two real accounts so the FKs hold.
    const [{ id: postId }] = (await tx.execute(sql`select id from app.blog_post order by slug limit 1`)).rows;
    const [{ id: projectId }] = (await tx.execute(sql`select id from app.project order by slug limit 1`)).rows;
    const [{ id: authorId }] = (await tx.execute(
      sql`select a.id from app.account a join app.guest_profile p on p.account_id = a.id where p.is_author order by a.joined_at limit 1`,
    )).rows;
    const [{ id: strangerId }] = (await tx.execute(
      sql`select a.id from app.account a join app.guest_profile p on p.account_id = a.id where not p.is_author and not p.is_co_author order by a.joined_at limit 1`,
    )).rows;

    const add = async (body, { replyToId = null, accountId = strangerId, kind = BLOG, targetId = postId } = {}) => {
      const [row] = await tx
        .insert(comment)
        .values({
          targetKind: kind,
          targetId,
          accountId,
          body,
          replyToId,
          isDeleted: false,
          createdAt: new Date().toISOString(),
        })
        .returning({ id: comment.id, replyToId: comment.replyToId });
      return row;
    };

    // --- one level of nesting ------------------------------------------------
    const root = await add("root comment");
    const reply = await add("a reply", { replyToId: root.id });

    // The flattening rule, as `postComment` applies it: resolve the requested
    // parent on this target, then use *its* parent if it has one.
    const flatten = async (requestedId, kind = BLOG, targetId = postId) => {
      const [parent] = await commentIdsOnTarget(kind, targetId, [requestedId], tx);
      return parent ? (parent.replyToId ?? parent.id) : null;
    };

    check("replying to a root attaches to the root", (await flatten(root.id)) === root.id);
    check(
      "replying to a reply attaches to its root, not the reply",
      (await flatten(reply.id)) === root.id,
      `reply ${reply.id} -> ${await flatten(reply.id)}`,
    );

    const nested = await add("a reply to a reply", { replyToId: await flatten(reply.id) });
    check("the flattened row really points at the root", nested.replyToId === root.id);

    // --- the parent lookup is scoped to the target ---------------------------
    check(
      "a parent on another post is not resolvable",
      (await flatten(root.id, PROJECT, projectId)) === null,
      `blog comment ${root.id} requested from project ${projectId}`,
    );
    const onProject = await add("project comment", { kind: PROJECT, targetId: projectId });
    check(
      "and the same id on its own target still resolves",
      (await flatten(onProject.id, PROJECT, projectId)) === onProject.id,
    );

    // --- the section renders one level --------------------------------------
    const viewerStranger = { userId: strangerId, isAuthor: false, isCoAuthor: false };
    let section = await getCommentSection({
      label: BLOG,
      targetId: postId,
      viewer: viewerStranger,
      database: tx,
    });

    check("only roots come back as top level", section.comments.length === 1, `${section.comments.length} root(s)`);
    check("both replies sit under it", section.comments[0]?.replies.length === 2);
    check("no reply carries replies of its own",
      section.comments[0].replies.every((r) => r.replies.length === 0));
    check("the count includes replies", section.count === 3, `count=${section.count}`);
    check("the project's comment is not in the blog post's section",
      !section.comments.some((c) => c.body === "project comment"));

    // --- permissions ---------------------------------------------------------
    check("you may delete your own", section.comments[0].canDelete === true);

    const asOther = await getCommentSection({
      label: BLOG,
      targetId: postId,
      viewer: { userId: authorId, isAuthor: true, isCoAuthor: false },
      database: tx,
    });
    check("an author may delete anyone's", asOther.comments[0].canDelete === true);

    const signedOut = await getCommentSection({
      label: BLOG,
      targetId: postId,
      viewer: null,
      database: tx,
    });
    check("a signed-out reader may delete nothing",
      signedOut.comments.every((c) => !c.canDelete && c.replies.every((r) => !r.canDelete)));

    const stranger2 = (await tx.execute(
      sql`select a.id from app.account a join app.guest_profile p on p.account_id = a.id where not p.is_author and not p.is_co_author and a.id <> ${strangerId} order by a.joined_at limit 1`,
    )).rows[0];
    check(
      "an ordinary reader may not delete someone else's",
      canDeleteComment({ userId: strangerId, isDeleted: false },
        { userId: stranger2.id, isAuthor: false, isCoAuthor: false }) === false,
    );

    // --- soft delete ---------------------------------------------------------
    await tx.update(comment).set({ isDeleted: true }).where(sql`id = ${root.id}`);
    section = await getCommentSection({
      label: BLOG,
      targetId: postId,
      viewer: viewerStranger,
      database: tx,
    });

    check("a deleted parent keeps its place", section.comments.length === 1);
    check("its replies survive", section.comments[0].replies.length === 2);
    check("its body is blanked", section.comments[0].body === "" && section.comments[0].isDeleted);
    check("it is no longer deletable", section.comments[0].canDelete === false);
    check("and it stops being counted", section.count === 2, `count=${section.count}`);

    throw ROLLBACK;
  });
} catch (error) {
  if (error !== ROLLBACK) {
    console.error("\nUnexpected error — the transaction was rolled back anyway:\n", error);
    await pool.end();
    process.exit(1);
  }
}

const after = await count(db);
console.log("");
check("the transaction was rolled back", after === before, `${before} -> ${after} rows`);

await pool.end();

const failed = checks.filter((c) => !c.pass);
console.log(
  failed.length === 0
    ? `\nAll ${checks.length} comment checks passed against the live schema.`
    : `\n${failed.length} of ${checks.length} checks FAILED.`,
);
process.exit(failed.length === 0 ? 0 : 1);
