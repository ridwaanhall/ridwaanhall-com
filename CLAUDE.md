# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

Django 6.0 (Python 3.14+), managed with **uv** (not pip/poetry — always `uv sync` / `uv run ...`), Tailwind CSS v4 via CLI, deployed to Vercel (WSGI). Project package is `FlexForge/`; apps live under `apps/`. Database and media storage are both Supabase (Postgres + Storage) in production; SQLite is used automatically in development/tests.

## Commands

- Install deps: `uv sync`
- Dev server: `uv run python manage.py runserver`
- Tests: `uv run python manage.py test` (e.g. `uv run python manage.py test apps.blog` for one app) — this is what CI runs and is the canonical command. The README also mentions `uv run pytest`; pytest-django is configured and works, but CI does not use it.
- Django check: `uv run python manage.py check`
- Tailwind build: `npx @tailwindcss/cli -i ./static/css/input.css -o ./staticfiles/css/global-wvbpenzt.css --minify` (add `--watch` for dev). There is no `collectstatic` step anywhere in this project's pipeline (not in CI, not in the Vercel build) — the built `staticfiles/` output (images, fonts, icons, compiled CSS, JS) is committed directly and served as-is. This is why `STORAGES["staticfiles"]` uses WhiteNoise's plain `CompressedStaticFilesStorage`, **not** `CompressedManifestStaticFilesStorage`: none of these pre-built assets live under any `STATICFILES_DIRS` source `collectstatic` could discover (they're placed directly under `STATIC_ROOT`), so a manifest can never be generated for them — `ManifestStaticFilesStorage`'s strict lookup would 500 on every `{% static %}` tag referencing one (this was a real, live bug on the `main` branch — every page extending `templates/base_seo.html` 500'd via its favicon links). If you add a genuinely new static asset with a `{% static %}` reference, just drop the file under `staticfiles/` directly with its final name (matching the hand-picked cache-busted filename convention below) — don't reach for `collectstatic`.

## Architecture: Django ORM (Supabase-backed)

Content (bio, experience, projects, blog posts, education, awards, applications, hiring/open-to-work status, privacy policy) lives as real Django models — `apps/about/models.py`, `apps/blog/models.py`, `apps/projects/models.py`, `apps/openhire/models.py`, `apps/core/models.py` (`PrivacyPolicy`) — backed by Postgres (Supabase in prod, SQLite in dev/tests). This replaced an earlier "Individual File System" (dataclasses in per-app `data/` files, no DB) — that whole layer (`apps/*/data/`, `apps/core/dynamic_loader.py`) was migrated and removed; don't recreate it.

- **Access pattern preserved on purpose**: `apps/core/data_service.py`'s `DataService`, `apps/about/manager.py`'s `AboutManager`, `apps/core/content_manager.py`'s `ContentManager`, and `apps/openhire/manager.py`'s `OpenHireManager` are the only things views/templates/`apps/seo/schema.py` talk to. They query the ORM internally but hand back the exact same plain `dict`/`list[dict]` shapes the old dataclass files produced (including derived fields like `image_url`/`img_name`/`image_count` on blog/project dicts, built by `apps/core/content_manager.py`'s `_add_image_compat_fields`). Extend these managers rather than querying models directly from views, and preserve the dict shape when you do.
- **Singletons** (`Profile`, `HiringProfile`, `OpenToWorkProfile`, `PrivacyPolicy`) extend `apps/core/models.py`'s `SingletonModel` (forces `pk=1`, blocks delete) and use `.load()` (get-or-create) rather than a plain query.
- **Slugs are computed, not stored data**: `BlogPost.slug`/`Project.slug` are `slugify(title)`, resolved via `apps/core/base_views.py`'s `DetailView.get_item_by_slug(queryset, slug, to_dict_fn)` — an indexed DB lookup (`get_object_or_404`), not a linear scan.
- **Ordered M2M**: `Profile.skills_highlight` goes through `ProfileSkillHighlight` (profile, skill, `order`) because the sequence is editorial — it becomes the JSON-LD `knowsAbout` array. Read it via `profile.skill_highlights` (prefetch `skill_highlights__skill`), never the bare M2M, which returns `Skill.Meta.ordering` (pk) order. A through model rules out `filter_horizontal` (`admin.E013`), so the admin uses a `TabularInline` with `autocomplete_fields`. `Project.tech_stack` stays a plain M2M with `filter_horizontal` — its order genuinely doesn't matter. Note Django cannot `AlterField` a M2M's `through=`; changing one needs `RemoveField` + `AddField` with the data copied out first.
- **Images**: `ImageField`s use `FileSystemStorage` (local `media/`, gitignored) when `DEBUG`/tests, and a custom Supabase Storage backend (`apps/core/storage.py`'s `SupabaseStorage`) in production — chosen by `STORAGES["default"]` in `FlexForge/settings.py`, mirroring the `DATABASES` sqlite/Postgres split. This is deliberate: local dev works fully offline and never pollutes the shared production bucket with test uploads. `SupabaseStorage` talks directly to Supabase's Storage REST API with `requests` (deliberately not django-storages/boto3, to stay well under Vercel's `maxLambdaSize: 15mb`). It overrides `generate_filename`/`get_available_name` to sidestep two real bugs: Django's base `Storage` methods route file paths through `os.path.join`/`os.path.normpath`, which inject backslashes on Windows dev machines and corrupt the object key; and the default exists-check-and-rename collision avoidance is pointless here since uploads are upsert-safe (`x-upsert: true`) — both are overridden to keep names deterministic and forward-slash-only regardless of host OS. Skill icons stay plain URL strings (not `ImageField`) since they're static SVGs and Pillow can't validate SVG anyway.
- **Admin** (`apps/*/admin.py`) is fully registered — `path('admin/', admin.site.urls)` lives in `FlexForge/urls.py` (it wasn't wired in at all before this existed; don't assume admin is reachable just because models are registered — check both).
- **Row Level Security**: Supabase exposes a PostgREST API over the `public` schema to anyone holding the project's anon/service keys, entirely independent of Django. `apps/core/signals.py`'s `enable_row_level_security` runs on every `post_migrate` (Postgres only, idempotent) and force-enables RLS on every public table — this has zero effect on Django's own queries since its Postgres role has `BYPASSRLS`, but closes the PostgREST exposure. Don't disable this; if a table shows RLS off in the Supabase dashboard, `manage.py migrate` hasn't run since it was disabled — re-run `migrate` to restore it.

## Admin: JSON fields get structured editors, never a raw JSON textarea

Semi-structured content (`stories`, `responsibilities`, `achievements`, `tags`, `Project.description`, the 14 openhire lists, all 10 privacy-policy sections, `BlogPost.content`) stays stored as `models.JSONField`, but the admin never shows raw JSON. `apps/core/admin_widgets.py` provides five Field/Widget pairs — `StringListField`, `KeyValueField`, `GroupedKeyValueField`, `CopyrightCreditsField`, `ContentBlockField` — and `apps/core/admin_forms.py`'s `string_list_form()` builds a `ModelForm` for the common all-string-lists case in one line. When adding a JSON field, wire it to one of these rather than leaving the default textarea.

- **Declare fields on a `ModelForm`, not via `formfield_overrides`** — the latter maps a whole field *class* to one widget, which can't express `BlogPost` (`content` vs `tags`) or `PrivacyPolicy` (three shapes across ten columns).
- **For an inline, pass `exclude=(<parent fk>,)`** to `string_list_form()`. `fields = "__all__"` otherwise pulls the parent FK in as a required select and *no save can succeed* (this bit `PositionInline`).
- **One named control, name-less UI.** Each widget renders a single `<textarea name="…">` holding the JSON; `staticfiles/js/adminJsonWidgets.js` hides it and builds the editor from name-less elements, mutating the parsed model in place. Don't "improve" this into one named input per item: a `<textarea>`'s submission value is CRLF-normalised (which would corrupt the one `pre` block containing real newlines), `construct_instance` would silently keep the old value when you clear a list, and `inlines.js`'s `__prefix__` renumbering would have N names and duplicate ids to rewrite. It also degrades to the old raw-JSON textarea when JS is unavailable.
- **`has_changed` must treat `initial=None` as the shape's zero value**, or every blank "add another" inline row counts as changed, gets fully validated, and blocks the page from saving. Formsets gate both `save_existing()` and new-row creation on `has_changed`.
- **No key-reorder controls on dict editors.** Production is Postgres `jsonb`, which normalises object key order — such a control would appear to work on SQLite locally and be a silent no-op live. List order *is* preserved by jsonb, so list reordering is real and supported.
- **Never trim or normalise values.** Two stored `class` strings contain double spaces, and block `text` is raw HTML rendered `|safe`. Widget JS uses `document.createElement` + `el.value = …`, never `innerHTML`.
- Widget templates live in `apps/core/templates/core/widgets/` — the default `FORM_RENDERER` searches app `templates/` dirs (`django/forms/renderers.py`), so no settings change is needed. Assets go straight into `staticfiles/js|css/` per the convention above, and `class Media` deliberately does **not** list jQuery (admin loads `jquery.js` in DEBUG vs `jquery.min.js` otherwise; declaring it double-loads and breaks `noConflict`).
- When changing any of this, re-run the fidelity checks: `apps/core/tests.py`'s `AdminJSONWidgetRoundTripTest`, and a GET-then-POST-unchanged pass over the admin change forms — that combination is what catches CRLF corruption, silent field drops, and `has_changed` regressions, none of which unit tests alone reveal.

## View pattern

Views inherit from `apps/core/base_views.py`'s `BaseView`/`PaginatedView`/`DetailView` and implement `_get(self, request, *args, **kwargs)`, not `get()` — `BaseView.get()` already wraps `_get` in `handle_exceptions` for consistent error pages across the app. Only override `get()` directly for views with fundamentally different behavior (e.g. the CV redirect views in `apps/core/views.py`). `BaseView.get_about_data()` caches its result on the view instance (`self._about_data_cache`) since several views/SEO mixins call it more than once per request — that used to be free (static in-memory data) and is now a real ORM query, so don't remove the cache without checking query counts.

`apps/projects/types/project.py` still has `ProjectStatus`/`PROJECT_STATUS_SORT_RANK`/`normalize_project_status` (pure lifecycle-status logic, no DB dependency) — everything else that used to live under `apps/*/types/` (the old IFS dataclasses) is gone.

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

## Gotcha: `STORAGES` setting fully replaces, not merges

`FlexForge/settings.py`'s `STORAGES` dict must declare both `"default"` (the Supabase backend) and `"staticfiles"` (WhiteNoise's `CompressedStaticFilesStorage` — plain compression, deliberately not the `Manifest` variant, see the Commands section above) — Django doesn't merge this setting with any implicit default, so omitting `"staticfiles"` silently reverts static file handling with no error at settings-load time.

## Gotcha: `DISABLE_SERVER_SIDE_CURSORS` lives inside `DATABASES["default"]`

Not a top-level Django setting — it's a key in the database config dict. Required for correctness under Supabase's pooled (pgbouncer transaction-mode) connection, where named/server-side cursors don't work reliably.

## Gotcha: model `post_save` signals must guard `kwargs.get('raw')`

`apps/guestbook/models.py`'s `create_user_profile`/`save_user_profile` and `apps/guestbook/signals.py`'s `send_guestbook_email_notification` all check `if kwargs.get('raw'): return` early. Without this, `manage.py loaddata` (fixture/backup restore) replays every row through normal signal-triggered side effects — auto-creating a `UserProfile` that collides with the fixture's own explicit row, or sending real emails for years-old historical messages. Apply the same guard to any new `post_save` receiver with a side effect (DB write, email, external API call).

## Code style

Ruff is configured for linting (`uv run ruff check`) — line-length (E501) is intentionally excluded since the codebase predates the 88-char convention and isn't reformatted to it yet; don't "fix" long lines just because ruff would otherwise flag them. No formatter (black/ruff format) is set up, so don't assume one exists.

## Git conventions

- Commits: emoji-prefixed conventional commits, `<emoji><type>(<scope>): <Description>` (no space after the emoji), e.g. `✨feat(about): ...`, `🐛fix(blog): ...`, `📝docs(report): ...`. Scope is usually the app/module name. `CONTRIBUTING.md` only documents the plain (non-emoji) form — the emoji prefix is real repo convention, not written down elsewhere.
- Branches: `feature/your-feature-name`.

## Environment

Env vars are loaded via `python-decouple` from a local `.env` (see `.env.example` for keys), plus `.env.local` — a second, gitignored file (Vercel's Supabase integration output via `vercel env pull`) that `FlexForge/config.py`'s `_load_env_local()` merges into `os.environ` at import time (`decouple.config()` doesn't read multiple files natively). SQLite (`db.sqlite3`) is used automatically when `DEBUG=True` or during tests; Supabase Postgres is used otherwise, via `STORAGE_POSTGRES_URL` (pooled/pgbouncer — runtime traffic) or `STORAGE_POSTGRES_URL_NON_POOLING` (direct — `migrate`/`loaddata`/other DDL, since those are unreliable behind transaction-mode pooling). Set `GUESTBOOK_PAGE=False` to skip Google/GitHub OAuth setup entirely.

`SECRET_KEY`, `ACCESS_TOKEN`, `EMAIL_HOST_USER`, and `EMAIL_HOST_PASSWORD` (`FlexForge/config.py`) have no defaults — the app won't start locally without a `.env` providing all four, even outside the guestbook/Turnstile flows.
