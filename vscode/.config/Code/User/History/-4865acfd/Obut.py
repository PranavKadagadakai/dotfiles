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
            # Remove the X-Frame-Options header for media files to allow framing
            response['X-Frame-Options'] = 'SAMEORIGIN'

        return response
