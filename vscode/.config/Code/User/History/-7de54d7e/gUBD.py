from django.db import models

class NotificationTemplate(models.Model):
    NOTIFICATION_TYPE_CHOICES = (
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('IN_APP', 'In-App'),
    )
    
    template_name = models.CharField(max_length=100, unique=True)
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE_CHOICES)
    event_trigger = models.CharField(max_length=100)
    subject_template = models.CharField(max_length=200, null=True, blank=True)
    body_template = models.TextField()
    template_variables = models.JSONField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_templates'
    
    def __str__(self):
        return f"{self.template_name} ({self.notification_type})"


class Notification(models.Model):
    NOTIFICATION_TYPE_CHOICES = (
        ('INFO', 'Info'),
        ('SUCCESS', 'Success'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=200)
    message = models.TextField()
    action_url = models.CharField(max_length=500, null=True, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'notifications'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['is_read']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.title}"


class EmailQueue(models.Model):
    EMAIL_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('RETRY', 'Retry'),
    )
    
    recipient_email = models.EmailField()
    subject = models.CharField(max_length=200)
    body_html = models.TextField()
    body_text = models.TextField(null=True, blank=True)
    attachment_paths = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=EMAIL_STATUS_CHOICES, default='PENDING')
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'email_queue'
        indexes = [
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.recipient_email} - {self.subject} ({self.status})"


class NotificationPreference(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    email_enabled = models.BooleanField(default=True)
    sms_enabled = models.BooleanField(default=False)
    in_app_enabled = models.BooleanField(default=True)
    event_reminders = models.BooleanField(default=True)
    registration_confirmations = models.BooleanField(default=True)
    certificate_notifications = models.BooleanField(default=True)
    point_approval_notifications = models.BooleanField(default=True)
    booking_notifications = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'notification_preferences'
    
    def __str__(self):
        return f"Preferences for {self.user}"