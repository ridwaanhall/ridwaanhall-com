import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";
import { z } from "zod";

import { fail, handle, ok } from "@/lib/api/response";
import { getPatchNotes } from "@/lib/data/patch-notes";
import { TAGS } from "@/lib/data/tags";
import { History } from "@/lib/patch-notes/history";
import { importHistory, recordRelease } from "@/lib/patch-notes/record";

/** The published release history, newest first. */
export const GET = handle(async () => ok(await getPatchNotes()));

const Push = z.object({
  sha: z.string().regex(/^[0-9a-f]{40}$/),
  commits: z
    .array(z.object({ sha: z.string().regex(/^[0-9a-f]{40}$/), message: z.string().max(10_000) }))
    .max(500),
});

/**
 * Compared in constant time so the answer's timing says nothing about how much
 * of a guess was right. An unset token refuses everything rather than
 * accepting an empty bearer.
 */
function authorised(header: string | null): boolean {
  const token = process.env.PATCH_NOTES_TOKEN;
  if (!token || !header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Record a push to main as a release; called by `.github/workflows/release.yml`.
 *
 * **Guarded, unlike the cron route this replaced in spirit.** That one could
 * only flip a flag on rows whose time had come; this writes text a stranger
 * chose onto a public page, so it takes a secret shared with the workflow.
 *
 * `revalidateTag` rather than `updateTag`, which is refused outside a Server
 * Action, and with `expire: 0` rather than `"max"`: a release should be on the
 * page the next time anybody looks, not the time after.
 */
export const POST = handle(async (request: Request) => {
  if (!authorised(request.headers.get("authorization"))) return fail("Unauthorized", 401);

  const parsed = Push.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("Expected { sha, commits: [{ sha, message }] }", 400);

  const result = await recordRelease(parsed.data.sha, parsed.data.commits);
  if ("version" in result && result.created) revalidateTag(TAGS.patchNotes, { expire: 0 });
  return ok(result);
});

/**
 * Add the releases from `lib/patch-notes/history.json` the site lacks; called
 * by the release workflow before it tags anything. Insert-only, so sending
 * the file on every run changes nothing once it is in, and a release reworded
 * in the admin keeps its wording.
 */
export const PUT = handle(async (request: Request) => {
  if (!authorised(request.headers.get("authorization"))) return fail("Unauthorized", 401);

  const parsed = History.safeParse((await request.json().catch(() => null))?.releases);
  if (!parsed.success) return fail("Expected { releases: [...] } in the shape of lib/patch-notes/history.json", 400);

  const result = await importHistory(parsed.data);
  if (result.inserted.length > 0) revalidateTag(TAGS.patchNotes, { expire: 0 });
  return ok(result);
});
