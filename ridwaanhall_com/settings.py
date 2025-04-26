from pathlib import Path
from decouple import config

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

# Add CSP settings (adjust 'self', script-src, style-src etc. based on your needs)
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = (
    "'self'",
    "static.cloudflareinsights.com",
    "cloud.umami.is",
    "*.googleapis.com",
)
CSP_STYLE_SRC = (
    "'self'",
    "*.googleapis.com",
    "*.gstatic.com",
)
CSP_IMG_SRC = (
    "'self'",
    "data:",
    "cdn.jsdelivr.net",
    "wsrv.nl",
    "*.googleapis.com",
    "*.gstatic.com",
)
CSP_FONT_SRC = (
    "'self'",
    "*.gstatic.com",
)
CSP_CONNECT_SRC = (
    "'self'",
    "*.googleapis.com",
)
CSP_FRAME_SRC = (
    "'self'",
    "*.google.com",
)
CSP_FRAME_ANCESTORS = ("'none'",)
CSP_OBJECT_SRC = ("'none'",)
CSP_BASE_URI = ("'self'",)
CSP_FORM_ACTION = ("'self'",)

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