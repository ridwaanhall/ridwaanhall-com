"""
Django 5.2.x settings for FlexForge project.
Contains security configurations and environment-specific settings.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
Created at: March 16, 2025
"""

import sys
from pathlib import Path
from urllib.parse import urlparse

import dj_database_url
from csp.constants import NONE, SELF, UNSAFE_INLINE

from .config import *  # Import all environment configs

# --------------------------------------------------------------------------
# BASE SETTINGS
# --------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

SUPABASE_STORAGE_HOST = urlparse(SUPABASE_URL).netloc if SUPABASE_URL else None

# --------------------------------------------------------------------------
# EMAIL SETTINGS
# --------------------------------------------------------------------------
EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.gmail.com"
EMAIL_PORT = 587
EMAIL_USE_TLS = True
SERVER_EMAIL = DEFAULT_FROM_EMAIL

# --------------------------------------------------------------------------
# SECURITY SETTINGS
# --------------------------------------------------------------------------
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"

SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

# Content Security Policy
CONTENT_SECURITY_POLICY = {
    "DEFAULT_SRC": [
        SELF
    ],
    "DIRECTIVES": {
        "base-uri": [
            SELF
        ],
        "connect-src": [
            SELF,
            "ridwaanhall.com",
            "*.googleapis.com",
            "https://challenges.cloudflare.com",
            "challenges.cloudflare.com",
        ],
        "default-src": [
            SELF
        ],
        "font-src": [
            SELF,
            "ridwaanhall.com",
            "*.gstatic.com"
        ],
        "form-action": [
            SELF
        ],
        "frame-ancestors": [
            NONE
        ],
        "frame-src": [
            SELF,
            "*.google.com",
            "https://challenges.cloudflare.com",
            "challenges.cloudflare.com"
        ],
        "img-src": [
            SELF,
            "ridwaanhall.com",
            "data:",
            SUPABASE_STORAGE_HOST,
            "cdn.jsdelivr.net",
            "wsrv.nl",
            "*.googleapis.com",
            "*.gstatic.com",
            "lh3.googleusercontent.com",
            "avatars.githubusercontent.com",
        ],
        "object-src": [
            NONE
        ],
        "script-src": [
            SELF,
            UNSAFE_INLINE,
            "ridwaanhall.com",
            "static.cloudflareinsights.com",
            "*.googleapis.com",
            "cdn.jsdelivr.net",
            "https://challenges.cloudflare.com",
            "challenges.cloudflare.com",
        ],
        "style-src": [
            SELF,
            UNSAFE_INLINE,
            "ridwaanhall.com",
            "*.googleapis.com",
            "*.gstatic.com",
            "cdn.jsdelivr.net"
        ],
        "upgrade-insecure-requests": True,
    },
}

for directive, values in CONTENT_SECURITY_POLICY["DIRECTIVES"].items():
    if isinstance(values, list):
        CONTENT_SECURITY_POLICY["DIRECTIVES"][directive] = [v for v in values if v is not None]

PERMISSIONS_POLICY = {k: [] for k in [
    "accelerometer",
    "autoplay",
    "camera",
    "display-capture",
    "encrypted-media",
    "fullscreen",
    "geolocation",
    "gyroscope",
    "magnetometer",
    "microphone",
    "midi",
    "payment",
    "picture-in-picture",
    "publickey-credentials-get",
    "screen-wake-lock",
    "sync-xhr",
    "usb",
    "web-share"
]}

SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 3600
SESSION_SAVE_EVERY_REQUEST = True
APPEND_SLASH = True

# --------------------------------------------------------------------------
# APPLICATION SETTINGS
# --------------------------------------------------------------------------
INSTALLED_APPS = [
    "whitenoise.runserver_nostatic",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.sitemaps",

    "csp",

    "apps.core",
    "apps.about",
    "apps.dashboard",
    "apps.projects",
    "apps.blog",
    "apps.openhire",
    "apps.seo",
]

