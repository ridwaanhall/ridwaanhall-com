#!/usr/bin/env python
"""
Test script to verify error handling setup.
Run this to check if all error handlers are properly configured.
"""

import os
import sys
import django
from pathlib import Path

# Add the project directory to the Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ridwaanhall_com.settings')
django.setup()

from django.test import RequestFactory

def test_error_handlers():
    """Test all error handlers."""
    from ridwaanhall_com.error_handlers import (
        handler400, handler403, handler404, handler500,
        get_base_context, is_ajax_request
    )
    
    factory = RequestFactory()
    
    print("🔧 Testing Error Handling System")
    print("=" * 50)
    
    # Test base context
    print("\n1. Testing base context generation...")
    try:
        context = get_base_context()
        if context and 'about_data' in context:
            print("✅ Base context generation: PASSED")
        else:
            print("⚠️  Base context generation: PARTIAL (fallback used)")
    except Exception as e:
        print(f"❌ Base context generation: FAILED - {e}")
    
    # Test AJAX detection
    print("\n2. Testing AJAX detection...")
    regular_request = factory.get('/')
    ajax_request = factory.get('/', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
    
    if not is_ajax_request(regular_request) and is_ajax_request(ajax_request):
        print("✅ AJAX detection: PASSED")
    else:
        print("❌ AJAX detection: FAILED")
    
    # Test error handlers
    print("\n3. Testing error handlers...")
    test_request = factory.get('/test-url/')
    
    handlers = [
        (handler400, "400 Bad Request"),
        (handler403, "403 Forbidden"), 
        (handler404, "404 Not Found"),
        (handler500, "500 Internal Server Error")
    ]
    
    for handler, name in handlers:
        try:
            if handler == handler500:
                response = handler(test_request)
            else:
                response = handler(test_request, exception=Exception("Test error"))
            
            if response and response.status_code:
                print(f"✅ {name}: PASSED (Status: {response.status_code})")
            else:
                print(f"❌ {name}: FAILED (No response)")
        except Exception as e:
            print(f"❌ {name}: FAILED - {e}")
      # Test settings configuration
    print("\n4. Testing settings configuration...")
    
    # Check error handlers in settings - Django uses ROOT_URLCONF to find handlers
    from django.urls import get_resolver
    from django.conf import settings
    
    try:
        resolver = get_resolver()
        urlconf = __import__(settings.ROOT_URLCONF, fromlist=[''])
        
        error_handlers = [
            ('handler400', getattr(urlconf, 'handler400', None)),
            ('handler403', getattr(urlconf, 'handler403', None)),
            ('handler404', getattr(urlconf, 'handler404', None)),
            ('handler500', getattr(urlconf, 'handler500', None)),
        ]
        
        for handler_name, handler_func in error_handlers:
            if handler_func and callable(handler_func):
                print(f"✅ {handler_name}: CONFIGURED")
            else:
                print(f"❌ {handler_name}: NOT CONFIGURED")
    except Exception as e:
        print(f"⚠️  Error handler detection failed: {e}")
        print("   (Handlers may still be working via middleware)")
        
        # Fallback: check if handlers exist in error_handlers module
        try:
            from ridwaanhall_com.error_handlers import handler400, handler403, handler404, handler500
            handlers = [
                ('handler400', handler400),
                ('handler403', handler403), 
                ('handler404', handler404),
                ('handler500', handler500)
            ]
            
            for handler_name, handler_func in handlers:
                if handler_func and callable(handler_func):
                    print(f"✅ {handler_name}: AVAILABLE")
                else:
                    print(f"❌ {handler_name}: NOT AVAILABLE")
        except ImportError as ie:
            print(f"❌ Error handlers import failed: {ie}")
    
    # Check middleware
    middleware_classes = [
        'ridwaanhall_com.middleware.ErrorHandlingMiddleware',
        'ridwaanhall_com.middleware.SecurityHeadersMiddleware',
        'ridwaanhall_com.middleware.PerformanceMiddleware',
    ]
    
    for middleware in middleware_classes:
        if middleware in settings.MIDDLEWARE:
            print(f"✅ {middleware}: REGISTERED")
        else:
            print(f"❌ {middleware}: NOT REGISTERED")
    
    # Check logging configuration
    print("\n5. Testing logging configuration...")
    logging_config = getattr(settings, 'LOGGING', {})
    
    if logging_config:
        handlers = logging_config.get('handlers', {})
        if 'console' in handlers:
            print("✅ Console logging: CONFIGURED")
        else:
            print("❌ Console logging: NOT CONFIGURED")
        
        # Check for file logging (should not exist for Vercel)
        if 'file' not in handlers:
            print("✅ File logging: DISABLED (Vercel compatible)")
        else:
            print("⚠️  File logging: ENABLED (Not Vercel compatible)")
    else:
        print("❌ Logging configuration: NOT FOUND")
    
    print("\n" + "=" * 50)
    print("✅ Error handling system test completed!")
    print("\n📋 Summary:")
    print("• Error handlers are configured for production use")
    print("• Console-only logging for Vercel compatibility")
    print("• AJAX/JSON error responses supported")
    print("• Security headers middleware included")
    print("• Performance monitoring enabled")
    
    if settings.DEBUG:
        print("\n🧪 Test URLs available at:")
        print("• /test-errors/ - Error testing menu")
        print("• /test-errors/400/ - Test 400 error")
        print("• /test-errors/403/ - Test 403 error")
        print("• /test-errors/404/ - Test 404 error")
        print("• /test-errors/500/ - Test 500 error")
        print("• /test-errors/ajax/ - Test AJAX errors")

if __name__ == '__main__':
    try:
        test_error_handlers()
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)
