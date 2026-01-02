from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone

class Event(models.Model):
    EVENT_STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('ONGOING', 'Ongoing'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    
    club = models.ForeignKey('clubs.Club', on_delete=models.CASCADE, related_name='events')
    event_name = models.CharField(max_length=200)
    event_description = models.TextField(null=True, blank=True)
    event_type = models.CharField(max_length=50, null=True, blank=True)
    event_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(null=True, blank=True)
    max_participants = models.IntegerField(null=True, blank=True)
    registration_deadline = models.DateTimeField(null=True, blank=True)
    venue_details = models.CharField(max_length=200, null=True, blank=True)
    banner_image_url = models.CharField(max_length=500, null=True, blank=True)
    created_by = models.ForeignKey('clubs.ClubMember', on_delete=models.PROTECT, related_name='created_events')
    last_edited_by = models.ForeignKey('clubs.ClubMember', on_delete=models.SET_NULL, null=True, blank=True, related_name='edited_events')
    last_edited_at = models.DateTimeField(null=True, blank=True)
    event_status = models.CharField(max_length=20, choices=EVENT_STATUS_CHOICES, default='DRAFT')
    event_started_at = models.DateTimeField(null=True, blank=True)
    event_ended_at = models.DateTimeField(null=True, blank=True)
    started_by = models.ForeignKey('clubs.ClubMember', on_delete=models.SET_NULL, null=True, blank=True, related_name='started_events')
    ended_by = models.ForeignKey('clubs.ClubMember', on_delete=models.SET_NULL, null=True, blank=True, related_name='ended_events')
    cancellation_reason = models.TextField(null=True, blank=True)
    cancelled_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_events')
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'events'
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['event_date']),
            models.Index(fields=['event_status']),
            models.Index(fields=['event_type']),
        ]
    
    def __str__(self):
        return f"{self.event_name} - {self.club}"


class EventEditHistory(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='edit_history')
    edited_by = models.ForeignKey('clubs.ClubMember', on_delete=models.PROTECT)
    field_changed = models.CharField(max_length=100)
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)
    change_reason = models.TextField(null=True, blank=True)
    edited_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'event_edit_history'
    
    def __str__(self):
        return f"{self.event} - {self.field_changed} changed at {self.edited_at}"


class EventRegistration(models.Model):
    REGISTRATION_STATUS_CHOICES = (
        ('REGISTERED', 'Registered'),
        ('WAITLISTED', 'Waitlisted'),
        ('CANCELLED', 'Cancelled'),
        ('ATTENDED', 'Attended'),
    )
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='event_registrations')
    registration_date = models.DateTimeField(auto_now_add=True)
    registration_status = models.CharField(max_length=20, choices=REGISTRATION_STATUS_CHOICES, default='REGISTERED')
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(null=True, blank=True)
    waitlist_position = models.IntegerField(null=True, blank=True)
    promoted_from_waitlist_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'event_registrations'
        unique_together = ('event', 'student')
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['student']),
            models.Index(fields=['registration_status']),
        ]
    
    def __str__(self):
        return f"{self.student} - {self.event}"


class Attendance(models.Model):
    ATTENDANCE_STATUS_CHOICES = (
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
    )
    
    MARKING_METHOD_CHOICES = (
        ('MANUAL', 'Manual'),
        ('QR_CODE', 'QR Code'),
        ('BIOMETRIC', 'Biometric'),
    )
    
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='attendance_records')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='attendance_records')
    attendance_status = models.CharField(max_length=20, choices=ATTENDANCE_STATUS_CHOICES)
    check_in_time = models.DateTimeField(null=True, blank=True)
    marked_by = models.ForeignKey('clubs.ClubMember', on_delete=models.PROTECT)
    marked_at = models.DateTimeField(auto_now_add=True)
    marking_method = models.CharField(max_length=20, choices=MARKING_METHOD_CHOICES, null=True, blank=True)
    remarks = models.TextField(null=True, blank=True)
    
    class Meta:
        db_table = 'attendance'
        unique_together = ('event', 'student')
        indexes = [
            models.Index(fields=['event']),
            models.Index(fields=['student']),
        ]
    
    def __str__(self):
        return f"{self.student} - {self.event} - {self.attendance_status}"