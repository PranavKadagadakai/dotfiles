"""
Email sending utilities for CertifyTrack.
Handles verification emails and password reset OTP delivery.
"""

from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags


def send_verification_email(user):
    """
    Send email verification link to user.
    
    Args:
        user: User instance with email_verification_token set
    """
    if not user.email_verification_token:
        raise ValueError("User must have email_verification_token set")
    
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={user.email_verification_token}"
    
    context = {
        'user_name': user.get_full_name() or user.username,
        'verification_url': verification_url,
        'token': user.email_verification_token,
        'frontend_url': settings.FRONTEND_URL,
    }
    
    subject = "Verify Your CertifyTrack Email"
    html_message = render_to_string('emails/verify_email.html', context)
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_password_reset_email(user, otp):
    """
    Send password reset OTP to user.
    
    Args:
        user: User instance
        otp: 6-digit OTP string
    """
    context = {
        'user_name': user.get_full_name() or user.username,
        'otp': otp,
        'otp_minutes': settings.PASSWORD_RESET_TIMEOUT_MINUTES,
        'frontend_url': settings.FRONTEND_URL,
    }
    
    subject = "Password Reset Code - CertifyTrack"
    html_message = render_to_string('emails/password_reset.html', context)
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_account_locked_email(user):
    """
    Send account locked warning to user.
    
    Args:
        user: User instance
    """
    context = {
        'user_name': user.get_full_name() or user.username,
        'frontend_url': settings.FRONTEND_URL,
    }
    
    subject = "Account Locked - CertifyTrack"
    html_message = render_to_string('emails/account_locked.html', context)
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )


def send_welcome_email(user):
    """
    Send welcome email after successful registration and verification.
    
    Args:
        user: User instance
    """
    context = {
        'user_name': user.get_full_name() or user.username,
        'user_type': user.get_user_type_display(),
        'frontend_url': settings.FRONTEND_URL,
    }
    
    subject = "Welcome to CertifyTrack!"
    html_message = render_to_string('emails/welcome.html', context)
    plain_message = strip_tags(html_message)
    
    send_mail(
        subject,
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )
