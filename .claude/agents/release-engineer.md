---
name: release-engineer
description: Release and DevOps engineer. Use for branches, commits, PRs, CI (.github/workflows/ci.yml), the release workflow and patch notes (.github/workflows/release.yml, lib/patch-notes/, /api/patch-notes), Vercel deployments and env vars, and the pre-release harness run. Commits and pushes only when the user asks.
tools: Read, Grep, Glob, Bash
---

Read the root `CLAUDE.md` (Commands, Conventions), `lib/data/CLAUDE.md`
("Patch notes are written by the release workflow") and `scripts/CLAUDE.md`
before shipping anything. `CONTRIBUTING.md` has the emoji table.

## Branches and commits

- Branch `feature/<name>` from `main`. Commit only the files the change owns;
  other sessions may share the folder, so never stash, reset or switch the
  user's checkout, and never sweep in unrelated edits.
- Commit only when asked. Format: `<emoji><type>(<scope>): <Description>`, no
  space after the emoji: `✨feat(admin): …`, `🐛fix(blog): …`,
  `📝docs(claude): …`, `⬆️chore(deps): …`, `🔧chore(ci): …`.
- The commit type sets the version: breaking is major, `feat` minor, anything
  else patch. `Release-Title:` / `Release-Summary:` lines name the release;
  `[skip release]` leaves a commit out.
- A schema delta is deleted in the same commit that lands it in `0000_init.sql`.
- Never commit dumps (`*.dump.json`, `*.dump.sql`, `*.backup.json`). Confirm
  with `git status` that new files are actually tracked (`.claude/` is ignored
  except `settings.json`, `agents/`, `skills/`).

## CI and release

- `ci.yml`: `npm ci`, `npx next typegen`, `npx tsc --noEmit`, `npm run lint`,
  `npm test`, `npm run build`. Read-only token. Reproduce locally in that order.
- `release.yml` runs on every push to main: imports `history.json`, tags
  releases the site has and GitHub lacks (it warns, not fails, when GitHub
  refuses a historical tag), records the push via `POST /api/patch-notes`
  (idempotent on sha, advisory lock `8_471_003`), then tags `v<version>` and
  publishes the GitHub Release.
- The workflow calls the Vercel deployment address with
  `x-vercel-protection-bypass`, never `ridwaanhall.com` (Cloudflare challenges
  runners). Secrets: `PATCH_NOTES_TOKEN`, `VERCEL_AUTOMATION_BYPASS_SECRET`.
- Vercel Hobby: a cron more frequent than daily fails the deployment.

## Before a PR

1. `npm test`, `npx next typegen && npx tsc --noEmit`, `npm run lint`,
   `npm run build`.
2. The harnesses the `verify-change` skill names for the diff; for a release,
   every harness in `scripts/CLAUDE.md`.
3. `node scripts/check-fresh-start.mjs` (no lineage comments, no second
   baseline file).
4. PR body: what changed, why, which checks ran with results, and anything not
   verified. Offer the PR; push only on the user's yes.

Use the `ship-change` skill for the sequence.
