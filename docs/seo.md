# SEO App Documentation

## Overview

The SEO app is a comprehensive search engine optimization system that automatically generates meta tags, structured data, sitemaps, and implements advanced SEO features. It provides SEO mixins for all other apps, manages robots.txt generation, implements social media optimization, and includes Google Analytics integration with performance monitoring capabilities.

## Table of Contents

- [App Structure](#app-structure)
- [SEO Mixins System](#seo-mixins-system)
- [Meta Tag Management](#meta-tag-management)
- [Structured Data Implementation](#structured-data-implementation)
- [Sitemap Generation](#sitemap-generation)
- [Social Media Optimization](#social-media-optimization)
- [Google Analytics Integration](#google-analytics-integration)
- [Performance Optimization](#performance-optimization)
- [SEO Management Commands](#seo-management-commands)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## App Structure

```txt
apps/seo/
├── __init__.py
├── apps.py
├── config.py               # SEO configuration settings
├── data.py                 # SEO data management
├── manager.py              # SEO operations manager
├── mixins.py               # SEO mixins for views
├── schema.py               # Structured data schemas
├── sitemaps.py             # Sitemap generation
├── updated_at_data.py      # Last modified timestamps
├── urls.py                 # SEO-related URLs
├── views.py                # robots.txt and SEO endpoints
├── management/
│   └── commands/
│       └── seo_manage.py   # SEO management command
├── templates/
│   └── seo/
├── templatetags/
│   └── seo_tags.py         # Template tags for SEO
└── tests.py
```

## SEO Mixins System

### Base SEO Mixin

```python
# apps/seo/mixins.py
from django.conf import settings
from .manager import SEOManager

class BaseSEOMixin:
    """
    Base SEO mixin providing common functionality for all views.
    """
    
    def get_seo_data(self, **kwargs):
        """Get base SEO data structure."""
        return {
            'title': self.get_seo_title(**kwargs),
            'description': self.get_seo_description(**kwargs),
            'keywords': self.get_seo_keywords(**kwargs),
            'image': self.get_seo_image(**kwargs),
            'url': self.get_canonical_url(**kwargs),
            'type': self.get_seo_type(**kwargs),
            'schema': self.get_schema_data(**kwargs),
        }
    
    def get_seo_title(self, **kwargs):
        """Generate SEO title."""
        return "FlexForge - Advanced Developer Portfolio"
    
    def get_seo_description(self, **kwargs):
        """Generate meta description."""
        return "Modern portfolio platform with individual file data management, real-time API integrations, and enterprise-grade security."
    
    def get_seo_keywords(self, **kwargs):
        """Generate meta keywords."""
        return ["portfolio", "developer", "django", "python", "web development"]
    
    def get_seo_image(self, **kwargs):
        """Get social sharing image."""
        return f"{settings.BASE_URL}/static/img/og-image.webp"
    
    def get_canonical_url(self, **kwargs):
        """Get canonical URL."""
        return f"{settings.BASE_URL}{self.request.path}"
    
    def get_seo_type(self, **kwargs):
        """Get Open Graph type."""
        return "website"
    
    def get_schema_data(self, **kwargs):
        """Generate Schema.org structured data."""
        return {
            "@type": "WebSite",
            "name": "FlexForge Portfolio",
            "url": settings.BASE_URL,
            "author": {
                "@type": "Person",
                "name": "Your Name"
            }
        }
    
    def get_context_data(self, **kwargs):
        """Add SEO data to template context."""
        context = super().get_context_data(**kwargs)
        context['seo'] = self.get_seo_data(**kwargs)
        return context
```

### Homepage SEO Mixin

```python
class HomepageSEOMixin(BaseSEOMixin):
    """SEO mixin for homepage."""
    
    def get_seo_title(self, **kwargs):
        return "FlexForge - Advanced Developer Portfolio Platform | Modern Web Development"
    
    def get_seo_description(self, **kwargs):
        return "Showcase your development skills with FlexForge's advanced portfolio platform. Features real-time analytics, project galleries, blog system, and enterprise-grade security."
    
    def get_seo_keywords(self, **kwargs):
        return [
            "developer portfolio", "web development", "python django", 
            "portfolio platform", "developer showcase", "project gallery",
            "blog system", "real-time analytics", "github integration"
        ]
    
    def get_schema_data(self, **kwargs):
        """Rich homepage schema."""
        about = kwargs.get('about', {})
        skills = kwargs.get('skills_top', [])
        
        return {
            "@type": "Person",
            "name": about.get('name', 'Developer'),
            "jobTitle": about.get('title', 'Software Developer'),
            "description": about.get('description', ''),
            "url": settings.BASE_URL,
            "sameAs": [
                about.get('github', ''),
                about.get('linkedin', ''),
            ],
            "knowsAbout": [skill.get('name', '') for skill in skills[:10]],
            "worksFor": {
                "@type": "Organization",
                "name": "Freelance"
            }
        }
```

### Blog SEO Mixins

```python
class BlogListSEOMixin(BaseSEOMixin):
    """SEO mixin for blog listing page."""
    
    def get_seo_title(self, **kwargs):
        page = kwargs.get('page', 1)
        if page > 1:
            return f"Developer Blog - Page {page} | FlexForge"
        return "Developer Blog | Programming Tutorials & Insights | FlexForge"
    
    def get_seo_description(self, **kwargs):
        return "Explore programming tutorials, development insights, and technical articles. Learn Python, Django, web development, and modern software engineering practices."
    
    def get_seo_keywords(self, **kwargs):
        return [
            "programming blog", "web development tutorials", "python tutorials",
            "django tutorials", "software engineering", "coding tips",
            "development best practices", "technical articles"
        ]

class BlogDetailSEOMixin(BaseSEOMixin):
    """SEO mixin for individual blog posts."""
    
    def get_seo_title(self, **kwargs):
        blog = kwargs.get('blog')
        if blog:
            return f"{blog['title']} | FlexForge Blog"
        return super().get_seo_title(**kwargs)
    
    def get_seo_description(self, **kwargs):
        blog = kwargs.get('blog')
        if blog:
            return blog.get('description', '')[:160]
        return super().get_seo_description(**kwargs)
    
    def get_seo_keywords(self, **kwargs):
        blog = kwargs.get('blog')
        if blog:
            base_keywords = ["tutorial", "programming", "development"]
            blog_tags = blog.get('tags', [])
            return base_keywords + blog_tags
        return super().get_seo_keywords(**kwargs)
    
    def get_seo_image(self, **kwargs):
        blog = kwargs.get('blog')
        if blog and blog.get('images'):
            # Get main image from blog
            images = blog.get('images', {})
            main_image = images.get('main-hero.webp') or next(iter(images.values()), '')
            if main_image:
                return main_image
        return super().get_seo_image(**kwargs)
    
    def get_schema_data(self, **kwargs):
        blog = kwargs.get('blog')
        if blog:
            return {
                "@type": "BlogPosting",
                "headline": blog.get('title', ''),
                "description": blog.get('description', ''),
                "datePublished": blog.get('created_at', '').isoformat() if blog.get('created_at') else '',
                "dateModified": blog.get('updated_at', '').isoformat() if blog.get('updated_at') else '',
                "author": {
                    "@type": "Person",
                    "name": blog.get('author', '')
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "FlexForge",
                    "logo": {
                        "@type": "ImageObject",
                        "url": f"{settings.BASE_URL}/static/img/logo.png"
                    }
                },
                "mainEntityOfPage": self.get_canonical_url(**kwargs),
                "keywords": blog.get('tags', []),
                "articleSection": blog.get('category', 'Technology'),
                "wordCount": len(' '.join(str(item.get('text', '')) for item in blog.get('content', []))),
            }
        return super().get_schema_data(**kwargs)
```

### Project SEO Mixins

```python
class ProjectsListSEOMixin(BaseSEOMixin):
    """SEO mixin for projects listing page."""
    
    def get_seo_title(self, **kwargs):
        return "Developer Projects Portfolio | Web Development Showcase | FlexForge"
    
    def get_seo_description(self, **kwargs):
        return "Explore a comprehensive portfolio of web development projects, featuring Django applications, React interfaces, and modern software solutions."

class ProjectDetailSEOMixin(BaseSEOMixin):
    """SEO mixin for individual project pages."""
    
    def get_seo_title(self, **kwargs):
        project = kwargs.get('project')
        if project:
            return f"{project['title']} | Project Portfolio | FlexForge"
        return super().get_seo_title(**kwargs)
    
    def get_schema_data(self, **kwargs):
        project = kwargs.get('project')
        if project:
            schema_data = {
                "@type": "CreativeWork",
                "name": project.get('title', ''),
                "description": project.get('headline', ''),
                "creator": {
                    "@type": "Person",
                    "name": "Your Name"
                },
                "keywords": project.get('tags', []),
            }
            
            # Add URLs if available
            if project.get('demo_url'):
                schema_data['url'] = project['demo_url']
            
            if project.get('github_url'):
                schema_data['codeRepository'] = project['github_url']
                
            return schema_data
        return super().get_schema_data(**kwargs)
```

## Meta Tag Management

### SEO Manager

```python
# apps/seo/manager.py
class SEOManager:
    """
    Central manager for SEO operations and data generation.
    """
    
    @staticmethod
    def generate_meta_tags(seo_data):
        """Generate HTML meta tags from SEO data."""
        tags = []
        
        # Basic meta tags
        if seo_data.get('title'):
            tags.append(f'<title>{seo_data["title"]}</title>')
        
        if seo_data.get('description'):
            tags.append(f'<meta name="description" content="{seo_data["description"]}">')
        
        if seo_data.get('keywords'):
            keywords = ', '.join(seo_data['keywords']) if isinstance(seo_data['keywords'], list) else seo_data['keywords']
            tags.append(f'<meta name="keywords" content="{keywords}">')
        
        # Canonical URL
        if seo_data.get('url'):
            tags.append(f'<link rel="canonical" href="{seo_data["url"]}">')
        
        # Open Graph tags
        og_tags = SEOManager._generate_og_tags(seo_data)
        tags.extend(og_tags)
        
        # Twitter Card tags
        twitter_tags = SEOManager._generate_twitter_tags(seo_data)
        tags.extend(twitter_tags)
        
        return tags
    
    @staticmethod
    def _generate_og_tags(seo_data):
        """Generate Open Graph meta tags."""
        og_tags = []
        
        if seo_data.get('title'):
            og_tags.append(f'<meta property="og:title" content="{seo_data["title"]}">')
        
        if seo_data.get('description'):
            og_tags.append(f'<meta property="og:description" content="{seo_data["description"]}">')
        
        if seo_data.get('image'):
            og_tags.append(f'<meta property="og:image" content="{seo_data["image"]}">')
        
        if seo_data.get('url'):
            og_tags.append(f'<meta property="og:url" content="{seo_data["url"]}">')
        
        og_type = seo_data.get('type', 'website')
        og_tags.append(f'<meta property="og:type" content="{og_type}">')
        
        return og_tags
    
    @staticmethod
    def _generate_twitter_tags(seo_data):
        """Generate Twitter Card meta tags."""
        twitter_tags = [
            '<meta name="twitter:card" content="summary_large_image">'
        ]
        
        if seo_data.get('title'):
            twitter_tags.append(f'<meta name="twitter:title" content="{seo_data["title"]}">')
        
        if seo_data.get('description'):
            twitter_tags.append(f'<meta name="twitter:description" content="{seo_data["description"]}">')
        
        if seo_data.get('image'):
            twitter_tags.append(f'<meta name="twitter:image" content="{seo_data["image"]}">')
        
        return twitter_tags
    
    @staticmethod
    def generate_structured_data(schema_data):
        """Generate JSON-LD structured data."""
        if not schema_data:
            return ""
        
        # Add context if not present
        if '@context' not in schema_data:
            schema_data['@context'] = 'https://schema.org'
        
        import json
        return json.dumps(schema_data, indent=2)
```

### Template Integration

```html
<!-- templates/components/seo.html -->
{% load seo_tags %}

<!-- Basic meta tags -->
{% if seo.title %}
    <title>{{ seo.title }}</title>
{% endif %}

{% if seo.description %}
    <meta name="description" content="{{ seo.description }}">
{% endif %}

{% if seo.keywords %}
    <meta name="keywords" content="{% if seo.keywords|is_list %}{{ seo.keywords|join:', ' }}{% else %}{{ seo.keywords }}{% endif %}">
{% endif %}

<!-- Canonical URL -->
{% if seo.url %}
    <link rel="canonical" href="{{ seo.url }}">
{% endif %}

<!-- Open Graph tags -->
{% if seo.title %}
    <meta property="og:title" content="{{ seo.title }}">
{% endif %}

{% if seo.description %}
    <meta property="og:description" content="{{ seo.description }}">
{% endif %}

{% if seo.image %}
    <meta property="og:image" content="{{ seo.image }}">
{% endif %}

{% if seo.url %}
    <meta property="og:url" content="{{ seo.url }}">
{% endif %}

<meta property="og:type" content="{{ seo.type|default:'website' }}">

<!-- Twitter Card tags -->
<meta name="twitter:card" content="summary_large_image">
{% if seo.title %}
    <meta name="twitter:title" content="{{ seo.title }}">
{% endif %}

{% if seo.description %}
    <meta name="twitter:description" content="{{ seo.description }}">
{% endif %}

{% if seo.image %}
    <meta name="twitter:image" content="{{ seo.image }}">
{% endif %}

<!-- Structured data -->
{% if seo.schema %}
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        {% for key, value in seo.schema.items %}
            "{{ key }}": {% if value|is_dict or value|is_list %}{{ value|jsonify }}{% else %}"{{ value }}"{% endif %}{% if not forloop.last %},{% endif %}
        {% endfor %}
    }
    </script>
{% endif %}
```

## Structured Data Implementation

### Schema Generator

```python
# apps/seo/schema.py
class SchemaGenerator:
    """
    Generator for Schema.org structured data.
    """
    
    @staticmethod
    def generate_website_schema(site_data):
        """Generate Website schema."""
        return {
            "@type": "WebSite",
            "name": site_data.get('name', 'FlexForge'),
            "url": site_data.get('url', ''),
            "description": site_data.get('description', ''),
            "author": {
                "@type": "Person",
                "name": site_data.get('author_name', '')
            },
            "potentialAction": {
                "@type": "SearchAction",
                "target": f"{site_data.get('url', '')}/search?q={{search_term_string}}",
                "query-input": "required name=search_term_string"
            }
        }
    
    @staticmethod
    def generate_person_schema(person_data):
        """Generate Person schema for about page."""
        schema = {
            "@type": "Person",
            "name": person_data.get('name', ''),
            "jobTitle": person_data.get('title', ''),
            "description": person_data.get('description', ''),
            "url": person_data.get('website', ''),
            "image": person_data.get('image', ''),
        }
        
        # Add social profiles
        social_links = person_data.get('social_links', {})
        if social_links:
            schema['sameAs'] = [url for url in social_links.values() if url]
        
        # Add contact information
        if person_data.get('email'):
            schema['email'] = person_data['email']
        
        if person_data.get('location'):
            schema['address'] = {
                "@type": "PostalAddress",
                "addressLocality": person_data['location']
            }
        
        return schema
    
    @staticmethod
    def generate_article_schema(article_data):
        """Generate Article schema for blog posts."""
        return {
            "@type": "BlogPosting",
            "headline": article_data.get('title', ''),
            "description": article_data.get('description', ''),
            "datePublished": article_data.get('created_at', ''),
            "dateModified": article_data.get('updated_at', ''),
            "author": {
                "@type": "Person",
                "name": article_data.get('author', '')
            },
            "publisher": {
                "@type": "Organization",
                "name": "FlexForge",
                "logo": {
                    "@type": "ImageObject",
                    "url": article_data.get('publisher_logo', '')
                }
            },
            "mainEntityOfPage": article_data.get('url', ''),
            "keywords": article_data.get('tags', []),
        }
    
    @staticmethod
    def generate_creative_work_schema(work_data):
        """Generate CreativeWork schema for projects."""
        return {
            "@type": "CreativeWork",
            "name": work_data.get('title', ''),
            "description": work_data.get('description', ''),
            "creator": {
                "@type": "Person",
                "name": work_data.get('creator', '')
            },
            "dateCreated": work_data.get('created_at', ''),
            "keywords": work_data.get('tags', []),
            "url": work_data.get('demo_url', ''),
            "codeRepository": work_data.get('github_url', ''),
        }
```

## Sitemap Generation

### Dynamic Sitemap System

```python
# apps/seo/sitemaps.py
from django.contrib.sitemaps import Sitemap
from django.urls import reverse
from django.utils import timezone
from apps.data.data_service import DataService

class StaticViewSitemap(Sitemap):
    """Sitemap for static pages."""
    priority = 0.8
    changefreq = 'weekly'
    
    def items(self):
        return [
            'home', 'about', 'contact', 'privacy_policy',
            'blog', 'projects', 'dashboard'
        ]
    
    def location(self, item):
        return reverse(item)
    
    def lastmod(self, item):
        # You can customize last modification dates per page
        return timezone.now()

class BlogSitemap(Sitemap):
    """Sitemap for blog posts."""
    priority = 0.7
    changefreq = 'monthly'
    
    def items(self):
        return DataService.get_blogs()
    
    def location(self, item):
        from django.utils.text import slugify
        return reverse('blog_detail', args=[slugify(item['title'])])
    
    def lastmod(self, item):
        return item.get('updated_at') or item.get('created_at')
    
    def priority(self, item):
        # Higher priority for featured posts
        return 0.9 if item.get('is_featured') else 0.7

class ProjectSitemap(Sitemap):
    """Sitemap for projects."""
    priority = 0.8
    changefreq = 'monthly'
    
    def items(self):
        return DataService.get_projects()
    
    def location(self, item):
        from django.utils.text import slugify
        return reverse('projects_detail', args=[slugify(item['title'])])
    
    def lastmod(self, item):
        # Use completion date or current time
        if item.get('completion_date'):
            from datetime import datetime
            return datetime.strptime(item['completion_date'], '%Y-%m')
        return timezone.now()
    
    def priority(self, item):
        # Higher priority for featured projects
        return 1.0 if item.get('featured') else 0.8

# Sitemap index
sitemaps = {
    'static': StaticViewSitemap,
    'blog': BlogSitemap,
    'projects': ProjectSitemap,
}
```

### Sitemap URL Configuration

```python
# In main urls.py
from django.contrib.sitemaps.views import sitemap
from apps.seo.sitemaps import sitemaps

urlpatterns = [
    # ... other URLs
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps}, name='sitemap'),
    path('sitemap-<section>.xml', sitemap, {'sitemaps': sitemaps}, name='sitemap-section'),
]
```

## Social Media Optimization

### Open Graph Enhancement

```python
# Enhanced Open Graph data generation
class OpenGraphOptimizer:
    """
    Optimizer for Open Graph meta tags.
    """
    
    @staticmethod
    def generate_og_data(content_type, content_data, request):
        """Generate comprehensive Open Graph data."""
        base_data = {
            'og:site_name': 'FlexForge',
            'og:locale': 'en_US',
        }
        
        if content_type == 'blog_post':
            return {
                **base_data,
                'og:type': 'article',
                'og:title': content_data.get('title', ''),
                'og:description': content_data.get('description', '')[:200],
                'og:image': OpenGraphOptimizer._get_blog_image(content_data),
                'og:url': request.build_absolute_uri(),
                'article:author': content_data.get('author', ''),
                'article:published_time': content_data.get('created_at', ''),
                'article:modified_time': content_data.get('updated_at', ''),
                'article:section': content_data.get('category', ''),
                'article:tag': content_data.get('tags', []),
            }
        
        elif content_type == 'project':
            return {
                **base_data,
                'og:type': 'website',
                'og:title': content_data.get('title', ''),
                'og:description': content_data.get('headline', '')[:200],
                'og:image': OpenGraphOptimizer._get_project_image(content_data),
                'og:url': request.build_absolute_uri(),
            }
        
        return base_data
    
    @staticmethod
    def _get_blog_image(blog_data):
        """Get optimized image for blog post."""
        images = blog_data.get('images', {})
        
        # Priority: main-hero > hero > first image
        for key in ['main-hero.webp', 'hero.webp']:
            if key in images:
                return images[key]
        
        # Return first available image
        return next(iter(images.values()), '')
    
    @staticmethod
    def _get_project_image(project_data):
        """Get optimized image for project."""
        images = project_data.get('images', {})
        return images.get('main_image', '')
```

### Twitter Card Optimization

```python
class TwitterCardOptimizer:
    """
    Optimizer for Twitter Card meta tags.
    """
    
    @staticmethod
    def generate_twitter_data(content_type, content_data):
        """Generate Twitter Card data."""
        base_data = {
            'twitter:card': 'summary_large_image',
            'twitter:site': '@your_twitter_handle',
        }
        
        if content_type == 'blog_post':
            return {
                **base_data,
                'twitter:title': content_data.get('title', ''),
                'twitter:description': content_data.get('description', '')[:200],
                'twitter:image': TwitterCardOptimizer._get_twitter_image(content_data),
                'twitter:creator': f"@{content_data.get('username', '')}",
            }
        
        elif content_type == 'project':
            return {
                **base_data,
                'twitter:title': content_data.get('title', ''),
                'twitter:description': content_data.get('headline', '')[:200],
                'twitter:image': TwitterCardOptimizer._get_project_twitter_image(content_data),
            }
        
        return base_data
    
    @staticmethod
    def _get_twitter_image(content_data):
        """Get Twitter-optimized image."""
        # Twitter prefers 1200x628 images
        return OpenGraphOptimizer._get_blog_image(content_data)
    
    @staticmethod
    def _get_project_twitter_image(content_data):
        """Get Twitter-optimized project image."""
        return OpenGraphOptimizer._get_project_image(content_data)
```

## Google Analytics Integration

### Analytics Configuration

```python
# apps/seo/analytics.py
class GoogleAnalyticsIntegration:
    """
    Google Analytics 4 integration.
    """
    
    @staticmethod
    def get_ga_config():
        """Get Google Analytics configuration."""
        return {
            'measurement_id': getattr(settings, 'GA_MEASUREMENT_ID', ''),
            'enabled': getattr(settings, 'ENABLE_ANALYTICS', False),
            'debug_mode': getattr(settings, 'GA_DEBUG_MODE', False),
        }
    
    @staticmethod
    def generate_ga_script(measurement_id):
        """Generate Google Analytics script tags."""
        return f'''
        <!-- Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id={measurement_id}"></script>
        <script>
            window.dataLayer = window.dataLayer || [];
            function gtag(){{dataLayer.push(arguments);}}
            gtag('js', new Date());
            gtag('config', '{measurement_id}', {{
                page_title: document.title,
                page_location: window.location.href
            }});
        </script>
        '''
    
    @staticmethod
    def track_event(event_name, parameters=None):
        """Generate event tracking code."""
        if parameters is None:
            parameters = {}
        
        import json
        return f'''
        <script>
            gtag('event', '{event_name}', {json.dumps(parameters)});
        </script>
        '''
```

### Performance Tracking

```python
class PerformanceTracker:
    """
    Web performance tracking utilities.
    """
    
    @staticmethod
    def get_core_web_vitals_script():
        """Generate Core Web Vitals tracking script."""
        return '''
        <script>
            // Core Web Vitals tracking
            import {getCLS, getFID, getFCP, getLCP, getTTFB} from 'web-vitals';
            
            function sendToAnalytics(metric) {
                gtag('event', metric.name, {
                    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                    event_category: 'Web Vitals',
                    event_label: metric.id,
                    non_interaction: true,
                });
            }
            
            getCLS(sendToAnalytics);
            getFID(sendToAnalytics);
            getFCP(sendToAnalytics);
            getLCP(sendToAnalytics);
            getTTFB(sendToAnalytics);
        </script>
        '''
    
    @staticmethod
    def track_page_load_time():
        """Track page load performance."""
        return '''
        <script>
            window.addEventListener('load', function() {
                const loadTime = performance.now();
                gtag('event', 'page_load_time', {
                    value: Math.round(loadTime),
                    event_category: 'Performance',
                });
            });
        </script>
        '''
```

## SEO Management Commands

### SEO Management Command

```python
# apps/seo/management/commands/seo_manage.py
from django.core.management.base import BaseCommand
from django.test import Client
from django.urls import reverse
from apps.data.content_manager import ContentManager
from django.utils.text import slugify

class Command(BaseCommand):
    help = 'SEO management and validation tools'
    
    def __init__(self):
        super().__init__()
        self.client = Client()
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--check-meta',
            action='store_true',
            help='Check meta tags on all pages',
        )
        parser.add_argument(
            '--validate-urls',
            nargs='+',
            help='Validate specific URLs',
        )
        parser.add_argument(
            '--generate-sitemap',
            action='store_true',
            help='Generate and validate sitemap',
        )
        parser.add_argument(
            '--audit-seo',
            action='store_true',
            help='Comprehensive SEO audit',
        )
    
    def handle(self, *args, **options):
        if options['check_meta']:
            self.check_meta_tags()
        
        if options['validate_urls']:
            self.validate_specific_pages(options['validate_urls'])
        
        if options['generate_sitemap']:
            self.validate_sitemap()
        
        if options['audit_seo']:
            self.comprehensive_seo_audit()
    
    def check_meta_tags(self):
        """Check meta tags on all pages."""
        self.stdout.write('Checking meta tags...')
        
        # Import here to avoid circular imports
        from apps.data.content_manager import ContentManager
        
        # Basic static pages
        test_pages = [
            ('/', 'Home'),
            ('/about/', 'About'),
            ('/dashboard/', 'Dashboard'),
            ('/blog/', 'Blog List'),
            ('/projects/', 'Projects List'),
            ('/contact/', 'Contact'),
            ('/privacy-policy/', 'Privacy Policy'),
        ]
        
        # Add sample blog detail pages (first 3 blogs)
        try:
            blogs = ContentManager.get_blogs()[:3]
            for blog in blogs:
                slug = slugify(blog['title'])
                test_pages.append((f'/blog/{slug}/', f'Blog: {blog["title"][:30]}...'))
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'Could not load blog pages: {e}')
            )
        
        # Add sample project detail pages (first 3 projects)
        try:
            projects = ContentManager.get_projects()[:3]
            for project in projects:
                slug = slugify(project['title'])
                test_pages.append((f'/projects/{slug}/', f'Project: {project["title"][:30]}...'))
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f'Could not load project pages: {e}')
            )
        
        for url, name in test_pages:
            self.validate_page_seo(url, name)
    
    def validate_page_seo(self, url, page_name):
        """Validate SEO elements for a specific page."""
        try:
            response = self.client.get(url)
            if response.status_code == 200:
                content = response.content.decode('utf-8')
                
                # Check for essential meta tags
                meta_checks = {
                    'Title': '<title>' in content and not '<title></title>' in content,
                    'Description': 'name="description"' in content,
                    'Canonical': 'rel="canonical"' in content,
                    'Open Graph': 'property="og:' in content,
                    'Twitter Card': 'name="twitter:' in content,
                    'Structured Data': 'application/ld+json' in content,
                }
                
                # Results
                passed = sum(meta_checks.values())
                total = len(meta_checks)
                
                if passed == total:
                    self.stdout.write(
                        self.style.SUCCESS(f'✓ {page_name} ({url}) - All checks passed')
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(f'⚠ {page_name} ({url}) - {passed}/{total} checks passed')
                    )
                    
                    # Show failed checks
                    for check, result in meta_checks.items():
                        if not result:
                            self.stdout.write(f'  - Missing: {check}')
                            
            else:
                self.stdout.write(
                    self.style.ERROR(f'✗ {page_name} ({url}) - HTTP {response.status_code}')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ {page_name} ({url}) - Error: {e}')
            )
    
    def validate_specific_pages(self, pages):
        """Validate specific pages by URL path."""
        self.stdout.write(
            self.style.SUCCESS(f'🔍 Validating {len(pages)} specific pages...\n')
        )
        
        for url in pages:
            # Ensure URL starts with /
            if not url.startswith('/'):
                url = '/' + url
            
            # Handle trailing slash logic
            static_pages_needing_slash = ['/dashboard', '/blog', '/projects', '/about', '/contact', '/privacy-policy']
            is_blog_detail = url.startswith('/blog/') and url != '/blog/' and len(url) > 6
            is_project_detail = url.startswith('/projects/') and url != '/projects/' and len(url) > 10
            
            if url == '/':
                pass
            elif is_blog_detail or is_project_detail:
                if url.endswith('/'):
                    url = url.rstrip('/')
            elif any(url.startswith(page) for page in static_pages_needing_slash):
                if not url.endswith('/'):
                    url = url + '/'
            
            self.validate_page_seo(url, f'Custom URL: {url}')
    
    def comprehensive_seo_audit(self):
        """Run comprehensive SEO audit."""
        self.stdout.write(self.style.SUCCESS('🔍 Running comprehensive SEO audit...\n'))
        
        # Check all pages
        self.check_meta_tags()
        
        # Validate sitemap
        self.validate_sitemap()
        
        # Check robots.txt
        self.check_robots_txt()
        
        # Performance suggestions
        self.performance_suggestions()
    
    def validate_sitemap(self):
        """Validate sitemap generation."""
        self.stdout.write('Validating sitemap...')
        
        try:
            response = self.client.get('/sitemap.xml')
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS('✓ Sitemap accessible'))
                
                # Check sitemap content
                content = response.content.decode('utf-8')
                if '<urlset' in content or '<sitemapindex' in content:
                    self.stdout.write(self.style.SUCCESS('✓ Valid sitemap format'))
                else:
                    self.stdout.write(self.style.WARNING('⚠ Sitemap format may be invalid'))
                    
            else:
                self.stdout.write(
                    self.style.ERROR(f'✗ Sitemap not accessible - HTTP {response.status_code}')
                )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Sitemap error: {e}'))
    
    def check_robots_txt(self):
        """Check robots.txt file."""
        self.stdout.write('Checking robots.txt...')
        
        try:
            response = self.client.get('/robots.txt')
            if response.status_code == 200:
                content = response.content.decode('utf-8')
                if 'Sitemap:' in content:
                    self.stdout.write(self.style.SUCCESS('✓ robots.txt includes sitemap'))
                else:
                    self.stdout.write(self.style.WARNING('⚠ robots.txt missing sitemap reference'))
                    
                self.stdout.write(self.style.SUCCESS('✓ robots.txt accessible'))
            else:
                self.stdout.write(
                    self.style.ERROR(f'✗ robots.txt not accessible - HTTP {response.status_code}')
                )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ robots.txt error: {e}'))
    
    def performance_suggestions(self):
        """Provide performance optimization suggestions."""
        self.stdout.write('\n📊 Performance Suggestions:')
        
        suggestions = [
            '• Ensure all images are in WebP format for better compression',
            '• Implement lazy loading for images below the fold',
            '• Use CDN for static assets and images',
            '• Enable gzip compression on your server',
            '• Minimize CSS and JavaScript files',
            '• Implement proper caching headers',
            '• Use preload hints for critical resources',
            '• Consider implementing Service Worker for caching',
        ]
        
        for suggestion in suggestions:
            self.stdout.write(suggestion)
```

## Configuration

### SEO Settings

```python
# apps/seo/config.py
from django.conf import settings

class SEOConfig:
    """SEO configuration settings."""
    
    # Basic SEO settings
    SITE_NAME = getattr(settings, 'SEO_SITE_NAME', 'FlexForge')
    SITE_DESCRIPTION = getattr(settings, 'SEO_SITE_DESCRIPTION', 
                              'Advanced Developer Portfolio Platform')
    DEFAULT_IMAGE = getattr(settings, 'SEO_DEFAULT_IMAGE', 
                           f"{settings.BASE_URL}/static/img/og-default.webp")
    
    # Social media
    TWITTER_HANDLE = getattr(settings, 'SEO_TWITTER_HANDLE', '')
    FACEBOOK_APP_ID = getattr(settings, 'SEO_FACEBOOK_APP_ID', '')
    
    # Analytics
    GA_MEASUREMENT_ID = getattr(settings, 'GA_MEASUREMENT_ID', '')
    ENABLE_ANALYTICS = getattr(settings, 'ENABLE_ANALYTICS', False)
    
    # Structured data
    ENABLE_STRUCTURED_DATA = getattr(settings, 'ENABLE_STRUCTURED_DATA', True)
    ORGANIZATION_NAME = getattr(settings, 'SEO_ORGANIZATION_NAME', 'FlexForge')
    
    # Performance
    ENABLE_PRELOAD_HINTS = getattr(settings, 'ENABLE_PRELOAD_HINTS', True)
    ENABLE_DNS_PREFETCH = getattr(settings, 'ENABLE_DNS_PREFETCH', True)
```

### Environment Variables

```env
# SEO Configuration
SEO_SITE_NAME="Your Portfolio Name"
SEO_SITE_DESCRIPTION="Your portfolio description"
SEO_TWITTER_HANDLE="your_twitter"
SEO_FACEBOOK_APP_ID="your_facebook_app_id"

# Analytics
GA_MEASUREMENT_ID="G-XXXXXXXXXX"
ENABLE_ANALYTICS=True

# Performance
ENABLE_STRUCTURED_DATA=True
ENABLE_PRELOAD_HINTS=True
```

## Best Practices

### SEO Content Guidelines
1. **Unique titles**: Each page should have a unique, descriptive title
2. **Meta descriptions**: Write compelling descriptions under 160 characters
3. **Heading hierarchy**: Use proper H1-H6 structure
4. **Alt text**: Provide descriptive alt text for all images
5. **Internal linking**: Link between related content

### Technical SEO
1. **Clean URLs**: Use descriptive, keyword-rich URLs
2. **Canonical tags**: Prevent duplicate content issues
3. **Structured data**: Implement Schema.org markup
4. **Mobile optimization**: Ensure mobile-friendly design
5. **Page speed**: Optimize for fast loading times

### Content Strategy
1. **Keyword research**: Target relevant keywords naturally
2. **Quality content**: Focus on valuable, original content
3. **Regular updates**: Keep content fresh and updated
4. **User experience**: Prioritize user experience over SEO tricks
5. **Analytics monitoring**: Track and analyze SEO performance

## Troubleshooting

### Common Issues

#### Meta Tags Not Appearing
**Problem**: SEO meta tags not showing in page source
**Solution**:
1. Ensure SEO mixin is properly inherited
2. Check template includes SEO component
3. Verify context data is passed correctly

#### Structured Data Errors
**Problem**: Schema.org validation errors
**Solution**:
1. Test with Google's Rich Results Test
2. Validate JSON-LD syntax
3. Ensure required properties are present

#### Sitemap Issues
**Problem**: Sitemap not generating or accessible
**Solution**:
1. Check URL configuration
2. Verify sitemap classes are properly defined
3. Test with `/sitemap.xml` URL

### Debug Commands

```bash
# Run SEO audit
python manage.py seo_manage --audit-seo

# Check specific pages
python manage.py seo_manage --validate-urls "/" "/blog/" "/projects/"

# Check meta tags
python manage.py seo_manage --check-meta

# Test sitemap
python manage.py seo_manage --generate-sitemap
```

The SEO app provides comprehensive search engine optimization capabilities, ensuring that the FlexForge platform achieves excellent search engine visibility, social media sharing optimization, and performance monitoring to maintain high search rankings and user engagement.