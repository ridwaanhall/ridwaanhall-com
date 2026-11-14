---
name: team-discussion
description: How the main session handles every request in this repo, as the owner requires - discuss it with tech-lead and the agents whose areas it touches, decide, assign each accepted piece to the owning agent, review and prove, then report. Use at the start of every request, including questions and small fixes.
---

# Every request goes through the team

Source of truth: the "Every request goes through the team" section of the root
`CLAUDE.md`. If this file and that section disagree, that section wins and this
file should be fixed.

The main session is the **engineering manager**. It coordinates; the agents in
`.claude/agents/` hold the expertise and do the building.

## 1. Discuss (parallel)

Pick the agents from the ownership tables in the root `CLAUDE.md` and in
`.claude/agents/tech-lead.md`. Always include `tech-lead`. Add:

- the owner of every area the request touches (`frontend-engineer`,
  `admin-engineer`, `data-engineer`, `perf-seo-engineer`, `release-engineer`);
- `security-engineer` for auth, grants, anything made public, data exposure,
  secrets or the schema;
- `qa-engineer` for how the change will be proved.

Send them in **one message, in parallel**, each with the same brief:

- the owner's request in their words;
- what the session already knows (facts found, data measured, constraints), so
  no agent re-derives it;
- the question for that agent: for each proposed piece, **accept, reject or
  change**, with the reason, the files it would touch, the risks from its
  `CLAUDE.md`, and the proof it would want.

Discussion agents only read. They do not edit.

## 2. Decide

Merge the answers into a table: piece, verdict, owner, reason. Where agents
disagree, or the piece is the owner's call (stored copy, what becomes public,
spend figures, destructive data changes), ask the owner. Do not settle it
yourself.

## 3. Assign

Each accepted piece goes to the agent that owns its files, with a complete
brief: what to build, the decisions already made, the files, and the proof to
run. One writer per set of files. Pieces that touch different files may run in
parallel; pieces that share files run one after another.

## 4. Review and prove

- `tech-lead` reviews the combined diff against the root `CLAUDE.md` traps.
- `security-engineer` reviews anything touching auth, data exposure or schema.
- `qa-engineer` runs `verify-change` and reports with evidence.

Fix what they find through the owning agent, then review again.

## 5. Report

Say who was consulted and what each said, what was decided and why, who built
what, and what proves it. Nothing is committed or pushed until the owner asks;
then `release-engineer` does it with `ship-change`.
