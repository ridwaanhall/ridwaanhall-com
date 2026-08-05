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


