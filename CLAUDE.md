# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Django 6.0 (Python 3.14+), managed with **uv** (not pip/poetry — always `uv sync` / `uv run ...`), Tailwind CSS v4 via CLI, deployed to Vercel (WSGI). Project package is `FlexForge/`; apps live under `apps/`.

## Commands

- Install deps: `uv sync`
- Dev server: `uv run python manage.py runserver`
- Tests: `uv run python manage.py test` (e.g. `uv run python manage.py test apps.blog` for one app) — this is what CI runs and is the canonical command. The README also mentions `uv run pytest`; pytest-django is configured and works, but CI does not use it.
- Django check: `uv run python manage.py check`
- Tailwind build: `npx @tailwindcss/cli -i ./static/css/input.css -o ./staticfiles/css/global-wvbpenzt.css --minify` (add `--watch` for dev). There is no `collectstatic` step in CI — the built `staticfiles/` output is committed directly.

## Architecture: Individual File System (IFS)

Content (bio, experience, projects, blog posts, education, awards, etc.) is stored as Python dataclasses in individual files under each app's `data/` subpackage — e.g. `apps/about/data/experiences_data.py`, `apps/projects/data/projects/project-N.py` — not as database rows. No migrations are needed for content changes. It's accessed via `apps/core/data_service.py`'s `DataService`, or per-app managers like `apps/about/manager.py`. Blog posts and projects are loaded dynamically per request via `apps/core/dynamic_loader.py`'s `load_items_from_dir` (shared by `apps/blog/data/blog_index.py` and `apps/projects/data/projects_index.py`).

## View pattern

Views inherit from `apps/core/base_views.py`'s `BaseView`/`PaginatedView`/`DetailView` and implement `_get(self, request, *args, **kwargs)`, not `get()` — `BaseView.get()` already wraps `_get` in `handle_exceptions` for consistent error pages across the app. Only override `get()` directly for views with fundamentally different behavior (e.g. the CV redirect views in `apps/core/views.py`).

Frozen dataclasses under `apps/*/types/` get `to_dict()` from `apps/core/types/mixins.py`'s `DictConvertible` mixin (`class Foo(DictConvertible): ...`) — don't add a per-class `to_dict()` override.

## Gotcha: hardcoded compiled CSS filename

The compiled Tailwind output filename (currently `global-wvbpenzt.css`) is a hand-picked string, not an auto-generated hash. It's hardcoded in three places that must stay in sync:

1. The Tailwind CLI `-o` path (above)
2. `templates/base_seo.html`
3. `templates/error.html`

Renaming it requires updating all three plus regenerating/removing the old file under `staticfiles/css/`.

## Code style

Ruff is configured for linting (`uv run ruff check`) — line-length (E501) is intentionally excluded since the codebase predates the 88-char convention and isn't reformatted to it yet; don't "fix" long lines just because ruff would otherwise flag them. No formatter (black/ruff format) is set up, so don't assume one exists.

## Git conventions

- Commits: emoji-prefixed conventional commits, `<emoji><type>(<scope>): <Description>` (no space after the emoji), e.g. `✨feat(about): ...`, `🐛fix(blog): ...`, `📝docs(report): ...`. Scope is usually the app/module name. `CONTRIBUTING.md` only documents the plain (non-emoji) form — the emoji prefix is real repo convention, not written down elsewhere.
- Branches: `feature/your-feature-name`.

## Environment

Env vars are loaded via `python-decouple` from a local `.env` (see `.env.example` for keys). SQLite (`db.sqlite3`) is used automatically when `DEBUG=True` or during tests; PostgreSQL (`POSTGRES_*`) is used otherwise. Set `GUESTBOOK_PAGE=False` to skip Google/GitHub OAuth setup entirely.

`SECRET_KEY`, `ACCESS_TOKEN`, `EMAIL_HOST_USER`, and `EMAIL_HOST_PASSWORD` (`FlexForge/config.py`) have no defaults — the app won't start locally without a `.env` providing all four, even outside the guestbook/Turnstile flows.
