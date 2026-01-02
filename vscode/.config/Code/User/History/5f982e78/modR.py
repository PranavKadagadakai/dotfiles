from django.db import models
from django.core.exceptions import ValidationError

class AICTECategory(models.Model):
    category_name = models.CharField(max_length=100, unique=True)
    category_code = models.CharField(max_length=20, unique=True)
    category_description = models.TextField(null=True, blank=True)
    min_points_required = models.IntegerField(null=True, blank=True)
    max_points_allowed = models.IntegerField(null=True, blank=True)
    validation_rules = models.JSONField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'aicte_categories'
        verbose_name_plural = 'AICTE Categories'
    
    def __str__(self):
        return f"{self.category_name} ({self.category_code})"


class EventAICTEConfig(models.Model):
    event = models.OneToOneField('events.Event', on_delete=models.CASCADE, related_name='aicte_config')
    category = models.ForeignKey(AICTECategory, on_delete=models.PROTECT)
    points_allocated = models.IntegerField()
    requires_mentor_approval = models.BooleanField(default=True)
    auto_approve_after_days = models.IntegerField(default=7)
    
    class Meta:
        db_table = 'event_aicte_config'
    
    def clean(self):
        if self.points_allocated <= 0:
            raise ValidationError('Points allocated must be positive')
    
    def __str__(self):
        return f"{self.event} - {self.category} ({self.points_allocated} points)"


class AICTEPointTransaction(models.Model):
    TRANSACTION_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('OVERRIDDEN', 'Overridden'),
    )
    
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='point_transactions')
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, related_name='point_transactions')
    category = models.ForeignKey(AICTECategory, on_delete=models.PROTECT)
    points_allocated = models.IntegerField()
    transaction_status = models.CharField(max_length=20, choices=TRANSACTION_STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey('mentors.Mentor', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_transactions')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    override_reason = models.TextField(null=True, blank=True)
    overridden_by = models.ForeignKey('mentors.Mentor', on_delete=models.SET_NULL, null=True, blank=True, related_name='overridden_transactions')
    overridden_at = models.DateTimeField(null=True, blank=True)
    original_points = models.IntegerField(null=True, blank=True)
    transaction_date = models.DateTimeField(auto_now_add=True)
    auto_approved = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'aicte_point_transactions'
        unique_together = ('student', 'event')
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['event']),
            models.Index(fields=['transaction_status']),
        ]
    
    def __str__(self):
        return f"{self.student} - {self.event} ({self.points_allocated} points)"


class AICTEPointsLedger(models.Model):
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='points_ledger')
    category = models.ForeignKey(AICTECategory, on_delete=models.PROTECT)
    semester = models.IntegerField()
    academic_year = models.CharField(max_length=20)
    total_points = models.IntegerField(default=0)
    pending_points = models.IntegerField(default=0)
    approved_points = models.IntegerField(default=0)
    rejected_points = models.IntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'aicte_points_ledger'
        unique_together = ('student', 'category', 'semester', 'academic_year')
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.student} - {self.category} - Sem {self.semester} ({self.total_points} points)"