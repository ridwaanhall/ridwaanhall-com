"""
Production settings for FlexForge project.
Optimized for deployment with maximum security and performance.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
"""

from .base import *
from decouple import config, Csv
from csp.constants import SELF, NONE, UNSAFE_INLINE

# ------------------------------------------------------------------------------
# DEBUG SETTINGS
# ------------------------------------------------------------------------------

DEBUG = False

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

ALLOWED_HOSTS = [
    '.vercel.app',
    '.ridwaanhall.me',
    '.ridwaanhall.com',
]

# ------------------------------------------------------------------------------
# APPLICATION CONFIGURATION
# ------------------------------------------------------------------------------

INSTALLED_APPS = get_installed_apps()
MIDDLEWARE = get_middleware()

# Feature toggles for production
WSRV_IMAGE_OPTIMIZATION = config('WSRV_IMAGE_OPTIMIZATION', default=True, cast=bool)

# ------------------------------------------------------------------------------
# DATABASE SETTINGS (PostgreSQL for production)
# ------------------------------------------------------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DATABASE', default='ridwaanhall_db'),
        'USER': config('POSTGRES_USER', default='postgres'),
        'PASSWORD': config('POSTGRES_PASSWORD'),
        'HOST': config('POSTGRES_HOST', default='localhost'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'OPTIONS': {
            'sslmode': 'require',
        },
        'CONN_MAX_AGE': 600,  # Connection pooling
    }
}

# ------------------------------------------------------------------------------
# SECURITY SETTINGS (Maximum security for production)
# ------------------------------------------------------------------------------

# HTTPS/TLS settings - enforced in production
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Cookie settings - enforced in production
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'

# Session security settings
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 3600  # 1 hour in production
SESSION_SAVE_EVERY_REQUEST = True

# ------------------------------------------------------------------------------
# CONTENT SECURITY POLICY (Strict for production)
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
        'upgrade-insecure-requests': True,  # Enforced in production
    },
    'REPORT_ONLY': False,  # Enforced in production
    'REPORT_URI': '/csp-report/',  # Report violations in production
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
# PRODUCTION-SPECIFIC SETTINGS
# ------------------------------------------------------------------------------

# Email backend for production
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@ridwaanhall.com')

# Cache configuration for production (Redis recommended)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'flexforge',
        'TIMEOUT': 300,
    }
}

# Session backend using cache
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# Logging configuration for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 1024*1024*5,  # 5 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.security': {
            'handlers': ['console', 'file'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
import os
logs_dir = BASE_DIR / 'logs'
if not logs_dir.exists():
    logs_dir.mkdir(exist_ok=True)

# Performance optimizations
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Security middleware order optimization
MIDDLEWARE = [
    'django.middleware.cache.UpdateCacheMiddleware',
] + MIDDLEWARE + [
    'django.middleware.cache.FetchFromCacheMiddleware',
]

# Cache timeout
CACHE_MIDDLEWARE_ALIAS = 'default'
CACHE_MIDDLEWARE_SECONDS = 600  # 10 minutes
CACHE_MIDDLEWARE_KEY_PREFIX = 'flexforge'