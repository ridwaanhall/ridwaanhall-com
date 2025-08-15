"""
Template filters for image processing.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
"""

from django import template
from apps.core.image_utils import get_optimized_image_url

register = template.Library()


@register.filter
def wsrv_image(image_url, dimensions=None):
    """
    Template filter to apply WSRV image optimization.
    
    Usage:
        {{ image_url|wsrv_image }}
        {{ image_url|wsrv_image:"300x300" }}
        {{ image_url|wsrv_image:"300" }}  # width only
    
    Args:
        image_url (str): The original image URL
        dimensions (str, optional): Dimensions in format "widthxheight", "width", or "xheight"
    
    Returns:
        str: The optimized image URL or original URL based on settings
    """
    if not image_url:
        return ""
    
    width = None
    height = None
    
    if dimensions:
        # Parse dimensions string
        if 'x' in dimensions:
            parts = dimensions.split('x')
            if parts[0]:  # width specified
                try:
                    width = int(parts[0])
                except ValueError:
                    pass
            if len(parts) > 1 and parts[1]:  # height specified
                try:
                    height = int(parts[1])
                except ValueError:
                    pass
        else:
            # Only width specified
            try:
                width = int(dimensions)
            except ValueError:
                pass
    
    return get_optimized_image_url(image_url, width=width, height=height)


@register.simple_tag
def wsrv_img(image_url, width=None, height=None, format_type=None):
    """
    Template tag for more flexible WSRV image optimization.
    
    Usage:
        {% wsrv_img image_url width=300 height=300 %}
        {% wsrv_img image_url width=300 %}
        {% wsrv_img image_url height=300 format_type="webp" %}
    
    Args:
        image_url (str): The original image URL
        width (int, optional): The desired width
        height (int, optional): The desired height
        format_type (str, optional): The desired format
    
    Returns:
        str: The optimized image URL or original URL based on settings
    """
    return get_optimized_image_url(image_url, width=width, height=height, format_type=format_type)
