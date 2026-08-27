from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('orders', '0011_business_supply_order_source'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='submission_report_attempts',
            field=models.PositiveSmallIntegerField(default=0, editable=False),
        ),
        migrations.AddField(
            model_name='order',
            name='submission_report_error',
            field=models.CharField(blank=True, editable=False, max_length=500),
        ),
        migrations.AddField(
            model_name='order',
            name='submission_report_sent_at',
            field=models.DateTimeField(blank=True, editable=False, null=True),
        ),
    ]
