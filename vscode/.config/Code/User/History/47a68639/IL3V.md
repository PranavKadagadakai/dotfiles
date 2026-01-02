# Quick Testing Guide - Registration Fix

## Issue Fixed
✅ **Registration endpoint 500 error:** `ImproperlyConfigured: Field name 'department' is not valid for model 'User'`

---

## Before Testing
1. Ensure Django server is running
2. Latest code is deployed
3. Database is migrated (no new migrations needed)

---

## Test Endpoints

### 1. Student Registration ✅
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student_test_001",
    "email": "student@test.com",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "first_name": "Test",
    "last_name": "Student",
    "user_type": "student",
    "usn": "CSE2023001",
    "department": "Computer Science",
    "semester": 4
  }'
```

**Expected:** 201 Created + verification email message

---

### 2. Mentor Registration ✅
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "mentor_test_001",
    "email": "mentor@test.com",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "first_name": "Dr.",
    "last_name": "Mentor",
    "user_type": "mentor",
    "employee_id": "EMP2025001",
    "designation": "Associate Professor",
    "department": "Computer Science"
  }'
```

**Expected:** 201 Created + verification email message

---

### 3. Club Organizer Registration ✅
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "club_test_001",
    "email": "club@test.com",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "first_name": "John",
    "last_name": "Organizer",
    "user_type": "club_organizer"
  }'
```

**Expected:** 201 Created + verification email message

---

## Validation Tests

### Missing Required Fields (Student)
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student_test",
    "email": "student@test.com",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "user_type": "student"
  }'
```

**Expected:** 400 Bad Request - "USN is required for student registration"

---

### Duplicate USN
```bash
# First registration
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student_1",
    "email": "student1@test.com",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "first_name": "Test",
    "last_name": "Student",
    "user_type": "student",
    "usn": "CSE2023001"
  }'

# Second registration with same USN
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student_2",
    "email": "student2@test.com",
    "password": "TestPass123!",
    "password_confirm": "TestPass123!",
    "first_name": "Test",
    "last_name": "Student",
    "user_type": "student",
    "usn": "CSE2023001"
  }'
```

**Expected (2nd):** 400 Bad Request - "This USN is already registered"

---

### Password Mismatch
```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "student_test",
    "email": "student@test.com",
    "password": "TestPass123!",
    "password_confirm": "WrongPass123!",
    "user_type": "student"
  }'
```

**Expected:** 400 Bad Request - "Passwords do not match"

---

## Success Response Format

```json
{
  "id": 1,
  "username": "student_test_001",
  "email": "student@test.com",
  "first_name": "Test",
  "last_name": "Student",
  "user_type": "student",
  "is_email_verified": false,
  "date_joined": "2025-11-21T10:00:00Z",
  "message": "Registration successful! Please check your email to verify your account."
}
```

---

## Error Response Format

```json
{
  "usn": [
    "USN is required for student registration."
  ]
}
```

---

## Key Points to Verify

✅ **No 500 errors** - Should get 201 or 400, never 500  
✅ **Role-specific fields** - usn for students, employee_id for mentors  
✅ **Department handling** - Accepted but optional for all roles  
✅ **Email verification** - Token generated and logged  
✅ **Profile creation** - Check that Student/Mentor profile is created  
✅ **Validation rules** - Enforced correctly  

---

## Database Verification

After successful registration, check the database:

```python
# Check User was created
from api.models import User
user = User.objects.get(username='student_test_001')
print(user.user_type)  # Should be 'student'
print(user.is_email_verified)  # Should be False

# Check Student profile was created
student = user.student_profile
print(student.usn)  # Should be 'CSE2023001'
print(student.department)  # Should be 'Computer Science'
print(student.semester)  # Should be 4
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 500 ImproperlyConfigured error | Ensure serializers.py changes are deployed |
| Field not found errors | Clear browser cache, restart server |
| Email not received | Check Django logs, email backend config |
| Duplicate error for unique field | Use different values in subsequent tests |

---

## Rollback (if needed)

To revert the changes:
1. Restore previous version of `/BackEnd/api/serializers.py`
2. Restart Django server
3. No database migration needed

---

**Status:** ✅ Ready for Testing  
**Last Updated:** 21 November 2025  
**Files Modified:** 1  
**Breaking Changes:** None
