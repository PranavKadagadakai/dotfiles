# Email Configuration Fix - Implementation Guide

## Problem Identified

The application was using **stub functions** in `serializers.py` that only printed emails to the console instead of sending them using the real email backend configured in Django settings.

### Root Cause
- **File:** `api/serializers.py` (lines 16-27)
- **Issue:** Two stub functions that only printed to console:
  ```python
  def send_verification_email(user):
      print(f"[Email Verification] Sent verification email to {user.email}...")
  
  def send_password_reset_email(user, otp):
      print(f"[Password Reset] Sent OTP to {user.email}: {otp}")
  ```
- These functions were being called instead of the real email sending functions in `email_utils.py`

---

## Solution Implemented

### 1. **Updated `api/serializers.py`** ✅
- **Removed:** Stub functions (lines 16-27)
- **Added:** Import statement for real email functions:
  ```python
  from .email_utils import send_verification_email, send_password_reset_email
  ```
- **Result:** Now uses actual email sending functions from `email_utils.py`

### 2. **Updated `BackEnd/CertifyTrack/settings.py`** ✅
- **Changed:** Default `EMAIL_BACKEND` from console to SMTP:
  ```python
  # Before
  EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
  
  # After
  EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
  ```
- **Result:** Emails are now sent via SMTP instead of printed to console

### 3. **Updated `.env.example`** ✅
- **Changed:** Default `EMAIL_BACKEND` configuration with documentation:
  ```env
  # Email Configuration
  # For production/testing: use django.core.mail.backends.smtp.EmailBackend
  # For development (console output): use django.core.mail.backends.console.EmailBackend
  EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
  EMAIL_HOST=smtp.gmail.com
  EMAIL_PORT=587
  EMAIL_USE_TLS=True
  EMAIL_HOST_USER=your-email@gmail.com
  EMAIL_HOST_PASSWORD=your-app-password
  DEFAULT_FROM_EMAIL=noreply@certifytrack.com
  
  # Frontend URL for email links
  FRONTEND_URL=http://localhost:5173
  ```
- **Result:** Clear configuration with options for dev/prod use

---

## Email Configuration Overview

### Current Setup

The application now uses Django's email system with the following flow:

```
User Action (Signup/Password Reset)
        ↓
Views or Serializers call send_verification_email() or send_password_reset_email()
        ↓
email_utils.py functions format HTML/plain text emails
        ↓
Django's send_mail() function
        ↓
EMAIL_BACKEND setting (django.core.mail.backends.smtp.EmailBackend)
        ↓
SMTP Server (Gmail, SendGrid, etc.)
        ↓
User receives email
```

### Configuration Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `EMAIL_BACKEND` | Email sending method | `django.core.mail.backends.smtp.EmailBackend` |
| `EMAIL_HOST` | SMTP server address | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_USE_TLS` | Enable TLS encryption | `True` |
| `EMAIL_HOST_USER` | SMTP username/email | `your-email@gmail.com` |
| `EMAIL_HOST_PASSWORD` | SMTP password/app-password | `xxxx xxxx xxxx xxxx` |
| `DEFAULT_FROM_EMAIL` | Sender email address | `noreply@certifytrack.com` |
| `FRONTEND_URL` | Frontend base URL for email links | `http://localhost:5173` |

---

## Setup Instructions

### For Gmail SMTP

1. **Enable 2-Factor Authentication** on your Google Account
   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google generates a 16-character password
   - Copy the password (without spaces)

3. **Update `.env` file**
   ```env
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=your-email@gmail.com
   EMAIL_HOST_PASSWORD=xxxx xxxx xxxx xxxx
   DEFAULT_FROM_EMAIL=your-email@gmail.com
   ```

4. **Verify Configuration**
   ```bash
   # Test email in Django shell
   python manage.py shell
   >>> from django.core.mail import send_mail
   >>> send_mail("Test", "This is a test", "from@example.com", ["to@example.com"])
   1  # Returns 1 if successful
   ```

### For Development (Console Output)

If you want to see emails in console during development:

```env
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### For Production (Alternative SMTP Providers)

**SendGrid:**
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.your_sendgrid_api_key
```

**AWS SES:**
```env
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=email-smtp.region.amazonaws.com
EMAIL_PORT=587
EMAIL_HOST_USER=smtp_username
EMAIL_HOST_PASSWORD=smtp_password
```

---

## Email Functions Overview

### 1. Email Verification

**File:** `api/email_utils.py` (lines 87-111)

**Function:** `send_verification_email(user)`

**Triggered by:**
- User signup/registration
- Manual email verification request

**Email Content:**
- HTML formatted email with logo and button
- Plain text fallback
- Verification link with token
- Call-to-action button

