"""
Testing settings for FlexForge project.
Optimized for running automated tests with maximum speed and isolation.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
"""

from .base import *
from decouple import config
import tempfile

# ------------------------------------------------------------------------------
# DEBUG SETTINGS
# ------------------------------------------------------------------------------

DEBUG = False  # Always False for testing to catch production-like issues

# ------------------------------------------------------------------------------
# URL CONFIGURATION
# ------------------------------------------------------------------------------

url_config = get_base_urls(debug=True)  # Use localhost URLs for testing
BASE_URL = url_config['BASE_URL']
BLOG_BASE_IMG_URL = url_config['BLOG_BASE_IMG_URL']
PROJECT_BASE_IMG_URL = url_config['PROJECT_BASE_IMG_URL']
AUTHOR_IMG = url_config['AUTHOR_IMG']

# ------------------------------------------------------------------------------
# HOST CONFIGURATION
# ------------------------------------------------------------------------------

ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'testserver']

# ------------------------------------------------------------------------------
# APPLICATION CONFIGURATION
# ------------------------------------------------------------------------------

INSTALLED_APPS = get_installed_apps()
MIDDLEWARE = get_middleware()

# Disable image optimization for faster tests
WSRV_IMAGE_OPTIMIZATION = False

# ------------------------------------------------------------------------------
# DATABASE SETTINGS (In-memory SQLite for speed)
# ------------------------------------------------------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # In-memory database for speed
        'OPTIONS': {
            'timeout': 20,
        }
    }
}

# ------------------------------------------------------------------------------
# SECURITY SETTINGS (Minimal for testing)
# ------------------------------------------------------------------------------

# Disable HTTPS requirements for testing
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Cookie settings - minimal for testing
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

# Session settings - minimal for testing
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_AGE = 86400  # 24 hours
SESSION_SAVE_EVERY_REQUEST = False

# ------------------------------------------------------------------------------
# CONTENT SECURITY POLICY (Disabled for testing)
# ------------------------------------------------------------------------------

# Disable CSP for testing to avoid conflicts with test tools
CONTENT_SECURITY_POLICY = None

# ------------------------------------------------------------------------------
# CACHE CONFIGURATION (Dummy cache for testing)
# ------------------------------------------------------------------------------

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Use database session backend for testing
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# ------------------------------------------------------------------------------
# EMAIL CONFIGURATION (Locmem for testing)
# ------------------------------------------------------------------------------

EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# ------------------------------------------------------------------------------
# MEDIA FILES (Temporary directory for testing)
# ------------------------------------------------------------------------------

MEDIA_ROOT = tempfile.mkdtemp()
MEDIA_URL = '/media/'

# ------------------------------------------------------------------------------
# STATIC FILES (Minimal configuration for testing)
# ------------------------------------------------------------------------------

STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# ------------------------------------------------------------------------------
# LOGGING CONFIGURATION (Minimal for testing)
# ------------------------------------------------------------------------------

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
        'level': 'WARNING',  # Only show warnings and errors during testing
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console'],
            'level': 'ERROR',  # Only show request errors
            'propagate': False,
        },
    },
}

# ------------------------------------------------------------------------------
# SOCIAL ACCOUNT PROVIDERS (Test configuration)
# ------------------------------------------------------------------------------

# Use test credentials for social auth
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': 'test-google-client-id',
            'secret': 'test-google-secret',
        },
        'SCOPE': ['profile', 'email'],
    },
    'github': {
        'APP': {
            'client_id': 'test-github-client-id',
            'secret': 'test-github-secret',
        },
        'SCOPE': ['user:email'],
    }
} if GUESTBOOK_PAGE else {}

# ------------------------------------------------------------------------------
# ALLAUTH SETTINGS (Testing configuration)
# ------------------------------------------------------------------------------

allauth_settings = configure_allauth_settings()
for key, value in allauth_settings.items():
    globals()[key] = value

# Additional testing-specific allauth settings
if GUESTBOOK_PAGE:
    SOCIALACCOUNT_AUTO_SIGNUP = True
    ACCOUNT_EMAIL_VERIFICATION = 'none'
    SOCIALACCOUNT_EMAIL_REQUIRED = False

# ------------------------------------------------------------------------------
# TESTING-SPECIFIC SETTINGS
# ------------------------------------------------------------------------------

# Password hashers - use fast hasher for testing
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',  # Fast but insecure - only for testing
]

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

# Uncomment to disable migrations (speeds up tests but may cause issues)
# MIGRATION_MODULES = DisableMigrations()

# Test database creation settings
TEST_RUNNER = 'django.test.runner.DiscoverRunner'

# Disable whitenoise for testing
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True

# API rate limiting disabled for testing
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [],
    'DEFAULT_THROTTLE_RATES': {}
}

# Test data settings
ALLOW_TEST_DATA_CREATION = True

# Feature flags for testing
TESTING_MODE = True

# Celery settings for testing (if using Celery)
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Performance settings for testing
DATABASES['default']['OPTIONS'] = {
    'timeout': 20,
    'check_same_thread': False,
}