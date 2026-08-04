# FlexForge - Advanced Developer Portfolio Platform

[![Django](https://img.shields.io/badge/Django-6.x-092E20?style=flat&logo=django&logoColor=white)](https://djangoproject.com/)
[![Python](https://img.shields.io/badge/Python-3.14+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

![FlexForge Portfolio](https://ridwaanhall.com/static/img/project/ridwaanhall_com_2025070701.webp)

> **A Django portfolio platform built for [ridwaanhall.com](https://ridwaanhall.com) — file-based content management, real-time GitHub/WakaTime dashboards, a configurable OAuth guestbook, and enterprise-grade security. Fork it and make it your own; see [Making It Your Own](#making-it-your-own) below.**

## Key Features

- **🗂️ Individual File System (IFS)**: Every blog post and project lives in its own Python file as a typed dataclass — no database, no migrations, just add a file
- **📊 Real-time Dashboard**: Live GitHub contribution graph and WakaTime coding-activity stats, cached for 15 minutes
- **💬 Interactive Guestbook**: Google/GitHub OAuth login, threaded replies, author/co-author roles, email notifications — or disable it entirely with one env var
- **📝 Blog & Projects**: Paginated, searchable listings with multi-image support, tags, categories, and a project lifecycle status system
- **🔍 SEO Built In**: Per-page meta tags, Open Graph, Twitter Cards, JSON-LD schema, and auto-generated sitemaps/robots.txt
- **🛡️ Security-First**: Content-Security-Policy, HSTS, permissions-policy, and optional Cloudflare Turnstile on the contact form
- **🖼️ Image Optimization**: Optional wsrv.nl proxy/CDN integration for automatic resizing and format conversion
- **📱 Responsive Design**: Mobile-first layout built with Tailwind CSS v4 and vanilla JavaScript (no frontend framework)

## Tech Stack

- **Backend**: Django 6.0, Python 3.14+, managed with [uv](https://docs.astral.sh/uv/)
- **Frontend**: Tailwind CSS v4 (CLI-based build, no bundler), vanilla JavaScript
- **Content**: Individual Python files per blog post/project (see [Content Architecture](#content-architecture-individual-file-system))
- **Auth**: django-allauth (Google + GitHub OAuth) for the guestbook
- **APIs**: GitHub GraphQL API, WakaTime API
- **Security**: django-csp, django-permissions-policy, Cloudflare Turnstile
- **Database**: SQLite in development, PostgreSQL in production
- **Deployment**: Vercel (WSGI) with WhiteNoise for static files

## Project Structure

```text
FlexForge/          Django project settings, URLs, WSGI/ASGI, root views
apps/
  core/              Homepage, contact form, email, base views, image utils
  about/             Bio, experience, education, certifications, awards, skills
  projects/          Project showcase (data/projects/project-N.py, one file per project)
  blog/              Blog (data/blog/blog-N.py, one file per post)
  dashboard/         GitHub + WakaTime stats
  guestbook/         OAuth chat/guestbook (optional, toggled via GUESTBOOK_PAGE)
  openhire/          "Open to work" / "hiring" status page
  seo/               Meta tags, JSON-LD schema, sitemaps, robots.txt
static/              Tailwind source (input.css)
staticfiles/         Compiled CSS + all served static assets (images, fonts, icons)
templates/           Global templates (base, sidebar, error page, per-app sections)
```

## Content Architecture: Individual File System

Content is not stored in a database — it's Python dataclasses in individual files, so adding a blog post or project is just adding a file (no admin panel, no migrations):

```python
# apps/blog/data/blog/blog-21.py
from dataclasses import asdict
from apps.blog.types import BlogData

blog_data = asdict(BlogData(
    id=21,
    title="My New Post",
    description="...",
    author="Your Name",
    ...
))
```

Everything under a `data/` folder (`apps/blog/data/blog/`, `apps/projects/data/projects/`) is picked up automatically at request time by `apps/core/dynamic_loader.py` — just add the next-numbered file and it appears in the listing, no restart or migration needed.

## PageSpeed Insights

Scores for the reference deployment at [ridwaanhall.com](https://ridwaanhall.com):

[![Desktop: 99.5](https://img.shields.io/badge/Desktop-99.5-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/rstqtcxhc0?form_factor=desktop)
[![Mobile: 99](https://img.shields.io/badge/Mobile-99-success?style=for-the-badge)](https://pagespeed.web.dev/analysis/https-ridwaanhall-com/rstqtcxhc0?form_factor=mobile)

| Platform | Performance | Accessibility | Best Practices | SEO | Average |
|----------|-------------|---------------|----------------|-----|---------|
| **Desktop** | 98 | 100 | 100 | 100 | **99.5** |
| **Mobile** | 96 | 100 | 100 | 100 | **99** |
| **Average** | **97** | **100** | **100** | **100** | **99.25** |

## Quick Start

```bash
# Clone repository
git clone https://github.com/ridwaanhall/ridwaanhall-com.git
cd ridwaanhall-com

# Install uv (if you don't already have it)
pip install uv

# Create local virtual environment (.venv) with Python 3.14
uv venv --python 3.14

# Sync dependencies from pyproject.toml/uv.lock
uv sync

# Install Tailwind CSS
npm install tailwindcss @tailwindcss/cli

# Copy the environment template and fill in your own values (see below)
cp .env.example .env

# Build Tailwind CSS (for development with watch mode)
npx @tailwindcss/cli -i ./static/css/input.css -o ./staticfiles/css/global-wvbpenzt.css --watch

# In a separate terminal, run migrations and the dev server
uv run python manage.py migrate
uv run python manage.py runserver
```

## Tests & Linting

```bash
# Run the test suite (this is what CI runs)
uv run python manage.py test

# pytest-django is also configured, if you prefer it
uv run pytest

# Lint with ruff
uv run ruff check
```

### Tailwind CSS Development

For styling changes, ensure Tailwind CSS is running in watch mode:

```bash
# Development (with watch and minification)
npx @tailwindcss/cli -i ./static/css/input.css -o ./staticfiles/css/global-wvbpenzt.css --watch --minify

# Production build
npx @tailwindcss/cli -i ./static/css/input.css -o ./staticfiles/css/global-wvbpenzt.css --minify
```

Make sure your `static/css/input.css` contains:

```css
@import "tailwindcss";
```

> **Note:** the compiled filename (`global-wvbpenzt.css`) is hand-picked, not auto-hashed. If you rename it, update the `-o` path above **and** the `{% static %}` reference in both `templates/base_seo.html` and `templates/error.html`.

## Environment Configuration

Create a `.env` file (start from `.env.example`):

```env
# Core Settings
BASE_URL="https://your-domain.com"
SECRET_KEY="your-django-secret-key"
DEBUG=True
ALLOWED_HOSTS="localhost,127.0.0.1"

# Feature Toggles
GUESTBOOK_PAGE=True
WSRV_IMAGE_OPTIMIZATION=True
USE_CF_TURNSTILE=False

# API Keys
ACCESS_TOKEN="your-github-personal-access-token"
WAKATIME_API_KEY="your-wakatime-api-key"

# Email (required — used for contact form and guestbook notifications)
EMAIL_HOST_USER="your-email@gmail.com"
EMAIL_HOST_PASSWORD="your-app-password"
DEFAULT_FROM_EMAIL="noreply@your-domain.com"
CONTACT_EMAIL_RECIPIENT="your-email@domain.com"

# Google OAuth (required only when GUESTBOOK_PAGE=True)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth (required only when GUESTBOOK_PAGE=True)
GH_CLIENT_ID="your-github-client-id"
GH_CLIENT_SECRET="your-github-client-secret"

# Cloudflare Turnstile (required only when USE_CF_TURNSTILE=True)
CF_TURNSTILE_SITE_KEY="your-turnstile-site-key"
CF_TURNSTILE_SECRET_KEY="your-turnstile-secret-key"

# PostgreSQL Database (production only - SQLite is used automatically in development/tests)
POSTGRES_DATABASE="your-database"
POSTGRES_HOST="your-host"
POSTGRES_PASSWORD="your-password"
POSTGRES_USER="your-user"
POSTGRES_PORT="5432"

# Optional overrides
BLOG_BASE_IMG_URL="https://your-domain.com/static/img/blog"
PROJECT_BASE_IMG_URL="https://your-domain.com/static/img/project"
AUTHOR_IMG="https://your-domain.com/static/img/your-photo.webp"
```

| Variable | Required | Description |
|----------|----------|--------------|
| `BASE_URL` | Recommended | Your domain URL; defaults to `http://127.0.0.1:8000` in debug, `https://ridwaanhall.com` otherwise |
| `SECRET_KEY` | **Yes** | Django secret key — no default, app won't start without it |
| `ACCESS_TOKEN` | **Yes** | GitHub personal access token for the dashboard — no default, app won't start without it |
| `EMAIL_HOST_USER` | **Yes** | SMTP username — no default, app won't start without it |
| `EMAIL_HOST_PASSWORD` | **Yes** | SMTP password/app-password — no default, app won't start without it |
| `DEBUG` | No | Enable debug mode (default: `False`) |
| `ALLOWED_HOSTS` | Debug only | Comma-separated allowed hosts; **in production this is hardcoded** in `FlexForge/config.py` to `.vercel.app`/`.ridwaanhall.com` — change that list for your own domain |
| `WAKATIME_API_KEY` | No | WakaTime API key for coding stats (default: empty, dashboard section is hidden) |
| `GUESTBOOK_PAGE` | No | Enable/disable the guestbook app entirely (default: `True`) |
| `WSRV_IMAGE_OPTIMIZATION` | No | Enable the wsrv.nl image proxy (default: `True` in production, `False` in debug) |
| `USE_CF_TURNSTILE` | No | Require Cloudflare Turnstile on the contact form (default: `True`) |
| `CF_TURNSTILE_SITE_KEY` / `CF_TURNSTILE_SECRET_KEY` | If Turnstile enabled | Cloudflare Turnstile keys |
| `DEFAULT_FROM_EMAIL` | No | "From" address for outgoing mail (default: `EMAIL_HOST_USER`) |
| `CONTACT_EMAIL_RECIPIENT` | No | Comma-separated recipient(s) for contact/guestbook notifications (default: `hi@ridwaanhall.com`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | If guestbook enabled | Google OAuth credentials |
| `GH_CLIENT_ID` / `GH_CLIENT_SECRET` | If guestbook enabled | GitHub OAuth credentials |
| `POSTGRES_DATABASE`, `_HOST`, `_USER`, `_PASSWORD`, `_PORT` | Production only | PostgreSQL connection (SQLite is used automatically otherwise) |
| `BLOG_BASE_IMG_URL` / `PROJECT_BASE_IMG_URL` | No | Base URL for blog/project images (defaults to `{BASE_URL}/static/img/blog` or `/project`) |
| `AUTHOR_IMG` | No | Your profile photo URL, used as the default author image across blog posts (defaults to the author's own photo) |

Getting the API keys:

- **ACCESS_TOKEN**: GitHub → Settings → Developer settings → Personal access tokens (repo + user scopes)
- **WAKATIME_API_KEY**: [WakaTime](https://wakatime.com/) → Settings → API Key
- **GOOGLE_CLIENT_ID/SECRET** & **GH_CLIENT_ID/SECRET**: only needed if `GUESTBOOK_PAGE=True` — create OAuth apps in [Google Cloud Console](https://console.cloud.google.com/) and [GitHub OAuth Apps](https://github.com/settings/developers)
- **CF_TURNSTILE_SITE_KEY/SECRET_KEY**: only needed if `USE_CF_TURNSTILE=True` — create a widget in the [Cloudflare Turnstile dashboard](https://dash.cloudflare.com/?to=/:account/turnstile)

## Making It Your Own

This started as a personal site, but the architecture doesn't assume you're Ridwan Halim. To adopt it as your own portfolio:

1. **Your content** — rewrite the data files under `apps/*/data/`:
   - `apps/about/data/*.py` — bio, experience, education, certifications, awards, skills
   - `apps/blog/data/blog/blog-N.py` — one file per post (delete the samples, add your own, renumber if you like)
   - `apps/projects/data/projects/project-N.py` — one file per project
   - `apps/openhire/data/*.py` — your "open to work" / "hiring" status
2. **Your branding** — edit `apps/seo/config.py`: `SITE_NAME`, `AUTHOR`, `DEFAULT_TWITTER_SITE`, and `COMMON_KEYWORDS['personal']` are all hardcoded to the author's name/handle and need updating.
3. **Your domain** — two places hardcode `ridwaanhall.com`/`.vercel.app`:
   - `FlexForge/config.py`'s `ALLOWED_HOSTS` fallback (production-only; update to your own domain)
   - `FlexForge/settings.py`'s `CONTENT_SECURITY_POLICY` directives (`connect-src`, `font-src`, `script-src`, `style-src` all allowlist `ridwaanhall.com`)
4. **Your assets** — replace files under `staticfiles/favicon/`, `staticfiles/img/`, and `templates/site.webmanifest`.
5. **Your env vars** — see the [table above](#environment-configuration); at minimum you need `SECRET_KEY`, `ACCESS_TOKEN`, `EMAIL_HOST_USER`, and `EMAIL_HOST_PASSWORD` to start the app.
6. **Optional features** — turn off what you don't need: `GUESTBOOK_PAGE=False` skips the whole OAuth/chat system (no OAuth app setup needed), `USE_CF_TURNSTILE=False` skips Turnstile.

## Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?demo-description=Advanced%20developer%20portfolio%20platform%20with%20individual%20file%20data%20management%2C%20real-time%20API%20integrations%2C%20and%20enterprise-grade%20security.&demo-image=https%3A%2F%2Fridwaanhall.com%2Fstatic%2Fimg%2Fproject%2Fridwaanhall_com_2025070701.webp&demo-title=FlexForge%20Portfolio&demo-url=https%3A%2F%2Fridwaanhall.com&from=templates&project-name=FlexForge%20Portfolio&repository-name=flexforge-portfolio&repository-url=https%3A%2F%2Fgithub.com%2Fridwaanhall%2Fridwaanhall-com)

### Manual Setup

1. Fork this repository
2. Install Vercel CLI: `npm i -g vercel`
3. Deploy: `vercel --prod`
4. Configure environment variables in the Vercel dashboard
5. Update `ALLOWED_HOSTS` (in `FlexForge/config.py`) and the CSP directives (in `FlexForge/settings.py`) to match your own domain — see [Making It Your Own](#making-it-your-own)

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push branch: `git push origin feature/name`
5. Open pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding standards and commit message conventions.

## License

Apache License 2.0 - See [LICENSE](LICENSE) for details.

---

**FlexForge** - A Django portfolio platform, built to be forked.
