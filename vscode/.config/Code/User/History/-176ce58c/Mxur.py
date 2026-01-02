from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

class Hall(models.Model):
    hall_name = models.CharField(max_length=100, unique=True)
    hall_code = models.CharField(max_length=20, unique=True)
    location = models.CharField(max_length=200, null=True, blank=True)
    capacity = models.IntegerField()
    facilities = models.TextField(null=True, blank=True)  # JSON array
    description = models.TextField(null=True, blank=True)
    is_available = models.BooleanField(default=True)
    requires_approval = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'halls'
    
    def __str__(self):
        return f"{self.hall_name} ({self.hall_code})"


class HallBooking(models.Model):
    BOOKING_STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('CANCELLED', 'Cancelled'),
        ('COMPLETED', 'Completed'),
    )
    
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='bookings')
    event = models.ForeignKey('events.Event', on_delete=models.CASCADE, null=True, blank=True, related_name='hall_bookings')
    booked_by = models.ForeignKey('clubs.ClubMember', on_delete=models.PROTECT)
    booking_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    setup_buffer_minutes = models.IntegerField(default=30)
    cleanup_buffer_minutes = models.IntegerField(default=15)
    booking_status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default='PENDING')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_bookings')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(null=True, blank=True)
    cancellation_reason = models.TextField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'hall_bookings'
        indexes = [
            models.Index(fields=['hall']),
            models.Index(fields=['event']),
            models.Index(fields=['booking_date']),
            models.Index(fields=['booking_status']),
            models.Index(fields=['booking_date', 'start_time', 'end_time']),
        ]
    
    def clean(self):
        if self.end_time <= self.start_time:
            raise ValidationError('End time must be after start time')
    
    def __str__(self):
        return f"{self.hall} - {self.booking_date} ({self.start_time}-{self.end_time})"