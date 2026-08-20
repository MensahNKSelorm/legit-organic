import users.models
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('users', '0011_businesspricelist_remove_b2bprofile_tier_and_more')]

    operations = [
        migrations.AddField(model_name='b2bprofile', name='trading_name', field=models.CharField(blank=True, max_length=200)),
        migrations.AddField(model_name='b2bprofile', name='legal_structure', field=models.CharField(choices=[('business_name','Business name / sole proprietor'),('partnership','Partnership'),('limited_shares','Company limited by shares'),('limited_guarantee','Company limited by guarantee / NGO'),('public_institution','Public institution / MDA / MMDA'),('cooperative','Cooperative'),('foreign_mission','Foreign mission / external organisation'),('other','Other')], default='business_name', max_length=40)),
        migrations.AddField(model_name='b2bprofile', name='sector', field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name='b2bprofile', name='year_started', field=models.PositiveSmallIntegerField(blank=True, null=True)),
        migrations.AddField(model_name='b2bprofile', name='website', field=models.URLField(blank=True)),
        migrations.AddField(model_name='b2bprofile', name='organization_tin', field=models.CharField(blank=True, max_length=50)),
        migrations.AddField(model_name='b2bprofile', name='verification_document_type', field=models.CharField(blank=True, choices=[('orc_certificate','ORC registration or incorporation certificate'),('introductory_letter','Official introductory or authorisation letter')], max_length=30)),
        migrations.AddField(model_name='b2bprofile', name='verification_document', field=models.FileField(blank=True, storage=users.models.PrivateB2BStorage(), upload_to='%Y/%m/')),
        migrations.AddField(model_name='b2bprofile', name='registration_exemption_reason', field=models.TextField(blank=True)),
        migrations.AddField(model_name='b2bprofile', name='contact_job_title', field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name='b2bprofile', name='alternative_phone', field=models.CharField(blank=True, max_length=20)),
        migrations.AddField(model_name='b2bprofile', name='delivery_region', field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name='b2bprofile', name='delivery_city', field=models.CharField(blank=True, max_length=100)),
        migrations.AddField(model_name='b2bprofile', name='delivery_district', field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name='b2bprofile', name='delivery_locality', field=models.CharField(blank=True, max_length=150)),
        migrations.AddField(model_name='b2bprofile', name='delivery_street', field=models.CharField(blank=True, max_length=200)),
        migrations.AddField(model_name='b2bprofile', name='ghana_post_gps', field=models.CharField(blank=True, max_length=20)),
        migrations.AddField(model_name='b2bprofile', name='delivery_landmark', field=models.CharField(blank=True, max_length=200)),
        migrations.AddField(model_name='b2bprofile', name='delivery_directions', field=models.TextField(blank=True)),
        migrations.AddField(model_name='b2bprofile', name='receiving_contact_name', field=models.CharField(blank=True, max_length=150)),
        migrations.AddField(model_name='b2bprofile', name='receiving_contact_phone', field=models.CharField(blank=True, max_length=20)),
        migrations.AddField(model_name='b2bprofile', name='receiving_hours', field=models.CharField(blank=True, max_length=200)),
        migrations.AddField(model_name='b2bprofile', name='access_restrictions', field=models.TextField(blank=True)),
        migrations.AddField(model_name='b2bprofile', name='produce_categories', field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name='b2bprofile', name='order_frequency', field=models.CharField(blank=True, choices=[('weekly','Weekly'),('fortnightly','Every two weeks'),('monthly','Monthly'),('ad_hoc','As needed')], max_length=20)),
        migrations.AddField(model_name='b2bprofile', name='preferred_start_date', field=models.DateField(blank=True, null=True)),
        migrations.AddField(model_name='b2bprofile', name='purchase_order_required', field=models.BooleanField(default=False)),
        migrations.AddField(model_name='b2bprofile', name='invoice_requirements', field=models.CharField(blank=True, max_length=250)),
        migrations.AddField(model_name='b2bprofile', name='procurement_notes', field=models.TextField(blank=True)),
        migrations.AddField(model_name='b2bprofile', name='applicant_authorized', field=models.BooleanField(default=False)),
        migrations.AddField(model_name='b2bprofile', name='information_confirmed', field=models.BooleanField(default=False)),
        migrations.AddField(model_name='b2bprofile', name='privacy_acknowledged', field=models.BooleanField(default=False)),
    ]