if GUESTBOOK_PAGE:
    INSTALLED_APPS.extend([
        "allauth",
        "allauth.account",
        "allauth.socialaccount",
        "allauth.socialaccount.providers.google",
        "allauth.socialaccount.providers.github",
        "apps.guestbook",
    ])

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "csp.middleware.CSPMiddleware",
    "django_permissions_policy.PermissionsPolicyMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

if GUESTBOOK_PAGE:
    MIDDLEWARE.append("allauth.account.middleware.AccountMiddleware")

if GUESTBOOK_PAGE:
    SOCIALACCOUNT_PROVIDERS = {
        "google": {
            "APP": {
                "client_id": GOOGLE_CLIENT_ID,
                "secret": GOOGLE_CLIENT_SECRET
            },
            "SCOPE": [
                "profile","email"
            ],
            "AUTH_PARAMS": {
                "access_type": "online"
            }
        },
        "github": {
            "APP": {
                "client_id": GH_CLIENT_ID,
                "secret": GH_CLIENT_SECRET
            },
            "SCOPE": [
                "user:email"
            ],
        }
    }

ROOT_URLCONF = "FlexForge.urls"

TEMPLATES = [{
    "BACKEND": "django.template.backends.django.DjangoTemplates",
    "DIRS": [
        BASE_DIR / "templates"
    ],
    "APP_DIRS": True,
    "OPTIONS": {
        "context_processors": [
            "django.template.context_processors.debug",
            "django.template.context_processors.request",
            "django.contrib.auth.context_processors.auth",
            "django.contrib.messages.context_processors.messages",
            "FlexForge.context_processors.feature_flags",
            "FlexForge.context_processors.base_settings",
        ],
    },
}]

WSGI_APPLICATION = "FlexForge.wsgi.application"

# --------------------------------------------------------------------------
# DATABASE SETTINGS
# --------------------------------------------------------------------------

TESTING = "test" in sys.argv

if TESTING or DEBUG:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    # Supabase Postgres in production, via the pooled (pgbouncer transaction-mode)
    # connection -- required under Vercel's serverless model, since direct
    # per-invocation connections would quickly exhaust Postgres's max_connections.
    # Opening a connection to Supabase costs ~190ms (TCP + TLS + auth), which
    # with conn_max_age=0 was paid on *every* request -- more than all of a
    # typical page's queries combined. Keeping it open lets a warm Vercel
    # instance reuse it across requests. This is safe (and intended) against
    # the transaction-mode pooler: a client connection to pgbouncer is cheap,
    # since it only claims a real server connection for the duration of a
    # transaction. CONN_HEALTH_CHECKS stops a socket that died between
    # requests from surfacing as a failed page.
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=config("DB_CONN_MAX_AGE", default=600, cast=int),
            conn_health_checks=True,
            ssl_require=True,
        )
    }
    # Supabase/Vercel's connection string includes a non-standard `supa=...`
    # query param (integration tagging, not a real libpq option) that
    # dj_database_url dutifully passes through as a connection OPTIONS entry
    # -- psycopg2 then rejects it with "invalid connection option". Only keep
    # the option we actually need.
    DATABASES["default"]["OPTIONS"] = {"sslmode": "require"}
    # Named/server-side cursors don't work correctly under pgbouncer transaction-mode
    # pooling -- this is Django's documented fix, and it's a key inside DATABASES,
    # not a top-level setting.
    DATABASES["default"]["DISABLE_SERVER_SIDE_CURSORS"] = True

# --------------------------------------------------------------------------
# CACHING
# --------------------------------------------------------------------------
# Built content payloads are held in each process's own memory, so a hit costs
# no network and no Supabase quota. Cross-instance correctness does not come
# from the backend -- it comes from the shared version stamps in
# apps.core.models.ContentVersion, which cache keys embed. See apps/core/cache.py.
#
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "flexforge-content",
        "TIMEOUT": 900,
        "OPTIONS": {"MAX_ENTRIES": 1000},
    }
}

