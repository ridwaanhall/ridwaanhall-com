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

## Guestbook chat messages

`apps/guestbook/templates/guestbook/guestbook.html` renders new messages twice over: once server-side in `apps/guestbook/templates/guestbook/sections/guestbook_messages.html` (initial page load), and once as a hand-built JS template-string literal in `guestbook.html`'s inline `<script>` (for the AJAX-posted message shown without a reload). Any change to how a message is displayed — badges, pin state, link rendering — must be made in **both** places or new messages will render inconsistently until the next page load.

Message text rendering (both places) checks for a `https://` prefix and renders the whole message as a link instead of escaped text: the `linkify_message` filter in `apps/guestbook/templatetags/guestbook_tags.py` server-side, and the `linkifyMessage()` JS function (same logic, kept in sync manually) client-side.

Pinning is a toggle, not separate pin/unpin endpoints: `PinMessageView` (`apps/guestbook/views.py`) flips `ChatMessage.is_pinned` and enforces `ChatMessage.MAX_PINNED_MESSAGES` (3) only on the pin path. `UserProfileMixin.get_user_profile_data()`'s `can_pin` field (`is_author or is_co_author`) is the single source of truth for pin permission — reuse it rather than re-deriving from `is_author`/`is_co_author` separately. On successful pin, the JSON response includes full profile data (`user`, `message`, `profile_image`, `is_author`, `is_co_author`) so the client can build the pinned card without re-querying — the JS `addPinnedCard()` and Python `enriched_pinned_messages` (in `GuestbookView._get`) must stay shaped the same way. `guestbook.html` has `buildRoleBadgeHtml()`/`buildPinnedAvatarHtml()` JS helpers specifically to avoid a third hand-copy of that markup — reuse them instead of inlining more badge/avatar HTML strings. Pinned message text uses `line-clamp-2` with a JS-driven "Read more" toggle (`checkPinnedReadMore()`, shown only when the text is actually clamped) rather than `truncate`, so the full message stays reachable.

## Gotcha: email templates don't use Django's template engine

Files under `apps/core/templates/core/email/` are rendered by `EmailTemplateLoader._render_template()` (`apps/core/email_templates.py`) via plain `str.replace()` on literal `{{ key }}` tokens — **not** `django.template`. `{% %}` tags do nothing there (silently left as literal text), and any `{{ key }}` not present in the calling method's context dict is left unreplaced in the sent email rather than raising an error. When adding a placeholder to a template, add the matching key to that method's `context` dict in `email_templates.py` in the same change, and verify by rendering (no automated test covers these). All five template pairs (contact/guestbook notification, autoreply, reply-notification — html+txt each) share one dark palette (`#09090b` canvas, `#18181b` card, `#6366f1` indigo accent) matching the site's own `bg-black`/zinc/indigo theme — keep new templates visually consistent with that rather than introducing another palette.

## Gotcha: `{% block head_seo %}` only renders when `seo` is missing from context

`templates/base_seo.html` falls back to `{% block head_seo %}` only in the `{% else %}` branch of `{% if seo %}`. Every view built on `apps/seo/mixins.py`'s `SEOMixin` unconditionally sets `context['seo']`, so `head_seo` never renders for those pages — don't add page-specific meta/JSON-LD there; extend `apps/seo/schema.py`'s `SEOSchemaGenerator` and wire it into `apps/seo/manager.py` instead, matching how existing pages do it.

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
