"""
Error Handling Middleware for ridwaanhall.com
Provides enhanced error processing and logging for better user experience.
Optimized for Vercel deployment.
"""

import logging
import time
from django.http import JsonResponse
from django.shortcuts import render
from django.conf import settings
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)

class ErrorHandlingMiddleware(MiddlewareMixin):
    """
    Middleware to enhance error handling and provide better error responses.
    """
    
    def process_exception(self, request, exception):
        """
        Process unhandled exceptions and provide appropriate responses.
        """
        # Log the exception with context
        error_info = {
            'path': request.path,
            'method': request.method,
            'user': getattr(request.user, 'username', 'Anonymous') if hasattr(request, 'user') else 'Unknown',
            'user_agent': request.META.get('HTTP_USER_AGENT', 'Unknown'),
            'remote_addr': self.get_client_ip(request),
            'exception_type': type(exception).__name__,
            'exception_message': str(exception),
        }
        
        logger.error(f"Unhandled exception: {error_info}")
        
        # For AJAX requests, return JSON error
        if self.is_ajax_request(request):
            return JsonResponse({
                'error': True,
                'status_code': 500,
                'message': 'An unexpected error occurred. Please try again.',
                'debug_info': str(exception) if settings.DEBUG else None,
            }, status=500)
        
        # For regular requests, let Django's error handlers take over
        return None
    
    def process_response(self, request, response):
        """
        Process responses to add security headers and error handling.
        """
        # Add custom headers for error responses
        if response.status_code >= 400:
            response['X-Error-Handled'] = 'True'
            response['X-Timestamp'] = str(int(time.time()))
            
            # Add retry headers for temporary errors
            if response.status_code in [502, 503, 504]:
                response['Retry-After'] = '60'  # Suggest retry after 60 seconds
        
        return response
    
    @staticmethod
    def get_client_ip(request):
        """Get the real client IP address."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # Take the first IP in the chain (original client)
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', 'Unknown')
        return ip
    
    @staticmethod
    def is_ajax_request(request):
        """Check if the request is an AJAX request."""
        return (
            request.headers.get('X-Requested-With') == 'XMLHttpRequest' or
            request.headers.get('Content-Type') == 'application/json' or
            'json' in request.headers.get('Accept', '').lower()
        )


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware to add security headers to all responses.
    """
    
    def process_response(self, request, response):
        """Add security headers to the response."""
        # Only add headers if not already present
        security_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
        }
        
        # Add HSTS header only in production with HTTPS
        if not settings.DEBUG and request.is_secure():
            security_headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
        
        for header, value in security_headers.items():
            if header not in response:
                response[header] = value
        
        return response


class PerformanceMiddleware(MiddlewareMixin):
    """
    Middleware to track performance and add timing headers.
    """
    
    def process_request(self, request):
        """Mark the start time of request processing."""
        request._start_time = time.time()
    
    def process_response(self, request, response):
        """Add performance timing headers."""
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            response['X-Response-Time'] = f"{duration:.3f}s"
            
            # Log slow requests
            if duration > 2.0:  # Log requests taking more than 2 seconds
                logger.warning(f"Slow request: {request.path} took {duration:.3f}s")
        
        return response
