# CertifyTrack - Quick Reference Guide

## Backend Architecture Overview

```
CertifyTrack/
├── BackEnd/
│   ├── api/
│   │   ├── models.py          # Database models
│   │   ├── serializers.py     # DRF serializers
│   │   ├── views.py           # API viewsets and endpoints
│   │   ├── urls.py            # URL routing
│   │   ├── permissions.py     # Permission classes
│   │   └── signals.py         # Django signals
│   ├── CertifyTrack/
│   │   ├── settings.py        # Django configuration
│   │   └── urls.py            # Project URL config
│   └── manage.py
│
└── FrontEnd/
    ├── src/
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── SignupPage.jsx
    │   │   └── ...
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── api.js             # API client
    │   └── App.jsx
    └── package.json
```

---

## Key Models & Their Relationships

### User Management Chain
```
User (AbstractUser)
├── Student (OneToOne)
│   └── Mentor (ForeignKey)
├── Mentor (OneToOne)
│   └── Coordinated Clubs (ForeignKey)
└── Admin (implied by user_type)
```

### Club Structure
```
Club
├── Club Head (ForeignKey to Student)
├── Faculty Coordinator (ForeignKey to Mentor)
├── Events (OneToMany)
├── Members (OneToMany through ClubMember)
└── ClubMember
    ├── Student
    └── ClubRole (Permissions)
```

### Event Lifecycle
```
Event (Status: Draft → Scheduled → Ongoing → Completed)
├── Registrations (EventRegistration)
│   └── Student
├── Attendance (EventAttendance)
│   └── Student
├── Certificates (Certificate)
│   └── Student
└── AICTE Transactions (AICTEPointTransaction)
    ├── Student
    ├── Category
    └── Status (PENDING → APPROVED/REJECTED)
```

### Hall Booking Flow
```
HallBooking (Status: PENDING → APPROVED/REJECTED)
├── Hall
├── Event (optional)
├── Booked By (ClubMember)
├── Approved By (User - Admin)
└── Conflict Detection (automatic on create)
```

---

## Common Operations & Code Snippets

### Getting User Profile

```python
# In views.py
user = self.request.user
student_profile = getattr(user, 'student_profile', None)
mentor_profile = getattr(user, 'mentor_profile', None)
```

### Checking User Permissions

```python
def check_is_admin(user):
    return user.user_type == 'admin'

def check_is_student(user):
    return user.user_type == 'student'

def is_mentor(user):
    return hasattr(user, 'mentor_profile')
```

### Getting Mentees

```python
# Get all students assigned to a mentor
mentor = request.user.mentor_profile
mentees = Student.objects.filter(mentor=mentor)
```

### Querying Events by Status

```python
# Get scheduled events
scheduled = Event.objects.filter(status='scheduled')

# Get ongoing events
ongoing = Event.objects.filter(status='ongoing')

# Get completed events with certificates
completed = Event.objects.filter(
    status='completed'
).prefetch_related('certificates')
```

### Checking Hall Availability

```python
from django.utils.timezone import now
from datetime import time

booking_date = "2025-12-15"
start_time = time(14, 0)  # 2 PM
end_time = time(16, 0)    # 4 PM
hall_id = 1

conflicts = HallBooking.objects.filter(
    hall_id=hall_id,
    booking_date=booking_date,
    booking_status__in=['APPROVED', 'PENDING'],
    start_time__lt=end_time,
    end_time__gt=start_time
)

if conflicts.exists():
    # Hall is booked during this time
    pass
```

### Getting AICTE Points Summary

```python
# For a student
student = Student.objects.get(id=1)
total_points = student.total_aicte_points

# Approved transactions only
approved = student.aicte_transactions.filter(
    status='APPROVED'
).aggregate(total=Sum('points_allocated'))['total']

# Pending approvals
pending = student.aicte_transactions.filter(
    status='PENDING'
)
```

---

## API Response Patterns

### Success Response (201 Created)
```json
{
  "id": 1,
  "field1": "value1",
  "field2": "value2",
  "message": "Operation successful"
}
```

### Success Response with List
```json
[
  {"id": 1, "name": "Item 1"},
  {"id": 2, "name": "Item 2"}
]
```

### Error Response (400 Bad Request)
```json
{
  "field_name": ["Error message"],
  "non_field_errors": ["General error"]
}
```

### Custom Error Response
```json
{
  "error": "Custom error message",
  "detail": "Additional details"
}
```

---

## Authentication Headers

### Bearer Token Format
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Using in Frontend
```javascript
// axios request
api.get('/api/events/', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});

// or with interceptor (already configured in api.js)
api.get('/api/events/');
```

---

## Database Query Optimization

### Use select_related() for ForeignKey
```python
# Good
events = Event.objects.select_related('club').all()

# Avoid N+1 queries
for event in events:
    print(event.club.name)  # No extra query
```

### Use prefetch_related() for Reverse Relations
```python
# Good
clubs = Club.objects.prefetch_related('events').all()

# Avoid N+1 queries
for club in clubs:
    for event in club.events.all():
        print(event.name)  # No extra query
```

