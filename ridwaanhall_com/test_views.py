"""
Test views for error handling system.
These views are used to test different error scenarios.
Only available in DEBUG mode for security.
"""

from django.shortcuts import render
from django.http import JsonResponse, Http404
from django.conf import settings
from django.core.exceptions import PermissionDenied
from django.views.decorators.http import require_http_methods


def test_404_error(request):
    """Test 404 error handling."""
    if not settings.DEBUG:
        raise Http404("Page not found")
    raise Http404("This is a test 404 error")


def test_403_error(request):
    """Test 403 error handling."""
    if not settings.DEBUG:
        raise PermissionDenied("Access denied")
    raise PermissionDenied("This is a test 403 error")


def test_500_error(request):
    """Test 500 error handling."""
    if not settings.DEBUG:
        raise Exception("Internal server error")
    raise Exception("This is a test 500 error")


def test_400_error(request):
    """Test 400 error handling."""
    if not settings.DEBUG:
        from django.http import HttpResponseBadRequest
        return HttpResponseBadRequest("Bad request")
    
    from django.http import HttpResponseBadRequest
    return HttpResponseBadRequest("This is a test 400 error")


@require_http_methods(["GET"])
def test_ajax_error(request):
    """Test AJAX error handling."""
    if not settings.DEBUG:
        return JsonResponse({"error": "Not available in production"}, status=403)
    
    error_type = request.GET.get('type', '500')
    
    if error_type == '404':
        raise Http404("AJAX 404 test error")
    elif error_type == '403':
        raise PermissionDenied("AJAX 403 test error")
    elif error_type == '400':
        return JsonResponse({"error": "AJAX 400 test error"}, status=400)
    else:
        raise Exception("AJAX 500 test error")


def error_test_menu(request):
    """Show error testing menu (only in DEBUG mode)."""
    if not settings.DEBUG:
        raise Http404("Not available in production")
    
    return render(request, 'test_errors.html', {
        'title': 'Error Testing Menu',
        'debug_mode': settings.DEBUG,
    })
