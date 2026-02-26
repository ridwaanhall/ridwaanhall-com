"""
Django 5.2.x settings for FlexForge project.
Contains security configurations and environment-specific settings.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
Created at: March 16, 2025
"""

from pathlib import Path
from csp.constants import SELF, NONE, UNSAFE_INLINE
from .config import *  # Import all environment configs

# --------------------------------------------------------------------------
# BASE SETTINGS
# --------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

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
            BLOG_BASE_IMG_URL,
            PROJECT_BASE_IMG_URL,
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
if DEBUG:
    # Use SQLite for local development
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    # Use PostgreSQL in production
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": POSTGRES_DATABASE,
            "USER": POSTGRES_USER,
            "PASSWORD": POSTGRES_PASSWORD,
            "HOST": POSTGRES_HOST,
            "PORT": POSTGRES_PORT,
        }
    }

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
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

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
