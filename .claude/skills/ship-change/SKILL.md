---
name: ship-change
description: Take a finished change from working tree to an offered PR in this repo - feature branch, scoped commit in the emoji conventional format, CI-equivalent checks, PR body with evidence. Use when the user asks to commit, open a PR, or ship.
---

# Ship a change

Owner: `release-engineer`. Rules: root `CLAUDE.md` (Conventions),
`CONTRIBUTING.md`, `lib/data/CLAUDE.md` (release workflow).

1. **Only when asked.** Commits and pushes need the user's request.
2. **Branch** `feature/<name>` from `main`. If the checkout is shared or has
   unrelated uncommitted edits, use a worktree outside the repo folder
   (`git worktree add ../<repo>-<name> -b feature/<name> main`) rather than
   switching, stashing or resetting. A worktree inside the repo is read by `tsc`.
3. **Stage only your files**, by path. `git status` must show new files as
   tracked (`.claude/` is ignored except `settings.json`, `agents/`, `skills/`;
   dumps are ignored by name).
4. **Run CI locally, in CI's order**:
   `npm ci` (if deps changed) -> `npx next typegen` -> `npx tsc --noEmit` ->
   `npm run lint` -> `npm test` -> `npm run build`; plus `verify-change`'s
   harnesses for the diff and `node scripts/check-fresh-start.mjs`.
5. **Commit message**: `<emoji><type>(<scope>): <Description>`, no space after
   the emoji. Body says why. Add `Release-Title:` / `Release-Summary:` only when
   naming the release; `[skip release]` for changes readers should not see in
   patch notes (rare).
6. **PR**: title = the commit subject; body = what, why, checks run with
   results, what was not verified, any live-data change and its snapshot.
   Offer it; push and open it on the user's yes.
7. After merge, `release.yml` records the patch note and tags; nothing manual.
