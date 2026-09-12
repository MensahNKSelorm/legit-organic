from django.db import migrations


def correct_bell_pepper_category(apps, schema_editor):
    Product = apps.get_model('products', 'Product')
    Category = apps.get_model('products', 'Category')

    vegetables = Category.objects.filter(name__iexact='Vegetables').first()
    if vegetables:
        Product.objects.filter(name__iexact='Bell Pepper').update(category=vegetables)


class Migration(migrations.Migration):
    dependencies = [('products', '0008_catalogue_trust_cleanup')]

    operations = [
        migrations.RunPython(correct_bell_pepper_category, migrations.RunPython.noop),
    ]
