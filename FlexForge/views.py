"""
Root level views for handling global application functionality.
Includes catch-all 404 handling and favicon serving.
"""

import os
import logging
from django.shortcuts import render
from django.http import FileResponse

logger = logging.getLogger(__name__)


def _render_404(request):
    """Render the shared 404 error page."""
    return render(request, 'error.html', {'error_code': 404}, status=404)


def custom_404_view(request, exception):
    """
    Custom 404 error handler.
    Provides consistent error page rendering for non-existent URLs.
    """
    return _render_404(request)


def favicon_view(request):
    """
    Serve favicon.ico file with proper error handling.
    Falls back to 404 error page if favicon is not found.
    """
    try:
        favicon_path = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'staticfiles', 'favicon', 'favicon.ico'
        )

        if os.path.exists(favicon_path):
            return FileResponse(open(favicon_path, 'rb'))
        else:
            logger.warning("Favicon file not found at expected path")

    except OSError as e:
        logger.error(f"Error serving favicon: {e}")

    # Return 404 if favicon cannot be served
    return _render_404(request)