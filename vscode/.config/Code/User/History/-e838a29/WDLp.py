from django.db import models

class Club(models.Model):
    club_name = models.CharField(max_length=100, unique=True)
    club_description = models.TextField(null=True, blank=True)
    club_email = models.EmailField(max_length=100, null=True, blank=True)
    club_logo_url = models.CharField(max_length=500, null=True, blank=True)
    faculty_coordinator = models.ForeignKey('mentors.Mentor', on_delete=models.SET_NULL, null=True, blank=True, related_name='coordinated_clubs')
    club_head = models.ForeignKey('students.Student', on_delete=models.SET_NULL, null=True, blank=True, related_name='headed_clubs')
    established_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'clubs'
    
    def __str__(self):
        return self.club_name


class ClubRole(models.Model):
    role_name = models.CharField(max_length=50, unique=True)
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
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'club_roles'
    
    def __str__(self):
        return self.role_name


class ClubMember(models.Model):
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='members')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='club_memberships')
    role = models.ForeignKey(ClubRole, on_delete=models.PROTECT)
    joined_date = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'club_members'
        unique_together = ('club', 'student')
        indexes = [
            models.Index(fields=['club']),
            models.Index(fields=['student']),
            models.Index(fields=['role']),
        ]
    
    def __str__(self):
        return f"{self.student} - {self.club} ({self.role})"