"""
Configuration settings for FlexForge project.
Handles environment variables, constants, and secrets.

Extracted from settings.py
"""

from pathlib import Path
from decouple import config, Csv

# ------------------------------------------------------------------------------
# DIRECTORIES
# ------------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent

# ------------------------------------------------------------------------------
# ENVIRONMENT & KEYS
# ------------------------------------------------------------------------------
DEBUG = config('DEBUG', default=False, cast=bool)
SECRET_KEY = config('SECRET_KEY')
ACCESS_TOKEN = config('ACCESS_TOKEN')
WAKATIME_API_KEY = config('WAKATIME_API_KEY')

# ------------------------------------------------------------------------------
# CLOUDFLARE TURNSTILE
# ------------------------------------------------------------------------------
USE_CF_TURNSTILE = config('USE_CF_TURNSTILE', default=True, cast=bool)
CF_TURNSTILE_SITE_KEY = config('CF_TURNSTILE_SITE_KEY', default='')
CF_TURNSTILE_SECRET_KEY = config('CF_TURNSTILE_SECRET_KEY', default='')

# ------------------------------------------------------------------------------
# URLS & ASSETS
# ------------------------------------------------------------------------------
BASE_URL = config('BASE_URL', default='http://127.0.0.1:8000' if DEBUG else 'https://ridwaanhall.com')
BLOG_BASE_IMG_URL = config('BLOG_BASE_IMG_URL', default=f'{BASE_URL}/static/img/blog')
PROJECT_BASE_IMG_URL = config('PROJECT_BASE_IMG_URL', default=f'{BASE_URL}/static/img/project')
AUTHOR_IMG = config('AUTHOR_IMG', default=f'{BASE_URL}/static/img/ridwaanhall_20250913_2.webp')

# ------------------------------------------------------------------------------
# HOST CONFIGURATION
# ------------------------------------------------------------------------------
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='', cast=Csv()) if DEBUG else [
    '.vercel.app',
    '.ridwaanhall.com',
    '.ridwaanhall.me',
]

# ------------------------------------------------------------------------------
# EMAIL CREDENTIALS
# ------------------------------------------------------------------------------
EMAIL_HOST_USER_CREDENTIAL = config('EMAIL_HOST_USER')
EMAIL_HOST_PASSWORD_CREDENTIAL = config('EMAIL_HOST_PASSWORD')
DEFAULT_FROM_EMAIL_ADDR = config('DEFAULT_FROM_EMAIL')
CONTACT_EMAIL_RECIPIENT = config('CONTACT_EMAIL_RECIPIENT', default='hi@ridwaanhall.com')

# ------------------------------------------------------------------------------
# FEATURE TOGGLES
# ------------------------------------------------------------------------------
GUESTBOOK_PAGE = config('GUESTBOOK_PAGE', default=True, cast=bool)
WSRV_IMAGE_OPTIMIZATION = config('WSRV_IMAGE_OPTIMIZATION', default=not DEBUG, cast=bool)

# ------------------------------------------------------------------------------
# SOCIAL AUTHENTICATION KEYS
# ------------------------------------------------------------------------------
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')
GOOGLE_CLIENT_SECRET = config('GOOGLE_CLIENT_SECRET', default='')
GH_CLIENT_ID = config('GH_CLIENT_ID', default='')
GH_CLIENT_SECRET = config('GH_CLIENT_SECRET', default='')

# ------------------------------------------------------------------------------
# DATABASE CREDENTIALS (POSTGRESQL)
# ------------------------------------------------------------------------------
POSTGRES_DB_NAME = config('POSTGRES_DATABASE', default='ridwaanhall_db')
POSTGRES_USER = config('POSTGRES_USER', default='postgres')
POSTGRES_PASSWORD = config('POSTGRES_PASSWORD', default='')
POSTGRES_HOST = config('POSTGRES_HOST', default='localhost')
POSTGRES_PORT = config('POSTGRES_PORT', default='5432')