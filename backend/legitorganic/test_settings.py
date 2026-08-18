"""Local test settings that do not require a running PostgreSQL service."""

from .settings import *  # noqa: F401,F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

DEBUG = True
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
MIDDLEWARE = [
    middleware for middleware in MIDDLEWARE
    if middleware != 'security.middleware.StaffSecurityMiddleware'
]
