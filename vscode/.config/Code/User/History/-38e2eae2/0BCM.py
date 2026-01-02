from django.db import models
import uuid

class CertificateTemplate(models.Model):
    PAGE_SIZE_CHOICES = (
        ('A4', 'A4'),
        ('LETTER', 'Letter'),
    )
    
    ORIENTATION_CHOICES = (
        ('PORTRAIT', 'Portrait'),
        ('LANDSCAPE', 'Landscape'),
    )
    
    club = models.ForeignKey('clubs.Club', on_delete=models.CASCADE, related_name='certificate_templates')
    template_name = models.CharField(max_length=100)
    template_description = models.TextField(null=True, blank=True)
    html_content = models.TextField()
    css_content = models.TextField(null=True, blank=True)
    background_image_url = models.CharField(max_length=500, null=True, blank=True)
    template_variables = models.JSONField(null=True, blank=True)
    page_size = models.CharField(max_length=20, choices=PAGE_SIZE_CHOICES, default='A4')
    orientation = models.CharField(max_length=20, choices=ORIENTATION_CHOICES, default='LANDSCAPE')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey('clubs.ClubMember', on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'certificate_templates'
    
    def __str__(self):
        return f"{self.template_name} - {self.club}"


class Certificate(models.Model):
    certificate_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='certificates')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='certificates')
    template = models.ForeignKey(CertificateTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    certificate_number = models.CharField(max_length=50, unique=True)
    certificate_file_path = models.CharField(max_length=500)
    certificate_file_hash = models.CharField(max_length=255, null=True, blank=True)
    qr_code_data = models.TextField()
    issue_date = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey('clubs.ClubMember', on_delete=models.SET_NULL, null=True, blank=True)
    email_sent = models.BooleanField(default=False)
    email_sent_at = models.DateTimeField(null=True, blank=True)
    download_count = models.IntegerField(default=0)
    last_downloaded_at = models.DateTimeField(null=True, blank=True)
    is_revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='revoked_certificates')
    revocation_reason = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'certificates'
        unique_together = ('event', 'student')
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['student']),
            models.Index(fields=['certificate_number']),
        ]
    
    def __str__(self):
        return f"{self.certificate_number} - {self.student}"