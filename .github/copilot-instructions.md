# FlexForge Django Portfolio Platform - GitHub Copilot Instructions

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

FlexForge is a Django 5.2.5 portfolio platform with Individual File System content management, real-time API integrations, and enterprise security. Follow these exact commands:

### Bootstrap, Build, and Test Repository

**NEVER CANCEL ANY COMMANDS** - Build and test commands may take time but are essential for proper functionality.

```bash
# Setup Python virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate   # Windows

# Install dependencies - takes ~25 seconds. NEVER CANCEL. Set timeout to 180+ seconds.
pip install --upgrade pip
pip install -r requirements.txt
# Note: May fail due to network timeouts in restricted environments - this is expected

# Create required environment configuration
cp .env.example .env
# Edit .env with proper values (see Environment Configuration section)

# Verify Django configuration - takes ~0.5 seconds
python manage.py check

# Run database migrations - takes ~1 second. NEVER CANCEL.
python manage.py migrate

# Collect static files - takes ~0.5 seconds
python manage.py collectstatic --noinput

# Run tests - takes ~1 second. NEVER CANCEL. Set timeout to 60+ seconds.
python manage.py test
```

### Run Development Server

```bash
# ALWAYS run the bootstrapping steps first
python manage.py runserver 0.0.0.0:8000
# Access at http://localhost:8000
```

### Environment Configuration

**CRITICAL**: Create `.env` file in project root with these exact settings:

```env
# Core Settings (Required)
BASE_URL="http://localhost:8000"
SECRET_KEY="django-insecure-development-key-change-in-production"
DEBUG=True
ALLOWED_HOSTS="localhost,127.0.0.1"

# Feature Toggles (CRITICAL: GUESTBOOK_PAGE=True required due to import dependency)
GUESTBOOK_PAGE=True
WSRV_IMAGE_OPTIMIZATION=True

# API Keys (Optional for development, required for full functionality)
ACCESS_TOKEN=""
WAKATIME_API_KEY=""
WEB3FORM_PAC=""

# OAuth (Required only when GUESTBOOK_PAGE=True)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GH_CLIENT_ID=""
GH_CLIENT_SECRET=""

# Image URLs (Optional - defaults used if not set)
BLOG_BASE_IMG_URL="http://localhost:8000/static/img/blog"
PROJECT_BASE_IMG_URL="http://localhost:8000/static/img/project"
```

**WARNING**: Setting `GUESTBOOK_PAGE=False` will cause import errors. This is a known issue in apps/seo/sitemaps.py line 14.

## Validation

**ALWAYS manually validate any new code changes through these complete scenarios after making changes:**

### Scenario 1: Core Application Pages
```bash
# Start development server
python manage.py runserver 0.0.0.0:8000

# Test these URLs return 200 OK:
curl -I http://localhost:8000/          # Homepage
curl -I http://localhost:8000/about/    # About page  
curl -I http://localhost:8000/projects/ # Projects listing
curl -I http://localhost:8000/blog/     # Blog listing
curl -I http://localhost:8000/dashboard/ # Analytics dashboard
```

### Scenario 2: SEO and Management Commands
```bash
# Test SEO functionality - takes ~30 seconds. NEVER CANCEL.
python manage.py seo_manage --check-meta

# Test image optimization
python manage.py wsrv_config --status
python manage.py wsrv_config --test-url "https://example.com/test.jpg" --width 200 --height 200

# Verify sitemap accessibility
curl -I http://localhost:8000/sitemap.xml
```

### Scenario 3: Content Management System
Test the Individual File System by checking content loads properly:
- Navigate to projects page and verify project cards display
- Navigate to blog page and verify blog posts display  
- Check about page shows skills, experience, education sections

## Project Structure and Navigation

```
ridwaanhall-com/
├── apps/                          # Django applications
│   ├── about/                     # Personal information & bio
│   ├── blog/                      # Blog system with SEO
│   ├── core/                      # Homepage & base views  
│   ├── dashboard/                 # GitHub/WakaTime analytics
│   ├── data/                      # Individual File System (content management)
│   │   ├── about/                 # Individual files for about content
│   │   ├── content/               # Blog and project content files
│   │   ├── content_manager.py     # Content loading system
│   │   └── data_service.py        # Data service layer
│   ├── guestbook/                 # OAuth authentication & messaging
│   ├── projects/                  # Portfolio showcase
│   └── seo/                       # SEO, sitemaps, robots.txt
├── FlexForge/                     # Django project configuration
│   ├── settings.py                # Main settings file
│   ├── urls.py                    # URL routing
│   └── wsgi.py                    # WSGI application
├── templates/                     # HTML templates
├── staticfiles/                   # Production static files
├── docs/                          # Comprehensive documentation
├── requirements.txt               # Python dependencies
├── vercel.json                    # Vercel deployment config
└── manage.py                      # Django management script
```

