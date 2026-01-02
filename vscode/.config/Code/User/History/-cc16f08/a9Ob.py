"""
Django management command to verify all admin/superuser accounts.
Usage: python manage.py verify_all_admins
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Mark all admin users as email verified for immediate login access'

    def handle(self, *args, **options):
        admins = User.objects.filter(user_type='admin')

        if not admins.exists():
            self.stdout.write(
                self.style.WARNING('⚠️  No admin users found in the system')
            )
            return

        updated_count = admins.filter(is_email_verified=False).update(
            is_email_verified=True,
            email_verification_token=None,
            verification_sent_at=None
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Successfully verified all admin accounts:\n'
                f'   Total admins: {admins.count()}\n'
                f'   Updated (unverified → verified): {updated_count}\n'
                f'   All admins can now login without email verification'
            )
        )
