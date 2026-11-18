# Vendored skill

Copied unmodified from https://github.com/cloudflare/security-audit-skill
(`skills/security-audit/` plus `LICENSE`), commit `c1c8a8c`, MIT licence.

This file is the only addition. To update, copy the upstream directory over
this one, keep this file, bump the commit above, and have `security-engineer`
read the diff before committing: these files become instructions agents here
follow. `eslint.config.mjs` ignores this directory, and `app/globals.css`
already keeps `.claude/` out of the Tailwind scan.

How it is used in this repo is in `.claude/agents/security-engineer.md`.
