# api/signals.py
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError
import hashlib

from .models import Certificate


@receiver(pre_save, sender=Certificate)
def prevent_certificate_file_change(sender, instance, **kwargs):
    """
    Prevent modification or removal of the certificate file once it exists.
    Raises ValidationError which will propagate to the request/transaction.
    """
    if not instance.pk:
        # New certificate — nothing to prevent
        return

    try:
        original = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    # If original had a file and the incoming instance tries to change or remove it -> reject
    orig_has_file = bool(original.file and getattr(original.file, 'name', None))
    new_has_file = bool(instance.file and getattr(instance.file, 'name', None))

    # If original had a file but new instance tries to remove it -> reject
    if orig_has_file and not new_has_file:
        raise ValidationError("Certificate file cannot be removed once set (immutable).")

    # If original had a file and new instance attempts to replace it with a different file -> reject
    if orig_has_file and new_has_file and original.file.name != instance.file.name:
        raise ValidationError("Certificate file is immutable once set.")


@receiver(post_save, sender=Certificate)
def compute_certificate_hash(sender, instance, created, **kwargs):
    """
    Compute SHA256 hash of certificate file after it's saved and update file_hash.
    Uses update() to avoid re-triggering signals.
    """
    # Only compute if file present and file_hash not already set
    try:
        if instance.file and (not instance.file_hash):
            # read file content via storage
            try:
                with instance.file.open('rb') as f:
                    data = f.read()
            except Exception:
                # can't open file now — skip
                return

            digest = hashlib.sha256(data).hexdigest()
            # update directly (avoids calling instance.save(), which could re-trigger signals)
            sender.objects.filter(pk=instance.pk).update(file_hash=digest)
    except Exception:
        # Be defensive: don't raise in signal — just skip on unexpected errors
        return
