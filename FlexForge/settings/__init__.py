"""
Django settings package for FlexForge project.

This package contains environment-specific settings configurations.
Settings are automatically loaded based on the DJANGO_ENVIRONMENT variable.

Available environments:
- development (default)
- production
- staging
- testing

Author: Ridwan Halim (ridwaanhall.com)
License: Apache License 2.0
"""

import os
from decouple import config

# Determine which settings module to use based on environment
ENVIRONMENT = config('DJANGO_ENVIRONMENT', default='development')

if ENVIRONMENT == 'production':
    from .production import *
elif ENVIRONMENT == 'staging':
    from .staging import *
elif ENVIRONMENT == 'testing':
    from .testing import *
else:
    from .development import *

# Make environment available for debugging
DJANGO_ENVIRONMENT = ENVIRONMENT