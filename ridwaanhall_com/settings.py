from pathlib import Path
from decouple import config
from csp.constants import SELF, NONE, UNSAFE_INLINE # Import CSP constants

BASE_DIR = Path(__file__).resolve().parent.parent


SECRET_KEY = config('SECRET_KEY')
ACCESS_TOKEN = config('ACCESS_TOKEN')
WAKATIME_API_KEY = config('WAKATIME_API_KEY')

BASE_URL = config('BASE_URL', default='https://ridwaanhall.com')

BLOG_BASE_IMG_URL = config('BLOG_BASE_IMG_URL', default='https://ridwaanhall.com/static/img/blog')
PROJECT_BASE_IMG_URL = config('PROJECT_BASE_IMG_URL', default='https://ridwaanhall.com/static/img/project')

DEBUG = config('DEBUG', default=False, cast=bool)

if DEBUG:
    ALLOWED_HOSTS = []
else:
    ALLOWED_HOSTS = [
        '.vercel.app',
        '.ridwaanhall.me',
        '.ridwaanhall.com',
    ]

SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin' # Add this line

INSTALLED_APPS = [
    "whitenoise.runserver_nostatic",
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    "csp",
    
    'apps.core',
    'apps.career',
    'apps.data',
    'apps.dashboard',
    'apps.projects',
    'apps.blog',
    'apps.pageindex',
    
    'django.contrib.sitemaps',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",
    'csp.middleware.CSPMiddleware', # Add this line for Content-Security-Policy
    'django_permissions_policy.PermissionsPolicyMiddleware', # Add this line for Permissions-Policy
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
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


DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'Asia/Jakarta'

USE_I18N = True

USE_TZ = True


STATIC_URL = 'static/'

STATIC_ROOT = BASE_DIR / 'staticfiles'

CONTENT_SECURITY_POLICY = {
    'DIRECTIVES': {
        'base-uri': (SELF,), # Use SELF constant
        'connect-src': (SELF, '*.googleapis.com', "cloud.umami.is"), # Use SELF constant
        'default-src': (SELF,), # Use SELF constant
        'font-src': (SELF, '*.gstatic.com'), # Use SELF constant
        'form-action': (SELF,), # Use SELF constant
        'frame-ancestors': (NONE,), # Use NONE constant
        'frame-src': (SELF, '*.google.com'), # Use SELF constant
        'img-src': (
            SELF, # Use SELF constant
            'data:',
            BLOG_BASE_IMG_URL,
            PROJECT_BASE_IMG_URL,
            'cdn.jsdelivr.net',
            'wsrv.nl',
            '*.googleapis.com',
            '*.gstatic.com',
        ),
        'object-src': (NONE,), # Use NONE constant
        'script-src': (
            SELF, # Use SELF constant
            UNSAFE_INLINE, # Add back using constant if absolutely necessary
            'static.cloudflareinsights.com',
            'cloud.umami.is',
            '*.googleapis.com',
        ),
        'style-src': (
            SELF, # Use SELF constant
            UNSAFE_INLINE, # Add back using constant if absolutely necessary
            '*.googleapis.com',
            '*.gstatic.com',
        ),
        # Consider adding for better security if site is fully HTTPS
        # 'upgrade-insecure-requests': True,
    }
    # Optional: Add REPORT_ONLY = True to test without enforcing
    # 'REPORT_ONLY': DEBUG,
    # Optional: Add REPORT_URI to send violation reports
    # 'REPORT_URI': '/csp-report/', # Example endpoint
}


PERMISSIONS_POLICY = {
    "accelerometer": [],
    "ambient-light-sensor": [],
    "autoplay": [],
    "camera": [],
    "display-capture": [],
    "document-domain": [],
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


DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'