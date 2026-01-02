"""
Management command to clean up duplicate AICTE transactions for the same student-event pairs.
This command keeps the most appropriate transaction for each duplicate group before applying
the unique constraint.
"""

from django.core.management.base import BaseCommand
from django.db.models import Count
from api.models import AICTEPointTransaction


class Command(BaseCommand):
    help = 'Clean up duplicate AICTE transactions for same student-event pairs'

    def handle(self, *args, **options):
        self.stdout.write('Finding duplicate AICTE transactions...')

        # Find duplicates
        duplicates = AICTEPointTransaction.objects.values('student', 'event') \
            .annotate(count=Count('pk')).filter(count__gt=1)

        if not duplicates:
            self.stdout.write(self.style.SUCCESS('No duplicate transactions found.'))
            return

        self.stdout.write(f'Found {len(duplicates)} groups of duplicate transactions to clean...')

        cleaned = 0
        total_groups = len(duplicates)

        for i, dup in enumerate(duplicates, 1):
            student_id = dup['student']
            event_id = dup['event']

            # Get all transactions for this pair
            transactions = AICTEPointTransaction.objects.filter(
                student=student_id, event=event_id
            ).order_by('-updated_at')

            self.stdout.write(f'Processing group {i}/{total_groups}: Student {student_id}, Event {event_id}')

            # Priority: Keep APPROVED transactions, combine points if multiple
            approved_transactions = transactions.filter(status='APPROVED')

            if approved_transactions.count() > 1:
                # Multiple approved: combine into the most recent
                most_recent_approved = approved_transactions.first()
                total_points = sum(t.points_allocated for t in approved_transactions)
                most_recent_approved.points_allocated = total_points
                most_recent_approved.save()
                self.stdout.write(f'  Combined {approved_transactions.count()} approved transactions, total points: {total_points}')

                # Delete all others (including duplicates)
                deleted_count = transactions.exclude(pk=most_recent_approved.pk).delete()[0]
                cleaned += deleted_count

            elif approved_transactions.exists():
                # Single approved: keep it, delete others
                approved = approved_transactions.first()
                deleted_count = transactions.exclude(pk=approved.pk).delete()[0]
                self.stdout.write(f'  Kept approved transaction, deleted {deleted_count} others')

            else:
                # No approved: keep the most recent PENDING transaction
                most_recent = transactions.first()
                deleted_count = transactions.exclude(pk=most_recent.pk).delete()[0]
                self.stdout.write(f'  Kept most recent pending transaction, deleted {deleted_count} others')
                cleaned += deleted_count

        self.stdout.write(self.style.SUCCESS(
            f'Cleaned up {cleaned} duplicate transactions across {total_groups} groups.'
        ))
