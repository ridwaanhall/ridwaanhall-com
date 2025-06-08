"""
Django settings for ridwaanhall_com project.
Contains security configurations and environment-specific settings.
"""

from pathlib import Path
from decouple import config, Csv
from csp.constants import SELF, NONE, UNSAFE_INLINE

# ------------------------------------------------------------------------------
# BASE SETTINGS
# ------------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

# Environment and deployment settings
DEBUG = config('DEBUG', default=False, cast=bool)
SECRET_KEY = config('SECRET_KEY')
ACCESS_TOKEN = config('ACCESS_TOKEN')
WAKATIME_API_KEY = config('WAKATIME_API_KEY')

BASE_URL = config('BASE_URL', default='https://ridwaanhall.com')
BLOG_BASE_IMG_URL = config('BLOG_BASE_IMG_URL', default=f'{BASE_URL}/static/img/blog')
PROJECT_BASE_IMG_URL = config('PROJECT_BASE_IMG_URL', default=f'{BASE_URL}/static/img/project')

# Host configuration
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='', cast=Csv()) if DEBUG else [
    '.vercel.app',
    '.ridwaanhall.me',
    '.ridwaanhall.com',
]

# ------------------------------------------------------------------------------
# SECURITY SETTINGS
# ------------------------------------------------------------------------------

# HTTPS/TLS settings - only enable in production
SECURE_SSL_REDIRECT = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0  # 1 year in production only
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

# Cookie settings - only enforce in production
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# Security headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'

# Content Security Policy settings
CONTENT_SECURITY_POLICY = {
    'DEFAULT_SRC': [SELF],
    'DIRECTIVES': {
        'base-uri': [SELF],
        'connect-src': [
            SELF,
            'ridwaanhall.com',
            '*.googleapis.com',
            "cloud.umami.is",
        ],
        'default-src': [SELF],
        'font-src': [
            SELF,
            'ridwaanhall.com',
            '*.gstatic.com',
        ],
        'form-action': [SELF],
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
        ],
        'object-src': [NONE],
        'script-src': [
            SELF,
            'ridwaanhall.com',
            'static.cloudflareinsights.com',
            'cloud.umami.is',
            '*.googleapis.com',
            # Consider replacing UNSAFE_INLINE with nonces or hashes
            UNSAFE_INLINE,
            'cdn.jsdelivr.net',
        ],
        'style-src': [
            SELF,
            'ridwaanhall.com',
            '*.googleapis.com',
            '*.gstatic.com',
            # Consider replacing UNSAFE_INLINE with nonces or hashes
            UNSAFE_INLINE,
            'cdn.jsdelivr.net',
        ],
        'upgrade-insecure-requests': True,  # Enable in production only
    },
    # 'REPORT_ONLY': DEBUG,  # Test in development mode
    # 'REPORT_URI': '/csp-report/' if True else None,  # Report violations in production
}

# Filter directives with None values
for directive, values in CONTENT_SECURITY_POLICY['DIRECTIVES'].items():
    if isinstance(values, list):
        CONTENT_SECURITY_POLICY['DIRECTIVES'][directive] = [v for v in values if v is not None]

# Permissions Policy
PERMISSIONS_POLICY = {
    "accelerometer": [],
    "autoplay": [],
    "camera": [],
    "display-capture": [],
    "encrypted-media": [],
    "fullscreen": [],
    "geolocation": [],
    "gyroscope": [],
    "magnetometer": [],
    "microphone": [],
    "midi": [],
    "payment": [],
    "picture-in-picture": [],
    "publickey-credentials-get": [],
    "screen-wake-lock": [],
    "sync-xhr": [],
    "usb": [],
    "web-share": [],
    "xr-spatial-tracking": [],
}

# Session security settings
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 3600  # 1 hour in seconds
SESSION_SAVE_EVERY_REQUEST = True

# ------------------------------------------------------------------------------
# APPLICATION SETTINGS
# ------------------------------------------------------------------------------

INSTALLED_APPS = [
    "whitenoise.runserver_nostatic",
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',
    
    # Security apps
    "csp",
      # Project apps
    'apps.core',
    'apps.about',
    'apps.data',
    'apps.dashboard',
    'apps.projects',
    'apps.blog',
    'apps.pageindex',
    'apps.seo',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'ridwaanhall_com.middleware.SecurityHeadersMiddleware',
    'ridwaanhall_com.middleware.PerformanceMiddleware',
    'csp.middleware.CSPMiddleware',
    'django_permissions_policy.PermissionsPolicyMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'ridwaanhall_com.middleware.ErrorHandlingMiddleware',
]

ROOT_URLCONF = 'ridwaanhall_com.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            BASE_DIR / 'templates',
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ridwaanhall_com.wsgi.application'

# ------------------------------------------------------------------------------
# DATABASE SETTINGS
# ------------------------------------------------------------------------------

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# ------------------------------------------------------------------------------
# AUTHENTICATION AND PASSWORD SETTINGS
# ------------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Password hashers - using Argon2 as the primary hasher
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.Argon2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
]

# ------------------------------------------------------------------------------
# INTERNATIONALIZATION SETTINGS
# ------------------------------------------------------------------------------

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Jakarta'
USE_I18N = True
USE_TZ = True

# ------------------------------------------------------------------------------
# STATIC FILES SETTINGS
# ------------------------------------------------------------------------------

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ------------------------------------------------------------------------------
# DEFAULT SETTINGS
# ------------------------------------------------------------------------------

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ------------------------------------------------------------------------------
# ERROR HANDLING SETTINGS
# ------------------------------------------------------------------------------

# Custom error handlers - enabled for both debug and production
handler400 = 'ridwaanhall_com.error_handlers.handler400'
handler403 = 'ridwaanhall_com.error_handlers.handler403'
handler404 = 'ridwaanhall_com.error_handlers.handler404'
handler500 = 'ridwaanhall_com.error_handlers.handler500'

# Logging configuration for Vercel compatibility (console only, no file logging)
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
            'level': 'DEBUG' if DEBUG else 'WARNING',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose' if DEBUG else 'simple',
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
        'ridwaanhall_com.error_handlers': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
    },
}