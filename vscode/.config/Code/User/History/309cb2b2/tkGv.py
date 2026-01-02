import hashlib
import secrets
from datetime import datetime, timedelta
from django.utils import timezone

def generate_token(length=32):
    """
    Generate a secure random token.
    """
    return secrets.token_urlsafe(length)


def hash_file(file_path):
    """
    Generate SHA256 hash of a file.
    """
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


def generate_certificate_number(event_id, student_id):
    """
    Generate unique certificate number.
    """
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    return f"CERT-{event_id}-{student_id}-{timestamp}"


def get_academic_year():
    """
    Get current academic year based on date.
    """
    now = timezone.now()
    if now.month >= 7:  # July onwards is new academic year
        return f"{now.year}-{now.year + 1}"
    else:
        return f"{now.year - 1}-{now.year}"


def get_current_semester():
    """
    Get current semester (1-8) based on date and admission year.
    """
    # This is a simplified version - adjust based on your institution's calendar
    now = timezone.now()
    if 1 <= now.month <= 6:
        return 'EVEN'  # Even semester (Jan-June)
    else:
        return 'ODD'   # Odd semester (July-Dec)