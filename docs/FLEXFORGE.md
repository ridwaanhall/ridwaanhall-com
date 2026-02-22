# FlexForge Configuration

`FlexForge/` is the Django project root that ties all apps together. It contains settings, URL routing, context processors, and global views.

## File Structure

```
FlexForge/
├── settings.py            # Django settings (security, apps, middleware, DB, auth)
├── config.py              # Environment variable loader (python-decouple)
├── urls.py                # Root URL configuration
├── context_processors.py  # Template context processors
├── views.py               # Global views (custom 404, favicon)
├── wsgi.py                # WSGI entry point (used by Vercel)
└── asgi.py                # ASGI entry point
```

## Settings (`settings.py`)

### Security

Production mode (`DEBUG=False`) enables:

- `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS` (1 year), `SECURE_HSTS_PRELOAD`
- Secure session/CSRF cookies with `HttpOnly` and `SameSite=Lax`
- `X_FRAME_OPTIONS = "DENY"`, `SECURE_CONTENT_TYPE_NOSNIFF`, `SECURE_BROWSER_XSS_FILTER`
- Content Security Policy via `django-csp` (whitelists Google fonts, Cloudflare challenges, wsrv.nl images, etc.)
- Permissions Policy denying access to camera, microphone, geolocation, etc.

### Installed Apps

Always installed:

- `whitenoise.runserver_nostatic` — static file serving
- `django.contrib.*` — standard Django apps including `sitemaps`
- `csp` — Content Security Policy middleware
- `apps.core`, `apps.about`, `apps.data`, `apps.dashboard`, `apps.projects`, `apps.blog`, `apps.openhire`, `apps.seo`

Conditionally installed when `GUESTBOOK_PAGE=True`:

- `allauth`, `allauth.account`, `allauth.socialaccount`
- `allauth.socialaccount.providers.google`, `allauth.socialaccount.providers.github`
- `apps.guestbook`

### Database

- **Development** (`DEBUG=True`): SQLite (`db.sqlite3`)
- **Production** (`DEBUG=False`): PostgreSQL using `POSTGRES_*` environment variables

### Other Settings

- `TIME_ZONE = "Asia/Jakarta"` (WIB, UTC+7)
- `SESSION_COOKIE_AGE = 3600` (1 hour)
- `STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"`
- `DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"`

## Config (`config.py`)

Loads all environment variables using `python-decouple`. Groups:

| Group | Variables |
|-------|-----------|
| Environment | `DEBUG` |
| Security | `SECRET_KEY`, `ACCESS_TOKEN`, `WAKATIME_API_KEY` |
| Turnstile | `USE_CF_TURNSTILE`, `CF_TURNSTILE_SITE_KEY`, `CF_TURNSTILE_SECRET_KEY` |
| URLs | `BASE_URL`, `BLOG_BASE_IMG_URL`, `PROJECT_BASE_IMG_URL`, `AUTHOR_IMG` |
| Hosts | `ALLOWED_HOSTS` (CSV in debug, hardcoded `.vercel.app`/`.ridwaanhall.com` in prod) |
| Email | `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL`, `CONTACT_EMAIL_RECIPIENT` |
| Features | `GUESTBOOK_PAGE`, `WSRV_IMAGE_OPTIMIZATION` |
| OAuth | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GH_CLIENT_ID`, `GH_CLIENT_SECRET` |
| Database | `POSTGRES_DATABASE`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT` |

## URLs (`urls.py`)

Root URL configuration mapping:

```
/                 → apps.core.urls (home, contact, privacy, CV, dynamic assets)
/                 → apps.seo.urls (robots.txt, sitemaps)
/dashboard/       → apps.dashboard.urls
/projects/        → apps.projects.urls
/blog/            → apps.blog.urls
/about/           → apps.about.urls
/openhire/        → apps.openhire.urls
/guestbook/       → apps.guestbook.urls (conditional on GUESTBOOK_PAGE)
/favicon.ico      → favicon_view
```

Custom 404 handler: `FlexForge.views.custom_404_view`

## Context Processors (`context_processors.py`)

Two custom processors available in all templates:

### `feature_flags`

| Variable | Description |
|----------|-------------|
| `GUESTBOOK_PAGE` | Whether guestbook is enabled |
| `AUTHENTICATION_ENABLED` | Same as `GUESTBOOK_PAGE` (auth is only for guestbook) |
| `WSRV_IMAGE_OPTIMIZATION` | Whether wsrv.nl image proxy is enabled |

### `base_settings`

| Variable | Description |
|----------|-------------|
| `BASE_URL` | Site base URL |
| `USE_CF_TURNSTILE` | Whether Cloudflare Turnstile is enabled |
| `CF_TURNSTILE_SITE_KEY` | Turnstile public site key |

## Global Views (`views.py`)

### `custom_404_view`

Renders `error.html` with `error_code: 404` for all unmatched URLs.

### `favicon_view`

Serves `staticfiles/favicon/favicon.ico` with proper error handling. Returns 404 if the file is missing.

## Deployment

The project deploys on **Vercel** using the WSGI entry point. Configuration in `vercel.json`:

- Build: `FlexForge/wsgi.py` with `@vercel/python` (Python 3.12, max 15MB lambda)
- Static files route to `staticfiles/`
- All other routes go through WSGI

Static files are served by **WhiteNoise** with compressed manifest storage.
