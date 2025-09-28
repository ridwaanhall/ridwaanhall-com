"""
Base Django settings for FlexForge project.
Contains common settings shared across all environments.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
"""

from pathlib import Path
from decouple import config, Csv
from csp.constants import SELF, NONE, UNSAFE_INLINE

# ------------------------------------------------------------------------------
# BASE SETTINGS
# ------------------------------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Core secret configuration
SECRET_KEY = config('SECRET_KEY')
ACCESS_TOKEN = config('ACCESS_TOKEN')
WAKATIME_API_KEY = config('WAKATIME_API_KEY')
WEB3FORM_PAC = config('WEB3FORM_PAC', default='')

# ------------------------------------------------------------------------------
# URL SETTINGS
# ------------------------------------------------------------------------------

def get_base_urls(debug=False):
    """Generate base URLs based on environment"""
    base_url = config('BASE_URL', default='http://127.0.0.1:8000' if debug else 'https://ridwaanhall.com')
    return {
        'BASE_URL': base_url,
        'BLOG_BASE_IMG_URL': config('BLOG_BASE_IMG_URL', default=f'{base_url}/static/img/blog'),
        'PROJECT_BASE_IMG_URL': config('PROJECT_BASE_IMG_URL', default=f'{base_url}/static/img/project'),
        'AUTHOR_IMG': config('AUTHOR_IMG', default=f'{base_url}/static/img/ridwaanhall_20250913_2.webp'),
    }

# ------------------------------------------------------------------------------
# FEATURE TOGGLES
# ------------------------------------------------------------------------------

GUESTBOOK_PAGE = config('GUESTBOOK_PAGE', default=True, cast=bool)

# ------------------------------------------------------------------------------
# APPLICATION SETTINGS
# ------------------------------------------------------------------------------

DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sitemaps',
]

THIRD_PARTY_APPS = [
    "whitenoise.runserver_nostatic",
    "csp",
]

LOCAL_APPS = [
    'apps.core',
    'apps.about',
    'apps.data',
    'apps.dashboard',
    'apps.projects',
    'apps.blog',
    'apps.openhire',
    'apps.seo',
]

# Guestbook related apps (conditional)
GUESTBOOK_APPS = [
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'allauth.socialaccount.providers.github',
    'apps.guestbook',
]

def get_installed_apps():
    """Generate INSTALLED_APPS based on feature flags"""
    apps = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS
    if GUESTBOOK_PAGE:
        apps.extend(GUESTBOOK_APPS)
    return apps

# ------------------------------------------------------------------------------
# MIDDLEWARE SETTINGS
# ------------------------------------------------------------------------------

BASE_MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'csp.middleware.CSPMiddleware',
    'django_permissions_policy.PermissionsPolicyMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

GUESTBOOK_MIDDLEWARE = [
    "allauth.account.middleware.AccountMiddleware",
]

def get_middleware():
    """Generate MIDDLEWARE based on feature flags"""
    middleware = BASE_MIDDLEWARE.copy()
    if GUESTBOOK_PAGE:
        middleware.extend(GUESTBOOK_MIDDLEWARE)
    return middleware

# ------------------------------------------------------------------------------
# TEMPLATES SETTINGS
# ------------------------------------------------------------------------------

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
                'FlexForge.context_processors.feature_flags',
                'FlexForge.context_processors.base_settings',
            ],
        },
    },
]

# ------------------------------------------------------------------------------
# URL CONFIGURATION
# ------------------------------------------------------------------------------

ROOT_URLCONF = 'FlexForge.urls'
WSGI_APPLICATION = 'FlexForge.wsgi.application'

# ------------------------------------------------------------------------------
# AUTHENTICATION AND PASSWORD SETTINGS
# ------------------------------------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'
    },
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

# URL handling settings
APPEND_SLASH = True

# ------------------------------------------------------------------------------
# SOCIAL ACCOUNT PROVIDERS (GUESTBOOK)
# ------------------------------------------------------------------------------

def get_socialaccount_providers():
    """Generate social account providers configuration"""
    if not GUESTBOOK_PAGE:
        return {}
    
    return {
        'google': {
            'APP': {
                'client_id': config('GOOGLE_CLIENT_ID', default=''),
                'secret': config('GOOGLE_CLIENT_SECRET', default=''),
            },
            'SCOPE': [
                'profile',
                'email',
            ],
            'AUTH_PARAMS': {
                'access_type': 'online',
            }
        },
        'github': {
            'APP': {
                'client_id': config('GH_CLIENT_ID', default=''),
                'secret': config('GH_CLIENT_SECRET', default=''),
            },
            'SCOPE': [
                'user:email',
            ],
        }
    }

# ------------------------------------------------------------------------------
# ALLAUTH SETTINGS (GUESTBOOK)
# ------------------------------------------------------------------------------

def configure_allauth_settings():
    """Configure allauth settings if guestbook is enabled"""
    if not GUESTBOOK_PAGE:
        return {
            'LOGIN_REDIRECT_URL': "home",
            'LOGOUT_REDIRECT_URL': "home",
            'ACCOUNT_LOGOUT_REDIRECT_URL': "home",
        }
    
    return {
        'SOCIALACCOUNT_LOGIN_ON_GET': True,
        'ACCOUNT_EMAIL_VERIFICATION': "none",
        'SOCIALACCOUNT_AUTO_SIGNUP': True,
        'SOCIALACCOUNT_EMAIL_REQUIRED': True,
        'LOGIN_REDIRECT_URL': "guestbook",
        'LOGOUT_REDIRECT_URL': "guestbook",
        'ACCOUNT_LOGOUT_REDIRECT_URL': "guestbook",
    }

# ------------------------------------------------------------------------------
# PERMISSIONS POLICY
# ------------------------------------------------------------------------------

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
}