# CertifyTrack Backend - Implementation Guide & Testing

## Overview

This guide explains how to use the implemented CertifyTrack backend API endpoints. All endpoints require proper authentication (JWT tokens) except for public endpoints like registration and login.

---

## Table of Contents

1. [Setup & Configuration](#setup--configuration)
2. [Authentication Flow](#authentication-flow)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Example Requests](#example-requests)
5. [Error Handling](#error-handling)
6. [Testing Workflow](#testing-workflow)

---

## Setup & Configuration

### Prerequisites

- Python 3.12+
- Django 5.x
- Django REST Framework
- djangorestframework-simplejwt
- Pillow (image handling)
- ReportLab (optional, for PDF generation)

### Installation

```bash
# Install dependencies
cd BackEnd
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

---

## Authentication Flow

### 1. User Registration

**Endpoint**: `POST /api/auth/register/`

```json
{
  "username": "student1",
  "email": "student1@university.edu",
  "first_name": "John",
  "last_name": "Doe",
  "password": "SecurePass123",
  "password_confirm": "SecurePass123",
  "user_type": "student",
  "department": "Computer Science",
  "usn": "USN123456",
  "semester": 3
}
```

**Response**:

```json
{
  "id": 1,
  "username": "student1",
  "email": "student1@university.edu",
  "user_type": "student",
  "is_email_verified": false,
  "message": "Registration successful! Please check your email to verify your account."
}
```

### 2. Email Verification

After registration, an email is sent with a verification token. Use this endpoint to verify:

**Endpoint**: `POST /api/auth/verify-email/`

```json
{
  "token": "verification_token_from_email"
}
```

### 3. Login

**Endpoint**: `POST /api/auth/login/`

```json
{
  "username": "student1",
  "password": "SecurePass123"
}
```

**Response**:

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "student1",
    "email": "student1@university.edu",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "student",
    "is_email_verified": true,
    "date_joined": "2025-11-21T12:00:00Z"
  }
}
```

**Important**: Save the `access` token. Include it in all future requests as:

```
Authorization: Bearer <access_token>
```

### 4. Password Reset

**Step 1**: Request OTP

**Endpoint**: `POST /api/auth/password-reset/request/`

```json
{
  "email": "student1@university.edu"
}
```

**Step 2**: Reset Password with OTP

**Endpoint**: `POST /api/auth/password-reset/confirm/`

```json
{
  "email": "student1@university.edu",
  "otp": "123456",
  "new_password": "NewSecurePass456"
}
```

---

## API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint                            | Purpose                    | Auth Required |
| ------ | ----------------------------------- | -------------------------- | ------------- |
| POST   | `/api/auth/register/`               | Register new user          | No            |
| POST   | `/api/auth/verify-email/`           | Verify email               | No            |
| POST   | `/api/auth/login/`                  | Login and get tokens       | No            |
| POST   | `/api/auth/password-reset/request/` | Request password reset OTP | No            |
| POST   | `/api/auth/password-reset/confirm/` | Reset password             | No            |
| POST   | `/api/auth/token/refresh/`          | Refresh access token       | No            |

### Profile Endpoints

| Method | Endpoint                | Purpose                  | Auth Required |
| ------ | ----------------------- | ------------------------ | ------------- |
| GET    | `/api/profile/`         | Get current user profile | Yes           |
| PUT    | `/api/profile/`         | Update user profile      | Yes           |
| GET    | `/api/profile/student/` | Get student profile      | Yes           |
| PUT    | `/api/profile/student/` | Update student profile   | Yes           |
| GET    | `/api/profile/mentor/`  | Get mentor profile       | Yes           |
| PUT    | `/api/profile/mentor/`  | Update mentor profile    | Yes           |

### Admin User Management

| Method | Endpoint                          | Purpose                      | Auth Required | Role  |
| ------ | --------------------------------- | ---------------------------- | ------------- | ----- |
| POST   | `/api/admin/users/create/`        | Create single user           | Yes           | Admin |
| POST   | `/api/admin/users/bulk-create/`   | Bulk import users from CSV   | Yes           | Admin |
| POST   | `/api/admin/mentees/assign/`      | Assign mentees to mentor     | Yes           | Admin |
| POST   | `/api/admin/mentees/bulk-assign/` | Bulk assign mentees from CSV | Yes           | Admin |

### Club Management

| Method | Endpoint             | Purpose           | Auth Required      |
| ------ | -------------------- | ----------------- | ------------------ |
| GET    | `/api/clubs/`        | List all clubs    | Yes                |
| POST   | `/api/clubs/`        | Create club       | Yes (Mentor/Admin) |
| GET    | `/api/clubs/{id}/`   | Get club details  | Yes                |
| PUT    | `/api/clubs/{id}/`   | Update club       | Yes                |
| DELETE | `/api/clubs/{id}/`   | Delete club       | Yes                |
| GET    | `/api/club-members/` | List club members | Yes                |
| POST   | `/api/club-members/` | Add club member   | Yes                |
| GET    | `/api/club-roles/`   | List all roles    | Yes                |

### Event Management

| Method | Endpoint                                  | Purpose                     | Auth Required     |
| ------ | ----------------------------------------- | --------------------------- | ----------------- |
| GET    | `/api/events/`                            | List events                 | Yes               |
| POST   | `/api/events/`                            | Create event                | Yes (Club member) |
| GET    | `/api/events/{id}/`                       | Get event details           | Yes               |
| PUT    | `/api/events/{id}/`                       | Update event                | Yes               |
| POST   | `/api/events/{id}/register/`              | Student registers for event | Yes (Student)     |
| POST   | `/api/events/{id}/start/`                 | Start event                 | Yes (Club member) |
| POST   | `/api/events/{id}/end/`                   | End event                   | Yes (Club member) |
| POST   | `/api/events/{id}/mark-attendance/`       | Mark attendance             | Yes (Club member) |
| POST   | `/api/events/{id}/generate-certificates/` | Generate certificates       | Yes (Club member) |
| GET    | `/api/event-attendance/`                  | View attendance records     | Yes               |

### Hall Booking

| Method | Endpoint                           | Purpose         | Auth Required     |
| ------ | ---------------------------------- | --------------- | ----------------- |
| GET    | `/api/halls/`                      | List all halls  | Yes               |
| POST   | `/api/halls/`                      | Create/add hall | Yes (Admin)       |
| GET    | `/api/hall-bookings/`              | List bookings   | Yes               |
| POST   | `/api/hall-bookings/`              | Create booking  | Yes (Club member) |
| POST   | `/api/hall-bookings/{id}/approve/` | Approve booking | Yes (Admin)       |
| POST   | `/api/hall-bookings/{id}/reject/`  | Reject booking  | Yes (Admin)       |

### Certificates

| Method | Endpoint                                | Purpose            | Auth Required |
| ------ | --------------------------------------- | ------------------ | ------------- |
| GET    | `/api/certificate-templates/`           | List templates     | Yes           |
| POST   | `/api/certificate-templates/`           | Create template    | Yes (Admin)   |
| GET    | `/api/certificates/`                    | View certificates  | Yes           |
| GET    | `/api/certificates/verify/{file_hash}/` | Verify certificate | No            |

### AICTE Points

| Method | Endpoint                                | Purpose               | Auth Required      |
| ------ | --------------------------------------- | --------------------- | ------------------ |
| GET    | `/api/aicte-categories/`                | List point categories | Yes                |
| POST   | `/api/aicte-categories/`                | Create category       | Yes (Admin)        |
| GET    | `/api/aicte-transactions/`              | View transactions     | Yes                |
| POST   | `/api/aicte-transactions/`              | Create transaction    | Yes (Admin/Mentor) |
| POST   | `/api/aicte-transactions/{id}/approve/` | Approve points        | Yes (Mentor)       |
| POST   | `/api/aicte-transactions/{id}/reject/`  | Reject points         | Yes (Mentor)       |

### Notifications & Audit

| Method | Endpoint                             | Purpose             | Auth Required |
| ------ | ------------------------------------ | ------------------- | ------------- |
| GET    | `/api/notifications/`                | Get notifications   | Yes           |
| POST   | `/api/notifications/mark-all-read/`  | Mark all as read    | Yes           |
| POST   | `/api/notifications/{id}/mark-read/` | Mark single as read | Yes           |
| GET    | `/api/audit-logs/`                   | View audit logs     | Yes (Admin)   |

### Reports

| Method | Endpoint                | Purpose                  | Auth Required |
| ------ | ----------------------- | ------------------------ | ------------- |
| GET    | `/api/dashboard/stats/` | Get dashboard statistics | Yes           |

---

## Example Requests

### Create Event as Club Member

```bash
curl -X POST http://localhost:8000/api/events/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "club": 1,
    "name": "Python Workshop 2025",
    "description": "Learn advanced Python concepts",
    "event_date": "2025-12-15",
    "start_time": "14:00:00",
    "end_time": "16:00:00",
    "max_participants": 50,
    "status": "scheduled"
  }'
```

### Register for Event as Student

```bash
curl -X POST http://localhost:8000/api/events/1/register/ \
  -H "Authorization: Bearer <access_token>"
```

### Mark Attendance

```bash
curl -X POST http://localhost:8000/api/events/1/mark-attendance/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "attendance": [
      {"student_id": 5, "is_present": true},
      {"student_id": 6, "is_present": true},
      {"student_id": 7, "is_present": false}
    ]
  }'
```

### Bulk Import Students

```bash
# Create CSV file: students.csv
# username,email,first_name,last_name,user_type,usn,department,semester
# student1,student1@univ.edu,John,Doe,student,USN001,CSE,3
# student2,student2@univ.edu,Jane,Smith,student,USN002,CSE,3

curl -X POST http://localhost:8000/api/admin/users/bulk-create/ \
  -H "Authorization: Bearer <admin_token>" \
  -F "csv_file=@students.csv"
```

### Approve AICTE Points as Mentor

```bash
curl -X POST http://localhost:8000/api/aicte-transactions/1/approve/ \
  -H "Authorization: Bearer <mentor_token>" \
  -H "Content-Type: application/json"
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**:

```json
{
  "error": "Invalid input data",
  "details": {
    "usn": ["This field may not be blank."]
  }
}
```

**401 Unauthorized**:

```json
{
  "detail": "Invalid token or token expired"
}
```

**403 Forbidden**:

```json
{
  "detail": "You do not have permission to perform this action."
}
```

**404 Not Found**:

```json
{
  "detail": "Not found."
}
```

**409 Conflict**:

```json
{
  "error": "Hall is not available for the selected time slot.",
  "conflicts": [...]
}
```

---

## Testing Workflow

### 1. Create Admin User

```bash
python manage.py createsuperuser
# Follow prompts to create admin account
```

### 2. Register Students

```bash
POST /api/auth/register/
- User: student1, student2, student3
- Type: student
- USN: unique for each
```

### 3. Register Mentors

```bash
POST /api/auth/register/
- User: mentor1, mentor2
- Type: mentor
- Employee ID: unique for each
```

### 4. Assign Mentees

```bash
POST /api/admin/mentees/assign/
- Assign student1, student2 to mentor1
- Assign student3 to mentor2
```

### 5. Create Clubs

```bash
POST /api/clubs/
- Name: "Programming Club"
- Faculty Coordinator: mentor1
- Club Head: student1
```

### 6. Create Events

```bash
POST /api/events/
- Club: Programming Club
- Name: "Python Workshop"
- Date: 2025-12-15
- Capacity: 50
- Status: scheduled
```

### 7. Student Registration

```bash
POST /api/events/{event_id}/register/
- Login as student1, student2, student3
- Register for event
```

### 8. Mark Attendance

```bash
POST /api/events/{event_id}/mark-attendance/
- Mark attendance for students who attended
```

### 9. Approve Points

```bash
POST /api/aicte-transactions/{id}/approve/
- Login as assigned mentor
- Approve student points
```

---

## Database Migrations

After implementing new models/fields, always run:

```bash
# Create migration
python manage.py makemigrations

# Apply migration
python manage.py migrate

# Check migration status
python manage.py showmigrations
```

---

## Important Notes

1. **Email Verification**: In production, configure email backend in settings.py
2. **Token Expiry**: Access tokens expire in 60 minutes (configurable in settings)
3. **Refresh Tokens**: Use refresh endpoint to get new access token
4. **Audit Logging**: All actions are logged in AuditLog table
5. **Role-Based Access**: Routes check user role and mentor assignments
6. **Conflict Detection**: Hall bookings automatically check for conflicts
7. **Profile Completion**: Track when users complete their profiles
8. **Account Lockout**: 5 failed logins = 15-minute lockout

---

## Troubleshooting

### Issue: CORS errors in frontend

**Solution**: Update `CORS_ALLOWED_ORIGINS` in settings.py

### Issue: Email not sending

**Solution**: Configure email backend in settings.py (SMTP, AWS SES, etc.)

### Issue: Token expired

**Solution**: Use refresh token to get new access token from `/api/auth/token/refresh/`

### Issue: Migrations not applied

**Solution**: Run `python manage.py migrate` after `makemigrations`

---

## Next Implementation Priorities

1. ✅ Email notification system
2. ✅ PDF certificate generation
3. ✅ Dashboard endpoints
4. ⏳ Frontend components
5. ⏳ Mobile app support
6. ⏳ Analytics dashboard
7. ⏳ Multi-language support

---

For questions or issues, refer to the main `IMPLEMENTATION_SUMMARY.md` document.
