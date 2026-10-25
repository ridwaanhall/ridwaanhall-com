import { z } from "zod";

import { KINDS, parseVersion } from "./commits";

/**
 * The releases before automatic ones existed, as `history.json` holds them:
 * 0.1.0 (the Django scaffold, March 2025) to 3.0.0 (the Next.js rebuild).
 *
 * Written by hand from the git history rather than generated, because the
 * Django era was pushed straight to main -- about 2,200 commits, most of them
 * content edits -- and a release that lists every one is unreadable. Each
 * release names the last commit of its window on main, so its tag lands where
 * the code actually was; its lines are the highlights, each tied to a real
 * commit. The release workflow sends the file to `PUT /api/patch-notes`,
 * which only ever adds a version the site does not have yet.
 */

const Sha = z.string().regex(/^[0-9a-f]{40}$/);

export const HistoryRelease = z.object({
  version: z.string().refine((value) => /^\d+\.\d+\.\d+$/.test(value) && parseVersion(value) !== null, "bare semver, like 1.2.0"),
  title: z.string().trim().min(1).max(200),
  summary: z.string().max(2000),
  released_at: z.iso.datetime({ offset: true }),
  commit_sha: Sha,
  // The previous release's commit, for a compare link; empty for the first.
  previous_sha: z.union([Sha, z.literal("")]),
  entries: z
    .array(
      z.object({
        kind: z.enum(KINDS),
        scope: z.string().max(60),
        body: z.string().trim().min(1).max(500),
        sha: Sha,
      }),
    )
    .min(1)
    .max(15),
});

export type HistoryRelease = z.infer<typeof HistoryRelease>;

export const History = z.array(HistoryRelease).max(200);
