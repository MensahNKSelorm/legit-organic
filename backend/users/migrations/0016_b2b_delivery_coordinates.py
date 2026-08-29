from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('users', '0015_alter_b2bprofile_business_type_and_more')]

    operations = [
        migrations.AddField(
            model_name='b2bprofile',
            name='delivery_latitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
        migrations.AddField(
            model_name='b2bprofile',
            name='delivery_longitude',
            field=models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True),
        ),
    ]
