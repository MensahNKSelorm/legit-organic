from django.db import migrations
from django.utils import timezone


def mark_existing_reports_historical(apps, schema_editor):
    """Do not emit milestone emails retroactively for pre-feature orders."""
    Order = apps.get_model('orders', 'Order')
    deployed_at = timezone.now()
    Order.objects.filter(
        payment_status='success', payment_report_sent_at__isnull=True,
    ).update(payment_report_sent_at=deployed_at)
    Order.objects.filter(
        status='delivered', delivery_report_sent_at__isnull=True,
    ).update(delivery_report_sent_at=deployed_at)


class Migration(migrations.Migration):
    dependencies = [
        ('orders', '0005_order_delivery_report_sent_at_and_more'),
    ]

    operations = [
        migrations.RunPython(mark_existing_reports_historical, migrations.RunPython.noop),
    ]
