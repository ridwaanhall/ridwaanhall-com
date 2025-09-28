"""
Development settings for FlexForge project.
Optimized for local development with debugging enabled.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
"""

from .base import *
from decouple import config, Csv
from csp.constants import SELF, NONE, UNSAFE_INLINE

# ------------------------------------------------------------------------------
# DEBUG SETTINGS
# ------------------------------------------------------------------------------

DEBUG = True

# ------------------------------------------------------------------------------
# URL CONFIGURATION
# ------------------------------------------------------------------------------

url_config = get_base_urls(debug=DEBUG)
BASE_URL = url_config['BASE_URL']
BLOG_BASE_IMG_URL = url_config['BLOG_BASE_IMG_URL']
PROJECT_BASE_IMG_URL = url_config['PROJECT_BASE_IMG_URL']
AUTHOR_IMG = url_config['AUTHOR_IMG']

# ------------------------------------------------------------------------------
# HOST CONFIGURATION
# ------------------------------------------------------------------------------

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='127.0.0.1,localhost', cast=Csv())

# ------------------------------------------------------------------------------
# APPLICATION CONFIGURATION
# ------------------------------------------------------------------------------

INSTALLED_APPS = get_installed_apps()
MIDDLEWARE = get_middleware()

# Feature toggles for development
WSRV_IMAGE_OPTIMIZATION = config('WSRV_IMAGE_OPTIMIZATION', default=False, cast=bool)

# ------------------------------------------------------------------------------
# DATABASE SETTINGS (SQLite for development)
# ------------------------------------------------------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ------------------------------------------------------------------------------
# SECURITY SETTINGS (Relaxed for development)
# ------------------------------------------------------------------------------

# HTTPS/TLS settings - disabled in development
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Cookie settings - relaxed in development
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'

# Session security settings (relaxed for development)
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_AGE = 86400  # 24 hours in development
SESSION_SAVE_EVERY_REQUEST = False

# ------------------------------------------------------------------------------
# CONTENT SECURITY POLICY (Relaxed for development)
# ------------------------------------------------------------------------------

CONTENT_SECURITY_POLICY = {
    'DEFAULT_SRC': [SELF],
    'DIRECTIVES': {
        'base-uri': [SELF],
        'connect-src': [
            SELF,
            'ridwaanhall.com',
            '*.googleapis.com',
            'https://api.web3forms.com',
            'api.web3forms.com',
        ],
        'default-src': [SELF],
        'font-src': [
            SELF,
            'ridwaanhall.com',
            '*.gstatic.com',
        ],
        'form-action': [
            SELF,
            'api.web3forms.com',
        ],
        'frame-ancestors': [NONE],
        'frame-src': [
            SELF,
            '*.google.com',
        ],
        'img-src': [
            SELF,
            'ridwaanhall.com',
            'data:',
            BLOG_BASE_IMG_URL,
            PROJECT_BASE_IMG_URL,
            'cdn.jsdelivr.net',
            'wsrv.nl',
            '*.googleapis.com',
            '*.gstatic.com',
            'lh3.googleusercontent.com',
            'avatars.githubusercontent.com',
        ],
        'object-src': [NONE],
        'script-src': [
            SELF,
            UNSAFE_INLINE,
            'ridwaanhall.com',
            'static.cloudflareinsights.com',
            '*.googleapis.com',
            'cdn.jsdelivr.net',
        ],
        'style-src': [
            SELF,
            UNSAFE_INLINE,
            'ridwaanhall.com',
            '*.googleapis.com',
            '*.gstatic.com',
            'cdn.jsdelivr.net',
        ],
        'upgrade-insecure-requests': False,  # Disabled in development
    },
    'REPORT_ONLY': True,  # Test mode in development
}

# Filter directives with None values
for directive, values in CONTENT_SECURITY_POLICY['DIRECTIVES'].items():
    if isinstance(values, list):
        CONTENT_SECURITY_POLICY['DIRECTIVES'][directive] = [v for v in values if v is not None]

# ------------------------------------------------------------------------------
# SOCIAL ACCOUNT PROVIDERS
# ------------------------------------------------------------------------------

SOCIALACCOUNT_PROVIDERS = get_socialaccount_providers()

# ------------------------------------------------------------------------------
# ALLAUTH SETTINGS
# ------------------------------------------------------------------------------

allauth_settings = configure_allauth_settings()
for key, value in allauth_settings.items():
    globals()[key] = value

# ------------------------------------------------------------------------------
# DEVELOPMENT-SPECIFIC SETTINGS
# ------------------------------------------------------------------------------

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Static files configuration for development
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Enable Django toolbar in development (optional)
# Uncomment the following lines if you want to use Django Debug Toolbar
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE
# INTERNAL_IPS = ['127.0.0.1']

# Logging configuration for development
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}