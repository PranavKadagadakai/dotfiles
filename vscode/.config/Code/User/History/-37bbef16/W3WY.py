from django.core.exceptions import ValidationError
from django.utils import timezone
import re

def validate_usn(value):
    """
    Validate USN format (customize based on your institution's format).
    Example: 1AB21CS001
    """
    pattern = r'^[0-9][A-Z]{2}[0-9]{2}[A-Z]{2,3}[0-9]{3}$'
    if not re.match(pattern, value):
        raise ValidationError(
            'Invalid USN format. Expected format: 1AB21CS001'
        )


def validate_employee_id(value):
    """
    Validate Employee ID format.
    """
    pattern = r'^EMP[0-9]{5}$'
    if not re.match(pattern, value):
        raise ValidationError(
            'Invalid Employee ID format. Expected format: EMP00001'
        )


def validate_future_date(value):
    """
    Validate that date is in the future.
    """
    if value < timezone.now().date():
        raise ValidationError('Date must be in the future')


def validate_phone_number(value):
    """
    Validate phone number (10 digits).
    """
    pattern = r'^[0-9]{10}$'
    if not re.match(pattern, value):
        raise ValidationError('Phone number must be 10 digits')