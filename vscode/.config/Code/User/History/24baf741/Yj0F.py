from django.db import models

class SystemConfig(models.Model):
    CONFIG_TYPE_CHOICES = (
        ('STRING', 'String'),
        ('INTEGER', 'Integer'),
        ('BOOLEAN', 'Boolean'),
        ('JSON', 'JSON'),
    )
    
    config_key = models.CharField(max_length=100, unique=True)
    config_value = models.TextField()
    config_type = models.CharField(max_length=20, choices=CONFIG_TYPE_CHOICES)
    description = models.TextField(null=True, blank=True)
    is_public = models.BooleanField(default=False)
    last_modified_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_config'
    
    def __str__(self):
        return f"{self.config_key}: {self.config_value}"


class AcademicCalendar(models.Model):
    academic_year = models.CharField(max_length=20)
    semester = models.IntegerField()
    semester_start_date = models.DateField()
    semester_end_date = models.DateField()
    exam_start_date = models.DateField(null=True, blank=True)
    exam_end_date = models.DateField(null=True, blank=True)
    vacation_start_date = models.DateField(null=True, blank=True)
    vacation_end_date = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'academic_calendar'
        unique_together = ('academic_year', 'semester')
    
    def __str__(self):
        return f"{self.academic_year} - Semester {self.semester}"