# How long a version stamp is trusted before being re-read. This is the only
# staleness window: it bounds how long an instance that didn't handle an edit
# can keep serving the previous content.
CONTENT_CACHE_VERSION_TTL = config("CONTENT_CACHE_VERSION_TTL", default=5, cast=int)
# Expiry floor for built payloads, covering writes that bypass signals
# (QuerySet.update(), bulk_create) -- the blog view's view-counter increment
# is one such write.
CONTENT_CACHE_TTL = config("CONTENT_CACHE_TTL", default=900, cast=int)
# Off under `manage.py test`, so the suite keeps observing writes the instant
# they happen and its assertNumQueries counts stay meaningful. Disabling short-
# circuits get_or_build before it even reads the version stamps, so no query is
# added either. apps/core/tests/test_content_cache.py turns it back on to
# exercise the caching itself.
CONTENT_CACHE_ENABLED = (
    False if TESTING else config("CONTENT_CACHE_ENABLED", default=True, cast=bool)
)

# --------------------------------------------------------------------------
# AUTHENTICATION AND PASSWORD VALIDATION
# --------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"
    },
]

# --------------------------------------------------------------------------
# INTERNATIONALIZATION
# --------------------------------------------------------------------------
LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Jakarta"
USE_I18N = True
USE_TZ = True

# --------------------------------------------------------------------------
# STATIC FILES
# --------------------------------------------------------------------------
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# --------------------------------------------------------------------------
# MEDIA / STORAGES
#
# Local dev/tests use Django's plain local filesystem storage (MEDIA_ROOT
# below, gitignored) so uploading/viewing images works fully offline and
# never touches the shared production Supabase bucket. Production uses the
# custom Supabase Storage backend (apps/core/storage.py's SupabaseStorage).
#
# Defining STORAGES fully replaces Django's default config (it does not
# merge with STATICFILES_STORAGE), so "staticfiles" must be re-declared here
# alongside "default" or WhiteNoise's static serving silently reverts to
# Django's default.
#
# Deliberately NOT using CompressedManifestStaticFilesStorage for
# staticfiles: this repo has no `collectstatic` step in its deploy pipeline
# (see CLAUDE.md) and its pre-built assets (favicon/, img/, svg/, font/, the
# compiled CSS) live directly under STATIC_ROOT rather than any
# STATICFILES_DIRS source collectstatic could discover -- so a manifest can
# never be generated for them, and ManifestStaticFilesStorage's strict
# lookup 500s on every {% static %} tag referencing one (e.g.
# base_seo.html's favicon links). The project already hand-picks
# cache-busted filenames itself (see the hardcoded compiled CSS filename
# gotcha in CLAUDE.md), so manifest-based hashing isn't actually needed --
# just compression.
# --------------------------------------------------------------------------
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

if "test" in sys.argv or DEBUG:
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
    }
else:
    STORAGES = {
        "default": {"BACKEND": "apps.core.storage.SupabaseStorage"},
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
    }

# --------------------------------------------------------------------------
# DEFAULT SETTINGS
# --------------------------------------------------------------------------
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --------------------------------------------------------------------------
# ALLAUTH SETTINGS (only if Guestbook is enabled)
# --------------------------------------------------------------------------
if GUESTBOOK_PAGE:
    SOCIALACCOUNT_LOGIN_ON_GET = True
    ACCOUNT_EMAIL_VERIFICATION = "none"
    SOCIALACCOUNT_AUTO_SIGNUP = True
    SOCIALACCOUNT_EMAIL_REQUIRED = True

    # Redirects for login/logout flows
    LOGIN_REDIRECT_URL = "guestbook"
    LOGOUT_REDIRECT_URL = "guestbook"
    ACCOUNT_LOGOUT_REDIRECT_URL = "guestbook"
else:
    LOGIN_REDIRECT_URL = "home"
    LOGOUT_REDIRECT_URL = "home"
    ACCOUNT_LOGOUT_REDIRECT_URL = "home"
