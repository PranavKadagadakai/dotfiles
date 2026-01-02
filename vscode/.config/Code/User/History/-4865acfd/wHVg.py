from django.conf import settings


class FrameOptionsMiddleware:
    """
    Middleware to remove X-Frame-Options header for media files to allow
    certificate previews in iframes for mentor dashboard.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Check if this is a media file request (certificate files, etc.)
        if hasattr(request, 'path') and request.path.startswith(settings.MEDIA_URL):
            # Allow framing for media files (certificates, etc.)
            if 'X-Frame-Options' in response:
                del response['X-Frame-Options']
        elif hasattr(request, 'path') and request.path.startswith('/api/'):
            # For API endpoints, allow same-origin framing
            response['X-Frame-Options'] = 'SAMEORIGIN'
        else:
            # Set DENY for other pages
            response['X-Frame-Options'] = 'DENY'

        return response