**Example Email Link:**
```
http://localhost:5173/verify-email?token=abc123...
```

### 2. Password Reset

**File:** `api/email_utils.py` (lines 207-245)

**Function:** `send_password_reset_email(user, otp)`

**Triggered by:**
- User password reset request
- User account locked after failed attempts

**Email Content:**
- HTML formatted email with logo
- Plain text fallback
- 6-digit OTP code
- Expiration time (default 10 minutes)
- Security warning

**Example OTP:**
```
Your Reset Code: 123456
Valid for 10 minutes
```

### 3. Account Locked Notification

**File:** `api/email_utils.py` (lines 274-290)

**Function:** `send_account_locked_email(user)`

**Triggered by:**
- Account locked after 5 failed login attempts

**Email Content:**
- Warning about account lock
- Instructions to reset password
- Security recommendation

---

## Testing Email Configuration

### Method 1: Django Shell

```bash
python manage.py shell
```

```python
from django.core.mail import send_mail
from django.conf import settings

# Test basic email
result = send_mail(
    "Test Subject",
    "Test message body",
    settings.DEFAULT_FROM_EMAIL,
    ["recipient@example.com"],
)
print(f"Sent: {result}")  # Should print: Sent: 1
```

### Method 2: Test User Registration

1. Start backend: `python manage.py runserver`
2. Create account via API:
   ```bash
   curl -X POST http://localhost:8000/api/auth/signup/ \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "TestPass123",
       "user_type": "student"
     }'
   ```
3. Check email inbox for verification email
4. If using console backend, check Django logs for email content

### Method 3: Test Password Reset

1. Request password reset:
   ```bash
   curl -X POST http://localhost:8000/api/auth/request-password-reset/ \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```
2. Check email inbox for reset code
3. Use code to reset password:
   ```bash
   curl -X POST http://localhost:8000/api/auth/reset-password/ \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "otp": "123456",
       "new_password": "NewPass123"
     }'
   ```

---

## Troubleshooting

### Issue: "SMTP auth extension not supported"

**Solution:** Update `EMAIL_PORT` and `EMAIL_USE_TLS`:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Issue: "Username and password not accepted"

**Solutions:**
1. Verify correct app password (not account password)
2. Ensure 2FA is enabled on account
3. Check for typos in `.env`
4. Try with a test email first

### Issue: "SMTPException: SMTP AUTH extension not supported"

**Solution:** Check that `EMAIL_USE_TLS=True` in `.env`

### Issue: "Connection refused"

**Solution:** Verify email host and port:
- Gmail: `smtp.gmail.com:587`
- SendGrid: `smtp.sendgrid.net:587`
- AWS SES: `email-smtp.{region}.amazonaws.com:587`

### Issue: Emails still being printed to console

**Solution:** Verify `.env` file is being read:
```bash
# Check .env file exists
cat .env | grep EMAIL_BACKEND

# Should show: EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# NOT console.EmailBackend
```

---

## Implementation Checklist

- [x] Fixed stub functions in `serializers.py`
- [x] Added proper imports from `email_utils.py`
- [x] Updated `settings.py` default EMAIL_BACKEND to SMTP
- [x] Updated `.env.example` with correct configuration
- [x] Added FRONTEND_URL to `.env.example`
- [x] Created email configuration guide
- [x] Documented test procedures
- [x] Provided troubleshooting guide

---

## Files Modified

| File | Change | Status |
|------|--------|--------|
| `api/serializers.py` | Removed stub functions, added imports | ✅ Complete |
| `BackEnd/CertifyTrack/settings.py` | Changed default EMAIL_BACKEND to SMTP | ✅ Complete |
| `.env.example` | Updated with proper config and comments | ✅ Complete |

---

## Next Steps

1. **Update your `.env` file** with Gmail credentials
2. **Enable 2FA** on your Google Account (if using Gmail)
3. **Generate App Password** from Google Account settings
4. **Copy App Password** to `EMAIL_HOST_PASSWORD` in `.env`
5. **Restart Django** application to load new settings
6. **Test email** by signing up a new user
7. **Check inbox** for verification email

---

## Reference Links

- [Django Email Configuration](https://docs.djangoproject.com/en/stable/topics/email/)
- [Gmail SMTP Settings](https://support.google.com/accounts/answer/185833)
- [Django send_mail() Documentation](https://docs.djangoproject.com/en/stable/topics/email/#send-mail)
- [Email Backends](https://docs.djangoproject.com/en/stable/topics/email/#topic-email-backends)

---

**Status:** ✅ Fixed and Ready to Use  
**Created:** November 23, 2025  
**Version:** 1.0.0

