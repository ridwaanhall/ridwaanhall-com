"""
Custom Error Handlers for ridwaanhall.com
Provides professional error handling for 4xx and 5xx HTTP status codes.
Optimized for Vercel deployment - uses console logging only.
"""

import logging
from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings

# Configure logging for Vercel (console only)
logger = logging.getLogger(__name__)

def get_base_context():
    """Get base context data for error pages."""
    try:
        # Import here to avoid circular imports
        from apps.seo.manager import SEOManager
        from apps.data.about_data import AboutData
        
        about_data = AboutData.get_about_data()[0]
        seo_manager = SEOManager(about_data)
        return {
            'about_data': about_data,
            'seo_manager': seo_manager,
        }
    except Exception as e:
        logger.error(f"Error getting base context: {e}")
        # Return safe defaults if data loading fails
        return {
            'about_data': {
                'name': 'Ridwan Halim',
                'social_media': {
                    'email': '',
                    'linkedin': ''
                }
            },
            'seo_manager': None,
        }

def is_ajax_request(request):
    """Check if the request is an AJAX request."""
    return (
        request.headers.get('X-Requested-With') == 'XMLHttpRequest' or
        request.headers.get('Content-Type') == 'application/json' or
        'json' in request.headers.get('Accept', '').lower()
    )

def handler400(request, exception=None):
    """Handle 400 Bad Request errors."""
    context = get_base_context()
    context.update({
        'error_code': 400,
        'error_title': 'Bad Request',
        'error_message': 'Your request seems to be malformed. Please check your input and try again.',
        'show_contact': True,
    })
    
    # Log the error for debugging
    logger.warning(f"400 Bad Request: {request.path} - {exception}")
    
    if is_ajax_request(request):
        return JsonResponse({
            'error': True,
            'status_code': 400,
            'message': context['error_message'],
        }, status=400)
    
    return render(request, 'errors/error.html', context, status=400)

def handler403(request, exception=None):
    """Handle 403 Forbidden errors."""
    context = get_base_context()
    context.update({
        'error_code': 403,
        'error_title': 'Access Forbidden',
        'error_message': 'You don\'t have permission to access this resource. If you believe this is an error, please contact us.',
        'show_contact': True,
    })
      # Log the error for security monitoring
    try:
        user_info = getattr(request, 'user', None)
        username = getattr(user_info, 'username', 'Anonymous') if user_info else 'Anonymous'
    except:
        username = 'Anonymous'
    logger.warning(f"403 Forbidden: {request.path} - User: {username} - {exception}")
    
    if is_ajax_request(request):
        return JsonResponse({
            'error': True,
            'status_code': 403,
            'message': context['error_message'],
        }, status=403)
    
    return render(request, 'errors/error.html', context, status=403)

def handler404(request, exception=None):
    """Handle 404 Not Found errors."""
    context = get_base_context()
    context.update({
        'error_code': 404,
        'error_title': 'Page Not Found',
        'error_message': 'Sorry, the page you are looking for doesn\'t seem to exist or may have been moved.',
        'show_search': True,
        'show_popular_pages': True,
    })
    
    # Log 404 for analytics (but don't spam logs in production)
    if settings.DEBUG:
        logger.info(f"404 Not Found: {request.path}")
    
    if is_ajax_request(request):
        return JsonResponse({
            'error': True,
            'status_code': 404,
            'message': context['error_message'],
        }, status=404)
    
    return render(request, 'errors/error.html', context, status=404)

def handler500(request):
    """Handle 500 Internal Server Error."""
    context = get_base_context()
    context.update({
        'error_code': 500,
        'error_title': 'Internal Server Error',
        'error_message': 'Something went wrong on our end. We\'re working to fix it. Please try again later.',
        'show_contact': True,
        'show_retry': True,
    })
      # Log the error for immediate attention
    try:
        user_info = getattr(request, 'user', None)
        username = getattr(user_info, 'username', 'Anonymous') if user_info else 'Anonymous'
    except:
        username = 'Anonymous'
    logger.error(f"500 Internal Server Error: {request.path} - User: {username}")
    
    if is_ajax_request(request):
        return JsonResponse({
            'error': True,
            'status_code': 500,
            'message': context['error_message'],
        }, status=500)
    
    try:
        return render(request, 'errors/error.html', context, status=500)
    except Exception as e:
        # Fallback if even error template fails - create minimal HTML response
        logger.critical(f"Error template failed: {e}")
        from django.http import HttpResponse
        fallback_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>500 - Internal Server Error</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }}
                .error-container {{ max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                h1 {{ color: #e74c3c; margin-bottom: 20px; }}
                .btn {{ display: inline-block; padding: 10px 20px; background: #3498db; color: white; text-decoration: none; border-radius: 4px; margin: 10px; }}
            </style>
        </head>
        <body>
            <div class="error-container">
                <h1>500 - Internal Server Error</h1>
                <p>Something went wrong on our end. We're working to fix it.</p>
                <a href="/" class="btn">Go to Homepage</a>
                <a href="javascript:history.back()" class="btn">Go Back</a>
            </div>
        </body>
        </html>
        """
        return HttpResponse(fallback_html, status=500)

def handler502(request):
    """Handle 502 Bad Gateway errors."""
    context = get_base_context()
    context.update({
        'error_code': 502,
        'error_title': 'Bad Gateway',
        'error_message': 'The server received an invalid response. This is usually temporary. Please try again in a few moments.',
        'show_retry': True,
    })
    
    logger.error(f"502 Bad Gateway: {request.path}")
    
    if is_ajax_request(request):
        return JsonResponse({
            'error': True,
            'status_code': 502,
            'message': context['error_message'],
        }, status=502)
    
    return render(request, 'errors/error.html', context, status=502)

def handler503(request):
    """Handle 503 Service Unavailable errors."""
    context = get_base_context()
    context.update({
        'error_code': 503,
        'error_title': 'Service Unavailable',
        'error_message': 'The service is temporarily unavailable due to maintenance or high load. Please try again later.',
        'show_retry': True,
        'show_maintenance': True,
    })
    
    logger.warning(f"503 Service Unavailable: {request.path}")
    
    if is_ajax_request(request):
        return JsonResponse({
            'error': True,
            'status_code': 503,
            'message': context['error_message'],
        }, status=503)
    
    return render(request, 'errors/error.html', context, status=503)

def handler504(request):
    """Handle 504 Gateway Timeout errors."""
    context = get_base_context()
    context.update({
        'error_code': 504,
        'error_title': 'Gateway Timeout',
        'error_message': 'The server took too long to respond. This might be a temporary issue. Please try again.',
        'show_retry': True,
    })
    
    logger.error(f"504 Gateway Timeout: {request.path}")
    
    if is_ajax_request(request):
        return JsonResponse({
            'error': True,
            'status_code': 504,
            'message': context['error_message'],
        }, status=504)
    
    return render(request, 'errors/error.html', context, status=504)
