from .models import AuditLog
import json

class AuditLoggingMiddleware:
    """
    Middleware to log user actions for audit purposes.
    """
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        response = self.get_response(request)
        
        # Log only authenticated users' actions
        if request.user.is_authenticated:
            # Log state-changing operations
            if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                self.log_action(request, response)
        
        return response
    
    def log_action(self, request, response):
        """
        Create audit log entry.
        """
        try:
            AuditLog.objects.create(
                user=request.user,
                action=request.method,
                entity_type=request.path.split('/')[2] if len(request.path.split('/')) > 2 else 'UNKNOWN',
                ip_address=self.get_client_ip(request),
                user_agent=request.META.get('HTTP_USER_AGENT', ''),
                action_result='SUCCESS' if 200 <= response.status_code < 300 else 'FAILURE',
                changes_made={'path': request.path, 'method': request.method}
            )
        except Exception as e:
            # Don't let audit logging break the request
            print(f"Audit logging failed: {e}")
    
    def get_client_ip(self, request):
        """
        Get client IP address from request.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip