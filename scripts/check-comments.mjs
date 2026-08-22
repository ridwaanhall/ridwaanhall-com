/**
 * Exercise the comment rules against the real schema, then roll it back.
 *
 * The table is empty on live, so there is nothing to compare a rendered page
 * against the way `compare-guestbook.mjs` does. What can still be checked for
 * real are the rules Django put in `Comment.save()` and enforced with the
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
const { commentIdsOnTarget, contentTypeId, getCommentSection } = await import(
  "../lib/data/comments.ts"
);
const { canDeleteComment } = await import("../lib/data/comment-shapes.ts");
const { commentsComment } = await import("../lib/db/schema.ts");
const { sql } = await import("drizzle-orm");

const checks = [];
const check = (name, pass, detail = "") => {
  checks.push({ name, pass });
  console.log(`  ${pass ? "ok  " : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
};

const count = async (database) =>
  (await database.execute(sql`select count(*)::int c from comments_comment`)).rows[0].c;

const before = await count(db);
console.log(`live comment rows before: ${before}\n`);

const ROLLBACK = Symbol("rollback");

try {
  await db.transaction(async (tx) => {
    const blogType = await contentTypeId("blog.blogpost", tx);
    const projectType = await contentTypeId("projects.project", tx);
    check("content types resolve by natural key", blogType > 0 && projectType > 0,
      `blog=${blogType} project=${projectType}`);
    check("they are different tables", blogType !== projectType);

    // A real post and project, and two real users so the FKs hold.
    const [{ id: postId }] = (await tx.execute(sql`select id from blog_blogpost order by id limit 1`)).rows;
    const [{ id: projectId }] = (await tx.execute(sql`select id from projects_project order by id limit 1`)).rows;
    const [{ id: authorId }] = (await tx.execute(
      sql`select u.id from auth_user u join guestbook_userprofile p on p.user_id = u.id where p.is_author order by u.id limit 1`,
    )).rows;
    const [{ id: strangerId }] = (await tx.execute(
      sql`select u.id from auth_user u join guestbook_userprofile p on p.user_id = u.id where not p.is_author and not p.is_co_author order by u.id limit 1`,
    )).rows;

    const add = async (body, { replyToId = null, userId = strangerId, typeId = blogType, objectId = postId } = {}) => {
      const [row] = await tx
        .insert(commentsComment)
        .values({
          contentTypeId: typeId,
          objectId,
          userId,
          body,
          replyToId,
          isDeleted: false,
          createdAt: new Date().toISOString(),
        })
        .returning({ id: commentsComment.id, replyToId: commentsComment.replyToId });
      return row;
    };

    // --- one level of nesting ------------------------------------------------
    const root = await add("root comment");
    const reply = await add("a reply", { replyToId: root.id });

    // The flattening rule, as `postComment` applies it: resolve the requested
    // parent on this target, then use *its* parent if it has one.
    const flatten = async (requestedId, typeId = blogType, objectId = postId) => {
      const [parent] = await commentIdsOnTarget(typeId, objectId, [requestedId], tx);
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
      (await flatten(root.id, projectType, projectId)) === null,
      `blog #${root.id} requested from project #${projectId}`,
    );
    const onProject = await add("project comment", { typeId: projectType, objectId: projectId });
    check(
      "and the same id on its own target still resolves",
      (await flatten(onProject.id, projectType, projectId)) === onProject.id,
    );

    // --- the section renders one level --------------------------------------
    const viewerStranger = { userId: strangerId, isAuthor: false, isCoAuthor: false };
    let section = await getCommentSection({
      label: "blog.blogpost",
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
      label: "blog.blogpost",
      targetId: postId,
      viewer: { userId: authorId, isAuthor: true, isCoAuthor: false },
      database: tx,
    });
    check("an author may delete anyone's", asOther.comments[0].canDelete === true);

    const signedOut = await getCommentSection({
      label: "blog.blogpost",
      targetId: postId,
      viewer: null,
      database: tx,
    });
    check("a signed-out reader may delete nothing",
      signedOut.comments.every((c) => !c.canDelete && c.replies.every((r) => !r.canDelete)));

    const stranger2 = (await tx.execute(
      sql`select u.id from auth_user u join guestbook_userprofile p on p.user_id = u.id where not p.is_author and not p.is_co_author and u.id <> ${strangerId} order by u.id limit 1`,
    )).rows[0];
    check(
      "an ordinary reader may not delete someone else's",
      canDeleteComment({ userId: strangerId, isDeleted: false },
        { userId: stranger2.id, isAuthor: false, isCoAuthor: false }) === false,
    );

    // --- soft delete ---------------------------------------------------------
    await tx.update(commentsComment).set({ isDeleted: true }).where(sql`id = ${root.id}`);
    section = await getCommentSection({
      label: "blog.blogpost",
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
