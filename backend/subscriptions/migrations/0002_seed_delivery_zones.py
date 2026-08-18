from django.db import migrations


ZONES = [
    ('Accra Central', 'accra-central', 2, '25.00', 0),
    ('Accra East', 'accra-east', 3, '30.00', 1),
    ('Accra West', 'accra-west', 4, '30.00', 2),
    ('Tema', 'tema', 4, '35.00', 3),
]

PLANS = [
    ('Solo', 'solo', 'A practical weekly mix for one.', '145.00', 1, 0),
    ('Family', 'family', 'Staples and fresh produce for a family.', '295.00', 4, 1),
    ('Large household', 'large-household', 'A fuller basket for busy homes.', '460.00', 6, 2),
]


def seed_zones(apps, schema_editor):
    DeliveryZone = apps.get_model('subscriptions', 'DeliveryZone')
    for name, slug, weekday, fee, order in ZONES:
        DeliveryZone.objects.get_or_create(
            slug=slug,
            defaults={
                'name': name, 'delivery_weekday': weekday,
                'cutoff_hours': 48, 'delivery_fee': fee,
                'display_order': order,
            },
        )
    SubscriptionPlan = apps.get_model('subscriptions', 'SubscriptionPlan')
    for name, slug, description, price, size, order in PLANS:
        SubscriptionPlan.objects.get_or_create(
            slug=slug,
            defaults={
                'name': name, 'audience': 'household', 'plan_type': 'curated',
                'short_description': description, 'weekly_price': price,
                'household_size': size, 'is_featured': slug == 'family',
                'display_order': order,
            },
        )


class Migration(migrations.Migration):
    dependencies = [('subscriptions', '0001_initial')]
    operations = [migrations.RunPython(seed_zones, migrations.RunPython.noop)]
