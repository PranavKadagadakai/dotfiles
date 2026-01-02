from django.db import models

class EventReport(models.Model):
    event = models.OneToOneField('events.Event', on_delete=models.CASCADE, related_name='report')
    total_registered = models.IntegerField(default=0)
    total_waitlisted = models.IntegerField(default=0)
    total_attended = models.IntegerField(default=0)
    total_absent = models.IntegerField(default=0)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    certificates_generated = models.IntegerField(default=0)
    points_allocated = models.IntegerField(default=0)
    report_generated_by = models.ForeignKey('clubs.ClubMember', on_delete=models.SET_NULL, null=True, blank=True)
    report_generated_at = models.DateTimeField(auto_now_add=True)
    report_file_path = models.CharField(max_length=500, null=True, blank=True)
    
    class Meta:
        db_table = 'event_reports'
    
    def __str__(self):
        return f"Report for {self.event}"


class SystemAnalytics(models.Model):
    METRIC_CATEGORY_CHOICES = (
        ('EVENTS', 'Events'),
        ('USERS', 'Users'),
        ('BOOKINGS', 'Bookings'),
        ('CERTIFICATES', 'Certificates'),
        ('POINTS', 'Points'),
    )
    
    metric_name = models.CharField(max_length=100)
    metric_value = models.DecimalField(max_digits=15, decimal_places=2)
    metric_category = models.CharField(max_length=50, choices=METRIC_CATEGORY_CHOICES, null=True, blank=True)
    measurement_date = models.DateField()
    metadata = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'system_analytics'
    
    def __str__(self):
        return f"{self.metric_name}: {self.metric_value} on {self.measurement_date}"