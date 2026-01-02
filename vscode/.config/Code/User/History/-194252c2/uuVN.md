# Django Registration Serializer - Bug Fix Report

## Issue Identified

**Error:** `django.core.exceptions.ImproperlyConfigured: Field name 'department' is not valid for model 'User'`

**Root Cause:** The `RegisterSerializer` included `department` in its Meta fields list, but:

1. The `department` field was declared as a CharField but NOT properly bound to the User model
2. `department` only exists on the `Student` and `Mentor` models, NOT on the `User` model
3. When the serializer tried to instantiate fields, it attempted to look up `department` on User, which failed

## Solution Implemented

### File: `/BackEnd/api/serializers.py`

#### Change 1: RegisterSerializer Declaration

**Fixed the serializer field declaration to properly declare `department` as an optional CharField:**

```python
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    # Student-specific fields
    usn = serializers.CharField(required=False, allow_blank=True)
    semester = serializers.IntegerField(required=False)
    department = serializers.CharField(required=False, allow_blank=True)  # ✅ NOW DECLARED HERE

    # Mentor-specific fields
    employee_id = serializers.CharField(required=False, allow_blank=True)
    designation = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 'first_name', 'last_name',
            'user_type', 'usn', 'semester', 'department', 'employee_id', 'designation'
        ]
```

#### Change 2: RegisterSerializer.create() Method

**Fixed the create method to extract role-specific fields before passing to User.objects.create():**

```python
def create(self, validated_data):
    password = validated_data.pop('password')
    validated_data.pop('password_confirm', None)

    # ✅ EXTRACT role-specific fields that aren't part of User model
    usn = validated_data.pop('usn', None)
    semester = validated_data.pop('semester', None)
    employee_id = validated_data.pop('employee_id', None)
    designation = validated_data.pop('designation', None)
    department = validated_data.pop('department', None)

    # Generate email verification token
    verification_token = secrets.token_urlsafe(32)

    # ✅ NOW ONLY pass User model fields to create()
    user = User.objects.create(
        **validated_data,
        email_verification_token=verification_token,
        is_email_verified=False
    )
    user.set_password(password)
    user.save()

    # Send verification email
    send_verification_email(user)

    # Create role-specific profiles with the extracted data
    if user.user_type == 'student':
        Student.objects.create(
            user=user,
            usn=usn or '',
            department=department or '',
            semester=int(semester) if semester else 1
        )

    elif user.user_type == 'mentor':
        Mentor.objects.create(
            user=user,
            employee_id=employee_id or '',
            department=department or '',
            designation=designation or ''
        )

    return user
```

## What Was Wrong

### Before (Broken):

```python
# ❌ WRONG: Tried to pass usn, semester, department to User.objects.create()
user = User.objects.create(
    **validated_data,  # This includes fields User doesn't have!
    email_verification_token=verification_token,
    is_email_verified=False
)
```

### After (Fixed):

```python
# ✅ RIGHT: Extract non-User fields first
usn = validated_data.pop('usn', None)
department = validated_data.pop('department', None)
semester = validated_data.pop('semester', None)

# Then only pass User model fields
user = User.objects.create(**validated_data, ...)

# Create Student/Mentor profile separately
Student.objects.create(user=user, usn=usn, department=department, semester=semester)
```

## How the Fix Works

1. **Serializer Validation**: The validate() method checks role-specific requirements

   - Students must provide `usn` and optional `department`, `semester`
   - Mentors must provide `employee_id`, `designation`, optional `department`

2. **Data Extraction**: Before creating the User:

   - Extract all role-specific fields from validated_data using `.pop()`
   - This removes them so they won't be passed to User.objects.create()

3. **User Creation**: Create the User with only User model fields

   - username, email, password, first_name, last_name, user_type
   - Plus email verification fields

4. **Profile Creation**: Create Student or Mentor profile with extracted data
   - Student.objects.create() receives usn, department, semester
   - Mentor.objects.create() receives employee_id, designation, department

## Testing the Fix

To test the registration endpoint:

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe",
    "user_type": "student",
    "usn": "USN123456",
    "department": "Computer Science",
    "semester": 4
  }
```

**Expected Response (200 OK):**

```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "user_type": "student",
  "message": "Registration successful! Please check your email to verify your account."
}
```

## Files Modified

- `/BackEnd/api/serializers.py` - Fixed RegisterSerializer field declaration and create() method

## Status

✅ **FIXED** - Registration endpoint should now work correctly for student, mentor, and club organizer registrations.

## Related Models

- `User` - Base user model (no department field)
- `Student` - Has department field (CharField, max_length=100)
- `Mentor` - Has department field (CharField, max_length=100)
