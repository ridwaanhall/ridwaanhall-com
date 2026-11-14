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

## 0. Model and effort: think in Opus, act in Sonnet

The owner's rule, to keep usage low: the main session runs on **Opus 5.5**
and does the thinking (discussion synthesis, decisions, briefs, coaching);
the agents do the reading, building and checking on **Sonnet 5.5**. Never an
older version: no Opus 5, no Sonnet 5.

- **Default.** Every agent's frontmatter pins `model: claude-sonnet-5-5` and a
  default `effort`, so a plain delegation is already Sonnet 5.5. Do not pass
  `model` unless escalating.
- **Escalate to Opus 5.5** by passing `model: "opus"` on that one call (the
  main session is Opus 5.5, so the alias resolves to it). Escalate when:
  - the design spans two or more areas (schema, descriptor and UI together);
  - it touches auth, grants, RLS, `proxy.ts`, CSP or sanitising;
  - it is a schema delta or any write to live rows;
  - debugging has no known cause after one Sonnet pass;
  - a Sonnet attempt failed review twice (escalate, do not try a third time);
  - it is the final review behind a security-sensitive change.
- **Effort**, passed per call when it differs from the agent's default:
  `low` for discussion, verification runs and commits; `medium` for ordinary
  builds and reviews; `high` for Opus work (security review, schema or
  live-DB work, unknown-cause debugging). `xhigh`/`max` only on the owner's word.
- **Briefs are where Opus earns its cost.** A Sonnet agent succeeds first time
  when the brief carries: the goal and the decisions already made (so it does
  not reopen them); the exact files to touch and the files that are off
  limits; the traps that apply, one line each from the `CLAUDE.md` files; the
  exact proof commands, marking which need `npm run dev` or
  `--conditions=react-server`; a "no live data unless stated" line; the report
  format (pass/fail per command, files changed, open questions) and a word
  limit (about 150 for discussion, 200 to 400 for builds).
- **Cheaper beyond the model.**
  - Write the shared context once to a brief file in the scratchpad and point
    every agent at it, adding only its own question.
  - Run discussion read-only and in parallel, in one message.
  - Ask for verdicts and `file:line`, never code recaps.
  - Consult only the agents whose areas the request touches (`tech-lead`
    always).
  - Continue an agent with a message while its context is still relevant
    instead of starting a new one.
  - Review once on the combined diff, not piece by piece.
  - Skip the UI harnesses when no UI path changed.
- **Coach a failed attempt.** When an agent's work fails review, send it the
  findings with the exact fix expected. Do not do the fix yourself, and do not
  restart the agent from nothing.

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
what, and what proves it. Once tech-lead, security (where relevant) and QA
report no issues,
`release-engineer` ships it with `ship-change`: commit, push the branch, open
the PR, wait for CI, merge. That is the owner's standing instruction; a red
check or an unresolved finding stops it and goes back to the owner.
