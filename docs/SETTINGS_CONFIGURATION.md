# Django Settings Configuration

This project uses a modular settings configuration that separates environment-specific settings into different files for better maintainability and security.

## Settings Structure

```
FlexForge/settings/
├── __init__.py          # Auto-detects environment and loads appropriate settings
├── base.py             # Common settings shared across all environments
├── development.py      # Development-specific settings (Debug enabled, SQLite)
├── production.py       # Production-specific settings (Security optimized, PostgreSQL)
├── staging.py          # Staging-specific settings (Production-like with debug features)
└── testing.py          # Testing-specific settings (In-memory DB, fast execution)
```

## Environment Detection

The settings are automatically detected based on the `DJANGO_ENVIRONMENT` environment variable:

| Environment | Auto-loads | Key Features |
|-------------|------------|--------------|
| `development` | `development.py` | Debug mode, SQLite, Console email, Detailed logging |
| `production` | `production.py` | Security optimized, PostgreSQL, SMTP email, WhiteNoise |
| `staging` | `staging.py` | Production-like with debug features, Separate database |
| `testing` | `testing.py` | In-memory SQLite, Minimal logging, Fast execution |
| *default* | `development.py` | If DJANGO_ENVIRONMENT is not set |

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment:**
   ```bash
   # For development (default)
   DJANGO_ENVIRONMENT=development
   
   # For production
   DJANGO_ENVIRONMENT=production
   
   # For staging
   DJANGO_ENVIRONMENT=staging
   
   # For testing
   DJANGO_ENVIRONMENT=testing
   ```

3. **Set required environment variables in `.env`:**
   ```bash
   SECRET_KEY=your-super-secret-django-key
   ACCESS_TOKEN=your-github-token
   WAKATIME_API_KEY=your-wakatime-key
   ```

## Environment-Specific Features

### Development Environment
- **Database:** SQLite (no setup required)
- **Debug:** Enabled with detailed error pages
- **Security:** Relaxed for local development
- **Caching:** Local memory cache
- **Email:** Console backend (prints to terminal)
- **Static files:** Served by Django dev server

### Production Environment
- **Database:** PostgreSQL with connection pooling
- **Security:** Maximum HTTPS, HSTS, secure cookies
- **Caching:** Redis with session storage
- **Email:** SMTP with proper email backend
- **Static files:** WhiteNoise with compression
- **Logging:** File-based with rotation

### Staging Environment
- **Database:** PostgreSQL or SQLite fallback
- **Security:** Production-like with some flexibility
- **Caching:** Configurable (Redis/LocalMem)
- **Email:** Console or SMTP
- **Testing:** Optional debug toolbar
- **Logging:** Enhanced for debugging

### Testing Environment
- **Database:** In-memory SQLite for speed
- **Security:** Minimal for test compatibility
- **Caching:** Dummy cache (no caching)
- **Email:** Local memory backend
- **Performance:** Optimized for test speed

## Required Environment Variables

### Core Settings (All Environments)
```bash
SECRET_KEY=your-django-secret-key
ACCESS_TOKEN=your-github-access-token
WAKATIME_API_KEY=your-wakatime-api-key
```

### Database Settings (Production/Staging)
```bash
POSTGRES_DATABASE=your-database-name
POSTGRES_USER=your-database-user
POSTGRES_PASSWORD=your-database-password
POSTGRES_HOST=your-database-host
POSTGRES_PORT=5432
```

### Social Authentication (if GUESTBOOK_PAGE=True)
```bash
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GH_CLIENT_ID=your-github-client-id
GH_CLIENT_SECRET=your-github-client-secret
```

### Production-Specific Settings
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-email-password
REDIS_URL=redis://127.0.0.1:6379/1
```

## Feature Flags

Control application features through environment variables:

```bash
# Enable/disable guestbook functionality
GUESTBOOK_PAGE=True

# Enable/disable image optimization
WSRV_IMAGE_OPTIMIZATION=True

# Debug mode (development only)
DEBUG=True
```

## Deployment Examples

### Local Development
```bash
# .env file
DJANGO_ENVIRONMENT=development
DEBUG=True
SECRET_KEY=dev-secret-key-here
ACCESS_TOKEN=your-github-token
WAKATIME_API_KEY=your-wakatime-key
```

### Production Deployment (Vercel)
```bash
# Vercel environment variables
DJANGO_ENVIRONMENT=production
SECRET_KEY=production-secret-key
POSTGRES_PASSWORD=secure-database-password
EMAIL_HOST_PASSWORD=email-app-password
REDIS_URL=redis://production-redis-url
```

### Staging Environment
```bash
# .env file
DJANGO_ENVIRONMENT=staging
DEBUG=False
POSTGRES_DATABASE=staging_db
ALLOW_TEST_DATA_CREATION=True
```

## Migration Between Settings

If you're migrating from the old single `settings.py` file:

1. **Backup your current settings:**
   ```bash
   cp FlexForge/settings.py FlexForge/settings_backup.py
   ```

2. **Update your environment variables:**
   - Add `DJANGO_ENVIRONMENT=development` to your `.env` file
   - Verify all required variables are set

3. **Test the migration:**
   ```bash
   python manage.py check
   python manage.py migrate --dry-run
   ```

4. **Update deployment scripts:**
   - Ensure `DJANGO_ENVIRONMENT=production` is set in production
   - Update any CI/CD pipelines to use appropriate environment

## Troubleshooting

### Import Errors
If you see import errors, ensure you're importing from the settings package:
```python
# In Django apps, this should work automatically
from django.conf import settings

# For manual imports (rare)
from FlexForge.settings import base
```

### Environment Not Loading
Check that `DJANGO_ENVIRONMENT` is set correctly:
```python
# Check current environment
python manage.py shell -c "from django.conf import settings; print(settings.DJANGO_ENVIRONMENT)"
```

### Database Issues
- **Development:** Ensure SQLite is available (included with Python)
- **Production:** Verify PostgreSQL credentials and connectivity
- **Testing:** No setup required (uses in-memory database)

## Security Considerations

- **Never commit `.env` files** - they contain sensitive information
- **Use different SECRET_KEY values** for each environment
- **Enable HTTPS in production** - set `SECURE_SSL_REDIRECT=True`
- **Use strong database passwords** in production and staging
- **Regularly rotate API keys** and authentication credentials

## Performance Optimization

### Development
- Uses SQLite for simplicity
- Minimal security overhead
- Console logging for debugging

### Production
- PostgreSQL with connection pooling
- Redis caching for sessions and data
- Compressed static file serving
- File-based logging with rotation

### Testing
- In-memory database for speed
- Dummy cache to avoid overhead
- Minimal logging to reduce noise
- Fast password hashing for user creation