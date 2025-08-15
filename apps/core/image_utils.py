"""
Image utilities for handling WSRV image optimization.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
"""

from django.conf import settings
from urllib.parse import urlencode


def get_optimized_image_url(image_url, width=None, height=None, format_type=None):
    """
    Returns an optimized image URL using WSRV.nl if enabled, otherwise returns the original URL.
    
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
    """
    Returns the current status of WSRV image optimization.
    
    Returns:
        bool: True if WSRV optimization is enabled, False otherwise
    """
    return getattr(settings, 'WSRV_IMAGE_OPTIMIZATION', True)
