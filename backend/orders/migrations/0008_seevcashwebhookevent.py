from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [('orders', '0007_order_checkout_expires_at_order_checkout_reference_and_more')]
    operations = [
        migrations.CreateModel(
            name='SeevCashWebhookEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_id', models.CharField(max_length=160, unique=True)),
                ('event_type', models.CharField(max_length=80)),
                ('payload_hash', models.CharField(max_length=64)),
                ('status', models.CharField(choices=[('processing', 'Processing'), ('processed', 'Processed'), ('ignored', 'Ignored'), ('failed', 'Failed')], default='processing', max_length=20)),
                ('error', models.CharField(blank=True, max_length=500)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('processed_at', models.DateTimeField(blank=True, null=True)),
                ('order', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='seevcash_webhook_events', to='orders.order')),
            ],
        ),
    ]
