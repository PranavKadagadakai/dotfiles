# BackEnd/CertifyTrack/settings/development.py
from .base import *
import importlib

DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# Use console email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Try to enable django-debug-toolbar only if it's installed.
try:
    importlib.import_module('debug_toolbar')
except ImportError:
    # debug_toolbar is not installed in this environment; skip adding it.
    DEBUG_TOOLBAR_AVAILABLE = False
else:
    DEBUG_TOOLBAR_AVAILABLE = True

if DEBUG_TOOLBAR_AVAILABLE:
    # Only append if the package exists
    INSTALLED_APPS += [
        'debug_toolbar',
    ]

    MIDDLEWARE = [
        'debug_toolbar.middleware.DebugToolbarMiddleware',
    ] + MIDDLEWARE  # add toolbar middleware early

    INTERNAL_IPS = [
        '127.0.0.1',
        'localhost',
    ]

# Optional: enable other dev-only settings here (email console, local static/media)
