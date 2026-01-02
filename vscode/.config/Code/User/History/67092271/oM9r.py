"""
Django management command to update admin/superuser email and verification status.
Usage: python manage.py set_admin_email <username> <email>
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Update admin email and mark as verified'

    def add_arguments(self, parser):
        parser.add_argument(
            'username',
            type=str,
            help='Username of the admin/superuser'
        )
        parser.add_argument(
            'email',
            type=str,
            help='New email address for the admin'
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User with username "{username}" does not exist')

        if user.user_type != 'admin':
            raise CommandError(f'User "{username}" is not an admin. This command is for admins only.')

        # Check if email is already used
        if User.objects.filter(email=email).exclude(id=user.id).exists():
            raise CommandError(f'Email "{email}" is already in use by another user')

        # Update email and mark as verified
        user.email = email
        user.is_email_verified = True
        user.email_verification_token = None
        user.verification_sent_at = None
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Successfully updated admin "{username}":\n'
                f'   Email: {email}\n'
                f'   Email Verified: Yes\n'
                f'   Can now login without email verification'
            )
        )
