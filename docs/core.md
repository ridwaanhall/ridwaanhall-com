# Core App Documentation

## Overview

The Core app serves as the central hub of the FlexForge portfolio platform, providing essential functionality including the homepage, contact page, privacy policy, base templates, shared utilities, and core infrastructure components. It acts as the foundation that other apps build upon.

## Table of Contents

- [App Structure](#app-structure)
- [Views and Functionality](#views-and-functionality)
- [Base Templates and Layouts](#base-templates-and-layouts)
- [URL Patterns](#url-patterns)
- [Shared Utilities](#shared-utilities)
- [Static Files Management](#static-files-management)
- [Middleware and Security](#middleware-and-security)
- [Performance Optimization](#performance-optimization)
- [Configuration](#configuration)
- [Customization Examples](#customization-examples)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## App Structure

```txt
apps/core/
├── __init__.py
├── admin.py
├── apps.py
├── base_views.py          # Base view classes for other apps
├── image_utils.py         # Image optimization utilities
├── models.py              # Core models (if any)
├── views.py               # HomeView, ContactView, PrivacyPolicyView
├── urls.py                # Core URL patterns
├── tests.py
├── migrations/
├── templatetags/          # Custom template tags
└── templates/
    └── core/
        ├── home.html          # Homepage template
        ├── contact.html       # Contact page template
        └── privacy-policy.html # Privacy policy template
```

## Views and Functionality

### HomeView - Portfolio Homepage

The homepage serves as the main entry point, showcasing key portfolio information:

```python
class HomeView(HomepageSEOMixin, BaseView):
    """
    Homepage view displaying key portfolio information.
    Shows recent blogs, featured projects, current experience, education, and skills.
    """
    template_name = 'core/home.html'
    
    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        
        # Randomize skills for visual variety
        skills = list(DataService.get_skills())
        skills_top, skills_middle, skills_bottom = (
            random.sample(skills, k=len(skills)) for _ in range(3)
        )
        
        context = {
            'view': True,
            'view_certs': True,
            'blogs': DataService.get_blogs()[:5],  # Latest 5 blogs
            'projects': DataService.get_projects()[:2],  # Top 2 featured projects
            'education': DataService.get_education(last_only=True),
            'experiences': DataService.get_experiences(current_only=True),
            'skills_top': skills_top,
            'skills_middle': skills_middle,
            'skills_bottom': skills_bottom,
            'about': about,
            'certifications': DataService.get_certifications(),
        }
        
        return self.render_to_response(context)
```

#### Homepage Features
- **Hero Section**: Personal introduction with profile image
- **Latest Blog Posts**: 5 most recent blog posts
- **Featured Projects**: 2 top featured projects
- **Current Experience**: Current work positions
- **Latest Education**: Most recent education
- **Skills Showcase**: Randomized skill display for visual variety
- **Certifications**: Professional certifications display
- **SEO Optimization**: Complete meta tags and structured data

### ContactView - Contact Information Page

Displays contact information with current time:

```python
class ContactView(ContactSEOMixin, BaseView):
    """
    Contact page view with current time and contact information.
    """
    template_name = 'core/contact.html'
    
    def _get(self, request, *args, **kwargs):
        about = self.get_about_data()
        context = {
            'view': True,
            'about': about,
            'current_time': timezone.localtime(timezone.now()),
        }
        
        return self.render_to_response(context)
```

#### Contact Page Features
- **Contact Information**: Email, location, social links
- **Real-time Clock**: Current local time display
- **Professional Profiles**: Links to GitHub, LinkedIn, etc.
- **Contact Form Integration**: Ready for contact form implementation

### PrivacyPolicyView - Privacy Policy Display

Shows the privacy policy from the Individual File System:

```python
class PrivacyPolicyView(PrivacyPolicySEOMixin, BaseView):
    """
    Privacy policy page view.
    """
    template_name = 'core/privacy-policy.html'
    
    def _get(self, request, *args, **kwargs):
        context = {
            'about': self.get_about_data(),
            'privacy_policy': DataService.get_privacy_policy(),
        }
        
        return self.render_to_response(context)
```

### CV Redirect Views

Professional CV access with SEO-friendly redirects:

```python
class CVRedirectView(BaseView):
    """
    Professional CV redirect view.
    Redirects to Google Drive CV document with a permanent redirect.
    """
    def get(self, request, *args, **kwargs):
        about_data = self.get_about_data()
        cv_url = about_data.get('cv')
        
        if not cv_url:
            return HttpResponsePermanentRedirect('/')
            
        return HttpResponsePermanentRedirect(cv_url)
```

## Base Templates and Layouts

### Template Hierarchy

The Core app provides the foundation template structure:

```txt
templates/
├── base.html              # Main base template
├── components/            # Reusable components
│   ├── navigation.html    # Main navigation
│   ├── footer.html        # Site footer
│   ├── seo.html          # SEO meta tags
│   └── scripts.html      # JavaScript includes
└── core/
    ├── home.html         # Homepage layout
    ├── contact.html      # Contact page layout
    └── privacy-policy.html # Privacy policy layout
```

### Base Template Structure

```html
<!-- base.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- SEO meta tags -->
    {% include 'components/seo.html' %}
    
    <!-- Stylesheets -->
    {% load static %}
    <link rel="stylesheet" href="{% static 'css/main.css' %}">
    
    <!-- Custom head content -->
    {% block extra_head %}{% endblock %}
</head>
<body>
    <!-- Navigation -->
    {% include 'components/navigation.html' %}
    
    <!-- Main content -->
    <main>
        {% block content %}{% endblock %}
    </main>
    
    <!-- Footer -->
    {% include 'components/footer.html' %}
    
    <!-- Scripts -->
    {% include 'components/scripts.html' %}
    {% block extra_scripts %}{% endblock %}
</body>
</html>
```

### Component Templates

#### Navigation Component
- **Responsive design** with mobile hamburger menu
- **Active page highlighting** with Django template logic
- **Conditional guestbook** link based on settings
- **Professional branding** with logo/name

#### Footer Component
- **Copyright information** with dynamic year
- **Social media links** from about data
- **Quick navigation** links
- **Professional contact** information

#### SEO Component
- **Meta tags** generation from context
- **Open Graph** tags for social sharing
- **Twitter Card** metadata
- **Canonical URLs** for SEO
- **Schema.org** structured data

## URL Patterns

```python
# apps/core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.HomeView.as_view(), name='home'),
    path('contact/', views.ContactView.as_view(), name='contact'),
    path('privacy-policy/', views.PrivacyPolicyView.as_view(), name='privacy_policy'),
    path('cv/', views.CVRedirectView.as_view(), name='cv'),
    path('cv-latest/', views.CVLatestRedirectView.as_view(), name='cv_latest'),
    path('cv-template/', views.CVTemplateRedirectView.as_view(), name='cv_template'),
]
```

**URL Mapping**:
- `/` - Homepage
- `/contact/` - Contact information
- `/privacy-policy/` - Privacy policy
- `/cv/` - CV redirect
- `/cv-latest/` - Latest CV redirect
- `/cv-template/` - CV template redirect

## Shared Utilities

### Base View Classes

The Core app provides base view classes for consistency across all apps:

```python
# apps/core/base_views.py
class BaseView(View):
    """
    Base view class providing common functionality for all views.
    """
    def get_about_data(self):
        """Get about data with error handling."""
        return DataService.get_about_data()
    
    def get_common_context(self):
        """Get common context data for all views."""
        return {
            'about': self.get_about_data(),
            'current_year': timezone.now().year,
        }
    
    def handle_exceptions(self, view_func):
        """Decorator for handling view exceptions."""
        def wrapper(request, *args, **kwargs):
            try:
                return view_func(request, *args, **kwargs)
            except Exception as e:
                logger.error(f"Error in {view_func.__name__}: {e}")
                return self.handle_error(request, e)
        return wrapper
    
    def handle_error(self, request, exception):
        """Handle view errors gracefully."""
        # Error handling logic
        pass

class PaginatedView(BaseView):
    """Base view for paginated content."""
    items_per_page = 10
    
    def paginate_items(self, request, items, items_per_page=None):
        """Paginate items with proper error handling."""
        # Pagination logic implementation
        pass

class DetailView(BaseView):
    """Base view for detail pages."""
    
    def get_item_by_slug(self, items, slug, slug_field):
        """Get item by slug with 404 handling."""
        # Slug-based item retrieval
        pass
```

### Image Utilities

Image optimization and processing utilities:

```python
# apps/core/image_utils.py
def get_optimized_image_url(image_url, width=None, height=None, format_type=None):
    """
    Returns an optimized image URL using WSRV.nl if enabled.
    
    Args:
        image_url (str): The original image URL
        width (int, optional): The desired width for the image
        height (int, optional): The desired height for the image
        format_type (str, optional): The desired format (webp, jpg, png)
    
    Returns:
        str: The optimized image URL or original URL based on settings
    """
    if not image_url:
        return ""
    
    # Check if WSRV optimization is enabled
    wsrv_enabled = getattr(settings, 'WSRV_IMAGE_OPTIMIZATION', True)
    
    if not wsrv_enabled:
        return image_url
    
    # Build WSRV parameters
    params = {'url': image_url}
    
    if width:
        params['w'] = width
    if height:
        params['h'] = height
    if format_type:
        params['output'] = format_type
    
    # Construct the WSRV URL
    query_string = urlencode(params)
    return f"https://wsrv.nl/?{query_string}"

def get_wsrv_status():
    """Get WSRV optimization status."""
    return {
        'enabled': getattr(settings, 'WSRV_IMAGE_OPTIMIZATION', True),
        'service': 'WSRV.nl',
        'features': ['Auto WebP', 'Resizing', 'Quality Optimization']
    }
```

## Static Files Management

### Static File Organization

```txt
staticfiles/
├── css/
│   ├── main.css          # Main stylesheet (compiled)
│   └── components/       # Component-specific styles
├── js/
│   ├── main.js          # Main JavaScript file
│   ├── components/      # Component-specific scripts
│   └── utils/           # Utility functions
├── img/
│   ├── favicon.ico      # Site favicon
│   ├── logo.png         # Site logo
│   └── author/          # Author profile images
└── fonts/               # Custom fonts (if any)
```

### Static File Configuration

```python
# In settings.py
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# Static file compression and optimization
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# WhiteNoise configuration for production
WHITENOISE_USE_FINDERS = True
WHITENOISE_AUTOREFRESH = True
```

## Middleware and Security

### Security Configuration

The Core app works with Django's security middleware:

```python
# Security middleware configuration
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
```

### Security Headers

```python
# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CSP (Content Security Policy)
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
CSP_IMG_SRC = ("'self'", "data:", "https:", "http:")
```

## Performance Optimization

### Caching Strategy

```python
# View-level caching
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

@method_decorator(cache_page(60 * 15), name='dispatch')  # 15 minutes
class HomeView(HomepageSEOMixin, BaseView):
    # View implementation
```

### Template Optimization

- **Fragment caching** for expensive template sections
- **Static file compression** with WhiteNoise
- **Image optimization** with WSRV.nl integration
- **Lazy loading** for images and components

### Database Optimization

- **Minimal database usage** with Individual File System
- **Efficient data loading** patterns
- **Caching frequently accessed data**

## Configuration

### Environment Variables

```env
# Core application settings
BASE_URL="https://your-domain.com"
SECRET_KEY="your-django-secret-key"
DEBUG=False

# Image optimization
WSRV_IMAGE_OPTIMIZATION=True

# Security settings
SECURE_SSL_REDIRECT=True
SECURE_PROXY_SSL_HEADER=HTTP_X_FORWARDED_PROTO,https
```

### Settings Configuration

```python
# Core settings
BASE_URL = os.getenv('BASE_URL', 'http://localhost:8000')
DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'

# Image optimization
WSRV_IMAGE_OPTIMIZATION = os.getenv('WSRV_IMAGE_OPTIMIZATION', 'True').lower() == 'true'

# Template configuration
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
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
```

## Customization Examples

### Customizing Homepage Content

```python
# Modify the HomeView to change displayed content
class HomeView(HomepageSEOMixin, BaseView):
    def _get(self, request, *args, **kwargs):
        context = {
            'blogs': DataService.get_blogs()[:3],  # Show only 3 blogs
            'projects': DataService.get_projects()[:4],  # Show 4 projects
            # Add custom sections
            'featured_certifications': DataService.get_certifications()[:5],
        }
        return self.render_to_response(context)
```

### Adding New Base Template

```html
<!-- templates/layouts/minimal.html -->
{% extends 'base.html' %}

{% block content %}
<div class="min-h-screen bg-gray-50">
    <div class="container mx-auto px-4 py-8">
        {% block main_content %}{% endblock %}
    </div>
</div>
{% endblock %}
```

### Custom Template Tags

```python
# apps/core/templatetags/core_tags.py
from django import template

register = template.Library()

@register.simple_tag
def get_optimized_image(image_url, width=None, height=None):
    """Get optimized image URL."""
    from apps.core.image_utils import get_optimized_image_url
    return get_optimized_image_url(image_url, width, height)

@register.inclusion_tag('components/skill_badge.html')
def skill_badge(skill):
    """Render skill badge component."""
    return {'skill': skill}
```

## Troubleshooting

### Common Issues

#### Homepage Not Loading
**Problem**: Homepage returns 500 error
**Solution**:
1. Check about data availability
2. Verify blog and project data loading
3. Check template syntax

```bash
# Debug homepage data
python manage.py shell
>>> from apps.core.views import HomeView
>>> view = HomeView()
>>> about = view.get_about_data()
>>> print(about)
```

#### Static Files Not Loading
**Problem**: CSS/JS files not found (404)
**Solution**:
1. Run `python manage.py collectstatic`
2. Check `STATIC_URL` and `STATIC_ROOT` settings
3. Verify WhiteNoise configuration

#### Template Errors
**Problem**: Template rendering errors
**Solution**:
1. Check template syntax
2. Verify context data availability
3. Check template tag imports

#### SEO Data Missing
**Problem**: Meta tags not appearing
**Solution**:
1. Verify SEO mixin integration
2. Check template includes for SEO component
3. Validate about data structure

### Debug Commands

```bash
# Test core functionality
python manage.py shell
>>> from apps.data.data_service import DataService
>>> print(DataService.get_about_data())

# Check template rendering
>>> from django.test import RequestFactory
>>> from apps.core.views import HomeView
>>> factory = RequestFactory()
>>> request = factory.get('/')
>>> view = HomeView.as_view()
>>> response = view(request)
>>> print(response.status_code)

# Test static files
python manage.py findstatic css/main.css
python manage.py collectstatic --dry-run
```

## Best Practices

### Template Organization
1. **Modular templates**: Break templates into reusable components
2. **Consistent naming**: Use clear, descriptive template names
3. **DRY principle**: Avoid template code duplication
4. **Performance**: Use template fragments and caching

### View Development
1. **Inheritance**: Use base view classes for consistency
2. **Error handling**: Implement proper exception handling
3. **Context management**: Provide consistent context data
4. **SEO integration**: Always include SEO mixins

### Static File Management
1. **Organization**: Keep static files well-organized
2. **Optimization**: Compress and minify CSS/JS
3. **Versioning**: Use proper static file versioning
4. **CDN integration**: Consider CDN for static files

### Performance Optimization
1. **Caching**: Implement appropriate caching strategies
2. **Database queries**: Minimize database usage
3. **Image optimization**: Use image optimization services
4. **Code splitting**: Split JavaScript for better loading

### Security Considerations
1. **HTTPS enforcement**: Always use HTTPS in production
2. **Security headers**: Implement comprehensive security headers
3. **Input validation**: Validate all user inputs
4. **Error handling**: Don't expose sensitive information in errors

### SEO Best Practices
1. **Meta tags**: Include comprehensive meta tags
2. **Structured data**: Implement Schema.org markup
3. **URL structure**: Use SEO-friendly URL patterns
4. **Site performance**: Optimize for Core Web Vitals

### Development Workflow
1. **Testing**: Test all views thoroughly
2. **Documentation**: Document custom functionality
3. **Code quality**: Follow Django best practices
4. **Version control**: Use meaningful commit messages

The Core app serves as the foundation of the FlexForge platform, providing essential infrastructure, shared utilities, and base functionality that enables other apps to build sophisticated features while maintaining consistency and performance across the entire application.