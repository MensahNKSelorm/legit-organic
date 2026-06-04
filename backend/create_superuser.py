"""
Development superuser creation script.
Run with: venv/bin/python create_superuser.py
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'legitorganic.settings')
django.setup()

from users.models import User

EMAIL = 'admin@legitorganic.com'
PASSWORD = 'admin123'

if User.objects.filter(email=EMAIL).exists():
    print(f"Superuser '{EMAIL}' already exists.")
else:
    User.objects.create_superuser(
        email=EMAIL,
        password=PASSWORD,
        first_name='Ezra',
        last_name='Admin',
    )
    print(f"Superuser '{EMAIL}' created successfully.")
    print("  Email:    admin@legitorganic.com")
    print("  Password: admin123")
    print("  WARNING: Change this password before deploying to production.")
