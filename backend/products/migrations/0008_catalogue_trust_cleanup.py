from django.db import migrations, models
import django.core.validators
from decimal import Decimal


def clean_catalogue(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    Category = apps.get_model('products', 'Category')

    # Keep the existing slug so saved links continue to work.
    Product.objects.filter(name__iexact='Carrotts').update(name='Carrots')

    grains = Category.objects.filter(slug__in=['cereals-grains', 'grains']).first()
    if grains:
        Product.objects.filter(name__iexact='Millet').update(category=grains)
        Product.objects.filter(name__iexact='Corn Flour').update(category=grains)
        Product.objects.filter(name__iexact='Wheat flour').update(category=grains)

    vegetables = Category.objects.filter(slug='vegetables').first()
    if vegetables:
        Product.objects.filter(name__iexact='Bell Pepper').update(category=vegetables)

    # A zero price is incomplete catalogue data, not a free product.
    Product.objects.filter(price__lte=0).update(is_available=False, is_featured=False)


class Migration(migrations.Migration):
    dependencies = [('products', '0006_product_business_supply_category')]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='price',
            field=models.DecimalField(
                decimal_places=2,
                max_digits=10,
                validators=[
                    django.core.validators.MinValueValidator(
                        Decimal('0.01'), message='Enter a confirmed price above zero.'
                    )
                ],
            ),
        ),
        migrations.RunPython(clean_catalogue, migrations.RunPython.noop),
    ]
