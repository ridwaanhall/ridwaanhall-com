"""
Template tags for optimized static file loading.
Provides template tags to load bundled CSS and JS files.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
Created at: July 16, 2025
"""

import json
import os
from pathlib import Path
from django import template
from django.conf import settings
from django.templatetags.static import static
from django.utils.safestring import mark_safe

register = template.Library()


@register.simple_tag
def bundle_css(bundle_name):
    """Load a CSS bundle with cache busting."""
    return _load_bundle(bundle_name, 'css')


@register.simple_tag
def bundle_js(bundle_name):
    """Load a JS bundle with cache busting."""
    return _load_bundle(bundle_name, 'js')


@register.simple_tag
def bundle_css_link(bundle_name):
    """Generate a CSS link tag for a bundle."""
    url = bundle_css(bundle_name)
    if url:
        return mark_safe(f'<link rel="stylesheet" href="{url}" />')
    return ''


@register.simple_tag
def bundle_js_script(bundle_name, defer=True):
    """Generate a script tag for a bundle."""
    url = bundle_js(bundle_name)
    if url:
        defer_attr = ' defer' if defer else ''
        return mark_safe(f'<script{defer_attr} src="{url}"></script>')
    return ''


def _load_bundle(bundle_name, file_type):
    """Load bundle URL with cache busting."""
    try:
        static_root = Path(settings.STATIC_ROOT) if hasattr(settings, 'STATIC_ROOT') else Path(settings.BASE_DIR) / 'staticfiles'
        manifest_path = static_root / 'bundles' / 'manifest.json'
        
        if manifest_path.exists():
            with open(manifest_path, 'r') as f:
                manifest = json.load(f)
            
            bundle_key = f"{bundle_name}.{file_type}" if not bundle_name.endswith(f'.{file_type}') else bundle_name
            
            if bundle_key in manifest:
                versioned_file = manifest[bundle_key]['versioned']
                return static(f'bundles/{versioned_file}')
        
        # Fallback to regular bundle file
        bundle_file = f"{bundle_name}.{file_type}" if not bundle_name.endswith(f'.{file_type}') else bundle_name
        bundle_path = static_root / 'bundles' / bundle_file
        
        if bundle_path.exists():
            return static(f'bundles/{bundle_file}')
        
        # If bundle doesn't exist, return None to allow fallback
        return None
        
    except Exception:
        # If anything goes wrong, return None to allow fallback
        return None


@register.simple_tag
def load_static_fallback(*files):
    """Load individual static files as fallback."""
    output = []
    for file_path in files:
        if file_path.endswith('.css'):
            output.append(f'<link rel="stylesheet" href="{static(file_path)}" />')
        elif file_path.endswith('.js'):
            output.append(f'<script defer src="{static(file_path)}"></script>')
    return mark_safe('\n'.join(output))


@register.simple_tag
def bundle_exists(bundle_name, file_type):
    """Check if a bundle exists."""
    try:
        static_root = Path(settings.STATIC_ROOT) if hasattr(settings, 'STATIC_ROOT') else Path(settings.BASE_DIR) / 'staticfiles'
        bundle_file = f"{bundle_name}.{file_type}" if not bundle_name.endswith(f'.{file_type}') else bundle_name
        bundle_path = static_root / 'bundles' / bundle_file
        return bundle_path.exists()
    except Exception:
        return False
