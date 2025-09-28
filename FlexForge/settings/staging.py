"""
Staging settings for FlexForge project.
Similar to production but with some debugging features enabled for testing.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
"""

from .production import *
from decouple import config, Csv

# ------------------------------------------------------------------------------
# DEBUG SETTINGS (Limited debugging in staging)
# ------------------------------------------------------------------------------

DEBUG = config('DEBUG', default=False, cast=bool)

# ------------------------------------------------------------------------------
# HOST CONFIGURATION
# ------------------------------------------------------------------------------

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='', cast=Csv()) or [
    '.vercel.app',
    '.ridwaanhall.me',
    '.ridwaanhall.com',
    'staging.ridwaanhall.com',
    'test.ridwaanhall.com',
]

# ------------------------------------------------------------------------------
# DATABASE SETTINGS
# ------------------------------------------------------------------------------

# Use staging database or fallback to SQLite for testing
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.postgresql'),
        'NAME': config('POSTGRES_DATABASE', default='ridwaanhall_staging_db'),
        'USER': config('POSTGRES_USER', default='postgres'),
        'PASSWORD': config('POSTGRES_PASSWORD', default=''),
        'HOST': config('POSTGRES_HOST', default='localhost'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'OPTIONS': {
            'sslmode': config('DB_SSLMODE', default='prefer'),
        },
        'CONN_MAX_AGE': 300,  # Shorter connection pooling for staging
    }
}

# Fallback to SQLite if PostgreSQL is not configured
if not config('POSTGRES_PASSWORD', default=''):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db_staging.sqlite3',
        }
    }

# ------------------------------------------------------------------------------
# SECURITY SETTINGS (Slightly relaxed for staging testing)
# ------------------------------------------------------------------------------

# HTTPS settings - can be disabled for staging testing
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=3600, cast=int)  # 1 hour for staging

# Session settings - slightly relaxed for testing
SESSION_COOKIE_AGE = config('SESSION_COOKIE_AGE', default=7200, cast=int)  # 2 hours in staging

# ------------------------------------------------------------------------------
# CONTENT SECURITY POLICY (Slightly relaxed for staging)
# ------------------------------------------------------------------------------

# Allow additional testing domains in CSP
CONTENT_SECURITY_POLICY['DIRECTIVES']['connect-src'].extend([
    'staging.ridwaanhall.com',
    'test.ridwaanhall.com',
])

CONTENT_SECURITY_POLICY['DIRECTIVES']['img-src'].extend([
    'staging.ridwaanhall.com',
    'test.ridwaanhall.com',
])

# Enable CSP reporting in staging
CONTENT_SECURITY_POLICY['REPORT_ONLY'] = config('CSP_REPORT_ONLY', default=False, cast=bool)

# ------------------------------------------------------------------------------
# CACHE CONFIGURATION (Reduced for staging)
# ------------------------------------------------------------------------------

# Use simpler cache backend for staging
CACHES = {
    'default': {
        'BACKEND': config('CACHE_BACKEND', default='django.core.cache.backends.locmem.LocMemCache'),
        'LOCATION': config('CACHE_LOCATION', default='staging-cache'),
        'TIMEOUT': config('CACHE_TIMEOUT', default=300, cast=int),
        'OPTIONS': {
            'MAX_ENTRIES': 1000,
        }
    }
}

# Use database session backend in staging
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# ------------------------------------------------------------------------------
# EMAIL CONFIGURATION (Test email settings)
# ------------------------------------------------------------------------------

# Use console backend or test email service
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')

if EMAIL_BACKEND == 'django.core.mail.backends.smtp.EmailBackend':
    EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
    EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
    EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
    DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='staging@ridwaanhall.com')

# ------------------------------------------------------------------------------
# LOGGING CONFIGURATION (Enhanced for staging testing)
# ------------------------------------------------------------------------------

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
            'formatter': 'verbose' if DEBUG else 'simple',
        },
        'file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'staging.log',
            'maxBytes': 1024*1024*10,  # 10 MB for staging
            'backupCount': 3,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'DEBUG' if DEBUG else 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'WARNING',
            'propagate': False,
        },
        'apps': {  # Log all app activities in staging
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# ------------------------------------------------------------------------------
# STAGING-SPECIFIC FEATURES
# ------------------------------------------------------------------------------

# Enable additional debugging tools in staging if DEBUG is True
if DEBUG:
    # Add debug toolbar if available
    try:
        import debug_toolbar
        INSTALLED_APPS += ['debug_toolbar']
        MIDDLEWARE = ['debug_toolbar.middleware.DebugToolbarMiddleware'] + MIDDLEWARE
        INTERNAL_IPS = ['127.0.0.1', '::1']
        
        DEBUG_TOOLBAR_CONFIG = {
            'SHOW_TOOLBAR_CALLBACK': lambda request: True,
        }
    except ImportError:
        pass

# Performance monitoring in staging
PERFORMANCE_MONITORING = config('PERFORMANCE_MONITORING', default=True, cast=bool)

# Test data settings
ALLOW_TEST_DATA_CREATION = config('ALLOW_TEST_DATA_CREATION', default=True, cast=bool)

# Cache timeout - shorter for staging testing
CACHE_MIDDLEWARE_SECONDS = 300  # 5 minutes