### Key Files to Check After Changes

- **Always check apps/data/ files** after modifying content structure
- **Always verify templates/** after UI changes
- **Always check FlexForge/settings.py** after environment changes
- **Always test management commands** after modifying apps/core/ or apps/seo/

## Common Tasks

### Development Workflow
```bash
# Before starting work
python manage.py check
python manage.py migrate
python manage.py collectstatic --noinput

# During development - restart server after model/settings changes
python manage.py runserver 0.0.0.0:8000

# Before committing changes
python manage.py check
python manage.py test
python manage.py seo_manage --check-meta
```

### Content Management
```bash
# Content is managed through Individual File System
# Edit files in apps/data/about/ for personal information
# Edit files in apps/data/content/ for blog and project content
# No database required for content - all in Python files
```

### API Integration Testing
```bash
# Test GitHub API integration (requires ACCESS_TOKEN)
python manage.py shell
>>> from apps.dashboard.views import DashboardView
>>> view = DashboardView()
>>> github_stats = view._get_github_stats()

# Test WakaTime integration (requires WAKATIME_API_KEY) 
>>> wakatime_stats = view._get_wakatime_stats()
```

### Image Optimization
```bash
# Enable/disable WSRV optimization
python manage.py wsrv_config --status
python manage.py wsrv_config --test-url "URL" --width 300 --height 200
```

## Build Pipeline and CI

The project uses GitHub Actions for CI/CD:
- **Tests**: `python manage.py test` (runs on Python 3.10-3.13)
- **Environment**: Requires environment variables set in GitHub secrets
- **Deployment**: Configured for Vercel with vercel.json

## Timing Expectations

**CRITICAL: NEVER CANCEL** these commands - they complete quickly but timing varies:

- **Dependencies installation**: 20-30 seconds (timeout: 120+ seconds)
- **Database migrations**: 0.5-1 seconds (timeout: 60+ seconds) 
- **Static collection**: 0.3-0.5 seconds (timeout: 30+ seconds)
- **Django check**: 0.3-0.5 seconds (timeout: 30+ seconds)
- **Test suite**: 0.5-1 seconds (timeout: 60+ seconds)
- **SEO validation**: 15-45 seconds (timeout: 120+ seconds)
- **Server startup**: 1-3 seconds

## Troubleshooting

### Common Issues

1. **Import error when GUESTBOOK_PAGE=False**
   - Known bug in apps/seo/sitemaps.py line 14
   - Solution: Always set GUESTBOOK_PAGE=True

2. **API errors in dashboard**
   - Expected when ACCESS_TOKEN or WAKATIME_API_KEY are empty
   - Dashboard will show placeholder data

3. **Static files not loading**
   - Run `python manage.py collectstatic --noinput`
   - Ensure DEBUG=True in development

4. **Django check fails**
   - Verify .env file exists and has required settings
   - Check INSTALLED_APPS matches GUESTBOOK_PAGE setting

### Debug Commands
```bash
# System debugging
python manage.py shell
python manage.py check --deploy  # Production readiness check
python manage.py diffsettings    # Show non-default settings

# SEO debugging  
python manage.py seo_manage --validate
python manage.py seo_manage --report

# Image optimization debugging
python manage.py wsrv_config --test-url "https://example.com/image.jpg"
```

## Security Considerations

- **CSP headers**: Strict content security policy enabled
- **HTTPS enforcement**: Enabled in production (DEBUG=False)
- **XSS protection**: Multiple layers of protection
- **Environment variables**: Never commit secrets to code
- **OAuth**: Required for guestbook functionality

## Performance Notes

- **99+ PageSpeed scores**: Optimized for performance
- **Image optimization**: WSRV.nl proxy for automatic resizing
- **Static files**: WhiteNoise for efficient serving
- **Database**: SQLite in development, PostgreSQL in production
- **Caching**: Built-in Django caching for API responses

---

**Remember**: Always follow these instructions before exploring alternatives. The Individual File System architecture is unique - content is stored in Python files, not database records. Focus validation efforts on the complete user experience scenarios listed above.