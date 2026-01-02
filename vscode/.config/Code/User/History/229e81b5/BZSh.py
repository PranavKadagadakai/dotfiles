from django.db import models

class AuditLog(models.Model):
    ACTION_RESULT_CHOICES = (
        ('SUCCESS', 'Success'),
        ('FAILURE', 'Failure'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=50)
    entity_id = models.IntegerField(null=True, blank=True)
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    changes_made = models.JSONField(null=True, blank=True)
    action_result = models.CharField(max_length=20, choices=ACTION_RESULT_CHOICES, null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} on {self.entity_type} ({self.action_result})"


class SessionToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='session_tokens')
    token_hash = models.CharField(max_length=255, unique=True)
    issued_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.CharField(max_length=45, null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'session_tokens'
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.expires_at <= self.issued_at:
            raise ValidationError('Expiry must be after issue time')
    
    def __str__(self):
        return f"Token for {self.user} (expires: {self.expires_at})"