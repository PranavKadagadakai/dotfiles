# Generated migration for multi-day events and AICTE points at event creation

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_cluborganizer_club'),
    ]

    operations = [
        migrations.AddField(
            model_name='event',
            name='end_date',
            field=models.DateField(blank=True, null=True, help_text='End date for multi-day events. If blank, same as event_date.'),
        ),
        migrations.AddField(
            model_name='event',
            name='aicte_activity_points',
            field=models.IntegerField(blank=True, null=True, help_text='Activity points allocated for participating in this event.'),
        ),
        migrations.AddField(
            model_name='event',
            name='aicte_category',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='events', to='api.aictecategory', help_text='AICTE category for this event\'s points.'),
        ),
        migrations.AlterField(
            model_name='hallbooking',
            name='event',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='hall_bookings', to='api.event', help_text='Event for which the hall is being booked.'),
        ),
    ]
