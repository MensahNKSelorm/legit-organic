"""Test-only settings.

Runs the suite against in-memory SQLite so tests need no Postgres/createdb
privileges, keeps throttle state in local-memory cache, and never makes real
network/email calls. Import with:

    python manage.py test --settings=legitorganic.settings_test
"""
from .settings import *  # noqa: F401,F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Deterministic, isolated throttle state per process.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Faster hashing for tests.
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

# Ensure Turnstile is inert in tests unless a test explicitly overrides it.
TURNSTILE_ENABLED = False
TURNSTILE_SECRET_KEY = ''

# Known currency for payment-verification tests.
PAYSTACK_CURRENCY = 'GHS'
