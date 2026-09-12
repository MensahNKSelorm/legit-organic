from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ('orders', '0013_driver_order_dispatched_at_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='GrowthEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event', models.CharField(choices=[('page_view', 'Page view'), ('product_view', 'Product view'), ('recipe_view', 'Recipe view'), ('add_to_cart', 'Add to cart'), ('checkout_started', 'Checkout started'), ('order_created', 'Order created')], max_length=32)),
                ('session_hash', models.CharField(db_index=True, max_length=64)),
                ('path', models.CharField(blank=True, max_length=300)),
                ('object_type', models.CharField(blank=True, max_length=30)),
                ('object_id', models.CharField(blank=True, max_length=80)),
                ('object_label', models.CharField(blank=True, max_length=200)),
                ('source', models.CharField(blank=True, db_index=True, max_length=100)),
                ('medium', models.CharField(blank=True, max_length=100)),
                ('campaign', models.CharField(blank=True, db_index=True, max_length=160)),
                ('content', models.CharField(blank=True, max_length=160)),
                ('referrer_host', models.CharField(blank=True, max_length=200)),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='growth_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-created_at']},
        ),
        migrations.AddIndex(
            model_name='growthevent',
            index=models.Index(fields=['event', '-created_at'], name='orders_grow_event_946f3f_idx'),
        ),
    ]
