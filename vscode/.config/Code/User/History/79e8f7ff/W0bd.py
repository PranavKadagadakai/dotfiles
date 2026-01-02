import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.timezone import now

# ============================================
# USER MANAGEMENT MODELS
# ============================================

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('student', 'Student'),
        ('mentor', 'Mentor'),
        ('club_organizer', 'Club Organizer'),
        ('admin', 'Admin'),
    )
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='student')
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True, null=True)
    password_reset_token = models.CharField(max_length=255, blank=True, null=True)
    password_reset_expires = models.DateTimeField(blank=True, null=True)
    failed_login_attempts = models.IntegerField(default=0)
    account_locked_until = models.DateTimeField(blank=True, null=True)

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    usn = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    semester = models.IntegerField()
    mentor = models.ForeignKey('Mentor', on_delete=models.SET_NULL, null=True, blank=True, related_name='mentees')

class Mentor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mentor_profile')
    employee_id = models.CharField(max_length=20, unique=True)
    department = models.CharField(max_length=100)
    designation = models.CharField(max_length=100)

# ============================================
# CLUB MANAGEMENT MODELS
# ============================================

class Club(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    faculty_coordinator = models.ForeignKey(Mentor, on_delete=models.SET_NULL, null=True, blank=True, related_name='coordinated_clubs')
    club_head = models.ForeignKey(Student, on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_clubs')
    established_date = models.DateField(blank=True, null=True)
    is_active = models.BooleanField(default=True)

class ClubRole(models.Model):
    name = models.CharField(max_length=50, unique=True)
    can_create_events = models.BooleanField(default=False)
    can_edit_events = models.BooleanField(default=False)
    can_delete_events = models.BooleanField(default=False)
    can_start_events = models.BooleanField(default=False)
    can_end_events = models.BooleanField(default=False)
    can_mark_attendance = models.BooleanField(default=False)
    can_manage_bookings = models.BooleanField(default=False)
    can_upload_templates = models.BooleanField(default=False)
    can_generate_certificates = models.BooleanField(default=False)
    can_view_reports = models.BooleanField(default=False)

class ClubMember(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='members')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='club_memberships')
    role = models.ForeignKey(ClubRole, on_delete=models.CASCADE)
    joined_date = models.DateTimeField(default=now)
    is_active = models.BooleanField(default=True)

# ============================================
# HALL MANAGEMENT MODELS
# ============================================

class Hall(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=20, unique=True)
    location = models.CharField(max_length=200, blank=True)
    capacity = models.IntegerField()
    facilities = models.JSONField(blank=True, null=True)
    is_available = models.BooleanField(default=True)

class HallBooking(models.Model):
    hall = models.ForeignKey(Hall, on_delete=models.CASCADE, related_name='bookings')
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='hall_bookings', blank=True, null=True)
    booked_by = models.ForeignKey(ClubMember, on_delete=models.CASCADE, related_name='hall_bookings')
    booking_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    booking_status = models.CharField(max_length=20, default='PENDING')

# ============================================
# EVENT MANAGEMENT MODELS
# ============================================

class Event(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('scheduled', 'Scheduled'),
        ('ongoing', 'Ongoing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='events')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField(blank=True, null=True)
    max_participants = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

class EventRegistration(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='registrations')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='event_registrations')
    registration_date = models.DateTimeField(default=now)
    status = models.CharField(max_length=20, default='REGISTERED')

# ============================================
# CERTIFICATE MANAGEMENT MODELS
# ============================================

class CertificateTemplate(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='certificate_templates')
    name = models.CharField(max_length=100)
    html_content = models.TextField()
    css_content = models.TextField(blank=True, null=True)

class Certificate(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='certificates')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='certificates')
    template = models.ForeignKey(CertificateTemplate, on_delete=models.SET_NULL, null=True, blank=True)
    file_path = models.CharField(max_length=500)
    issue_date = models.DateTimeField(default=now)

# ============================================
# AICTE POINTS MANAGEMENT MODELS
# ============================================

class AICTECategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    min_points_required = models.IntegerField(blank=True, null=True)
    max_points_allowed = models.IntegerField(blank=True, null=True)

class AICTEPointTransaction(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='aicte_transactions')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='aicte_transactions')
    category = models.ForeignKey(AICTECategory, on_delete=models.CASCADE, related_name='transactions')
    points_allocated = models.IntegerField()
    status = models.CharField(max_length=20, default='PENDING')