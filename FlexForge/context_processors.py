"""
Context processors for FlexForge project.
Makes certain settings available in all templates.

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
"""

from django.conf import settings


def feature_flags(request):
    """
    Context processor to make feature flags available in templates.
    """
    guestbook_enabled = getattr(settings, 'GUESTBOOK_PAGE', True)
    wsrv_enabled = getattr(settings, 'WSRV_IMAGE_OPTIMIZATION', True)
    return {
        'GUESTBOOK_PAGE': guestbook_enabled,
        'AUTHENTICATION_ENABLED': guestbook_enabled,  # Auth is only enabled when guestbook is enabled
        'WSRV_IMAGE_OPTIMIZATION': wsrv_enabled,
    }