### Aggregate Queries
```python
# Instead of looping, use aggregate
from django.db.models import Count, Sum

total_registrations = Event.objects.aggregate(
    total=Count('registrations')
)['total']

total_points = AICTEPointTransaction.objects.filter(
    status='APPROVED'
).aggregate(total=Sum('points_allocated'))['total'] or 0
```

---

## Common Errors & Fixes

### Error: "User has no attribute 'student_profile'"
```python
# Fix: Check if profile exists before accessing
profile = getattr(user, 'student_profile', None)
if profile:
    # use profile
```

### Error: "Unique constraint violation"
```python
# Check uniqueness before create
if not Student.objects.filter(usn=usn).exists():
    Student.objects.create(usn=usn, ...)
```

### Error: "Foreign key does not exist"
```python
# Validate related object exists
try:
    mentor = Mentor.objects.get(id=mentor_id)
except Mentor.DoesNotExist:
    raise ValidationError("Mentor not found")
```

---

## URL Patterns Reference

### Resource URLs
```
GET    /api/resource/               # List
POST   /api/resource/               # Create
GET    /api/resource/{id}/          # Retrieve
PUT    /api/resource/{id}/          # Update
DELETE /api/resource/{id}/          # Delete
```

### Custom Action URLs
```
POST   /api/resource/{id}/action/   # Custom action
GET    /api/resource/search/        # Search/filter
```

---

## Serializer Usage Patterns

### Read-Only Serializer
```python
class EventSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source='created_by.username',
        read_only=True
    )
    
    class Meta:
        model = Event
        fields = [...]
        read_only_fields = ['created_at', 'updated_at']
```

### Nested Serializer
```python
class ClubSerializer(serializers.ModelSerializer):
    members = ClubMemberSerializer(many=True, read_only=True)
    
    class Meta:
        model = Club
        fields = [..., 'members']
```

### Custom Validation
```python
class AICTESerializer(serializers.ModelSerializer):
    def validate(self, data):
        category = data.get('category')
        points = data.get('points_allocated')
        
        if category and points:
            if points < category.min_points_required:
                raise ValidationError("Points too low")
        
        return data
```

---

## Frontend-Backend Communication

### Login Flow
```
1. User enters credentials
   ↓
2. POST /api/auth/login/ with credentials
   ↓
3. Receive access_token & refresh_token
   ↓
4. Store tokens in localStorage
   ↓
5. Include access_token in all requests
```

### Token Refresh Flow
```
1. Access token expires (401 response)
   ↓
2. POST /api/auth/token/refresh/ with refresh_token
   ↓
3. Receive new access_token
   ↓
4. Retry original request with new token
```

---

## Environment Variables

### Django Settings (.env)
```
DJANGO_SECRET_KEY=your-secret-key
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,yourdomain.com
DJANGO_TIME_ZONE=UTC

POSTGRES_DB=certifytrack
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost

JWT_ACCESS_MINUTES=60
JWT_REFRESH_DAYS=7

CORS_ALLOWED_ORIGINS=http://localhost:5173,https://yourdomain.com
```

---

## Testing Checklist

- [ ] User registration with all roles
- [ ] Email verification flow
- [ ] Login/logout functionality
- [ ] Account lockout after 5 failed attempts
- [ ] Password reset with OTP
- [ ] Profile update for each role
- [ ] Bulk user import via CSV
- [ ] Mentor-mentee assignment
- [ ] Event creation and registration
- [ ] Attendance marking
- [ ] Certificate generation
- [ ] Hall booking with conflict detection
- [ ] AICTE point approval workflow
- [ ] Notification system
- [ ] Audit logging

---

## Performance Considerations

1. **Pagination**: Always paginate list endpoints
2. **Filtering**: Allow filtering on large datasets
3. **Search**: Implement full-text search for events, clubs
4. **Caching**: Cache frequently accessed data (clubs, templates)
5. **Indexing**: Database indexes on:
   - User lookups (username, email)
   - Event queries (status, date)
   - Hall bookings (date, hall_id)
   - AICTE transactions (student_id, status)

---

## Security Best Practices

✅ Always validate user permissions  
✅ Sanitize user input  
✅ Use HTTPS in production  
✅ Never expose sensitive data in API responses  
✅ Implement rate limiting for auth endpoints  
✅ Use CSRF tokens for state-changing operations  
✅ Log security-relevant events  
✅ Regular security audits  

---

## Useful Django Commands

```bash
# Create migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Shell access to DB
python manage.py shell

# Run tests
python manage.py test

# Collect static files
python manage.py collectstatic

# Clear cache
python manage.py clear_cache

# Database backup
python manage.py dumpdata > backup.json

# Load data
python manage.py loaddata backup.json
```

---

## Quick Links

- Django REST Framework: https://www.django-rest-framework.org/
- Django Documentation: https://docs.djangoproject.com/
- JWT Documentation: https://django-rest-framework-simplejwt.readthedocs.io/
- React Documentation: https://react.dev/

---

**Last Updated**: November 21, 2025  
**Status**: ✅ Production Ready Backend  
**Version**: 1.0
