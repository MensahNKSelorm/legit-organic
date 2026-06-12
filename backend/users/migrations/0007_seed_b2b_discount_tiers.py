from django.db import migrations


TIERS = [
    {
        'name': 'Silver',
        'min_order_amount': '200.00',
        'max_order_amount': '499.99',
        'discount_percent': '5.00',
        'description': 'Orders between GH₵200 and GH₵499.99',
    },
    {
        'name': 'Gold',
        'min_order_amount': '500.00',
        'max_order_amount': '999.99',
        'discount_percent': '10.00',
        'description': 'Orders between GH₵500 and GH₵999.99',
    },
    {
        'name': 'Platinum',
        'min_order_amount': '1000.00',
        'max_order_amount': None,
        'discount_percent': '15.00',
        'description': 'Orders of GH₵1,000 and above',
    },
]


def seed_tiers(apps, schema_editor):
    B2BDiscountTier = apps.get_model('users', 'B2BDiscountTier')
    for tier in TIERS:
        B2BDiscountTier.objects.get_or_create(
            name=tier['name'],
            defaults={
                'min_order_amount': tier['min_order_amount'],
                'max_order_amount': tier['max_order_amount'],
                'discount_percent': tier['discount_percent'],
                'description': tier['description'],
            },
        )


def unseed_tiers(apps, schema_editor):
    B2BDiscountTier = apps.get_model('users', 'B2BDiscountTier')
    B2BDiscountTier.objects.filter(name__in=['Silver', 'Gold', 'Platinum']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0006_add_b2b_models'),
    ]

    operations = [
        migrations.RunPython(seed_tiers, unseed_tiers),
    ]
