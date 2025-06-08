"""
SEO Template Tags
Django template tags for easy SEO integration in templates.
"""

from django import template
from django.utils.safestring import mark_safe
import json
from datetime import datetime, date

register = template.Library()


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle datetime objects."""
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        return super().default(obj)


@register.inclusion_tag('seo/meta_tags.html')
def render_seo_meta(seo_data, request=None):
    """Render all SEO meta tags."""
    return {
        'seo': seo_data,
        'request': request
    }


@register.simple_tag
def render_schema(schemas):
    """Render JSON-LD schema markup."""
    if not schemas:
        return ''
    
    schema_scripts = []
    for schema in schemas:
        if schema:
            schema_json = json.dumps(schema, indent=2, ensure_ascii=False, cls=DateTimeEncoder)
            schema_scripts.append(f'<script type="application/ld+json">\n{schema_json}\n</script>')
    
    return mark_safe('\n'.join(schema_scripts))


@register.filter
def get_meta_title(seo_data, fallback=''):
    """Get meta title with fallback."""
    return seo_data.get('title', fallback)


@register.filter  
def get_meta_description(seo_data, fallback=''):
    """Get meta description with fallback."""
    return seo_data.get('description', fallback)


@register.filter
def get_canonical_url(seo_data, request=None):
    """Get canonical URL."""
    if request:
        return request.build_absolute_uri()
    return seo_data.get('canonical_url', '')


@register.simple_tag
def breadcrumb_schema(breadcrumbs):
    """Generate breadcrumb schema markup."""
    if not breadcrumbs:
        return ''
    
    schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": i + 1,
                "name": crumb.get('name', ''),
                "item": crumb.get('url', '')
            }
            for i, crumb in enumerate(breadcrumbs)
        ]
    }
    
    schema_json = json.dumps(schema, indent=2, ensure_ascii=False, cls=DateTimeEncoder)
    return mark_safe(f'<script type="application/ld+json">\n{schema_json}\n</script>')


@register.filter
def truncate_description(description, length=160):
    """Truncate description to specified length."""
    if len(description) <= length:
        return description
    return description[:length-3] + '...'
