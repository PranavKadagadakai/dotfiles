from django.db import models
from django.conf import settings

class Student(models.Model):
    GENDER_CHOICES = (
        ('MALE', 'Male'),
        ('FEMALE', 'Female'),
        ('OTHER', 'Other'),
    )
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='student_profile')
    usn = models.CharField(max_length=20, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=15, null=True, blank=True)
    department = models.CharField(max_length=100, null=True, blank=True)
    semester = models.IntegerField(null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    profile_photo_url = models.CharField(max_length=500, null=True, blank=True)
    mentor = models.ForeignKey('mentors.Mentor', on_delete=models.SET_NULL, null=True, blank=True, related_name='mentees')
    max_event_registrations = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'students'
        indexes = [
            models.Index(fields=['usn']),
            models.Index(fields=['user']),
            models.Index(fields=['mentor']),
        ]
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.usn})"