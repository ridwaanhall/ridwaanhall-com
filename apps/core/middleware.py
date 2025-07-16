"""
Middleware for optimizing static file serving.
Adds cache headers for bundled static files.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
Created at: July 16, 2025
"""

from django.utils.cache import patch_cache_control


class StaticFilesCacheMiddleware:
    """Middleware to add cache headers for static files."""
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Add cache headers for bundled static files
        if (request.path.startswith('/static/bundles/') and 
            response.status_code == 200):
            
            # Cache bundled files for 1 year since they have cache-busting hashes
            if any(x in request.path for x in ['.css', '.js']):
                patch_cache_control(
                    response,
                    max_age=31536000,  # 1 year
                    immutable=True,
                    public=True
                )
        
        # Add shorter cache for other static files
        elif (request.path.startswith('/static/') and 
              response.status_code == 200 and
              any(request.path.endswith(ext) for ext in ['.css', '.js', '.woff', '.woff2'])):
            
            patch_cache_control(
                response,
                max_age=86400,  # 1 day
                public=True
            )
        
        return response
