"""Tests for security-settings parsing and the DEBUG-gated production hardening.

These test the helpers directly (no settings reload needed), so they cover both
debug and production modes deterministically.

Run: python manage.py test legitorganic.tests_settings --settings=legitorganic.settings_test
"""
import os
from unittest import mock

from django.test import SimpleTestCase

from legitorganic.settings import _env_bool, production_security_settings


class EnvBoolTests(SimpleTestCase):
    def test_absent_defaults_to_false(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertFalse(_env_bool('DEBUG'))

    def test_absent_honours_explicit_default(self):
        with mock.patch.dict(os.environ, {}, clear=True):
            self.assertTrue(_env_bool('SOME_FLAG', 'True'))

    def test_truthy_values(self):
        for v in ['True', 'true', 'TRUE', '1', 'yes', 'on', '  true  ']:
            with mock.patch.dict(os.environ, {'DEBUG': v}):
                self.assertTrue(_env_bool('DEBUG'), f'{v!r} should parse truthy')

    def test_falsy_and_garbage_values(self):
        for v in ['False', 'false', '0', 'no', 'off', '', 'garbage', 'maybe']:
            with mock.patch.dict(os.environ, {'DEBUG': v}):
                self.assertFalse(_env_bool('DEBUG'), f'{v!r} should parse falsy')


class ProductionSecuritySettingsTests(SimpleTestCase):
    def test_debug_mode_leaves_defaults_untouched(self):
        # Empty dict => dev keeps Django's http-friendly defaults => usable.
        self.assertEqual(production_security_settings(True), {})

    def test_production_mode_hardening(self):
        s = production_security_settings(False)
        self.assertIs(s['SESSION_COOKIE_SECURE'], True)
        self.assertIs(s['CSRF_COOKIE_SECURE'], True)
        self.assertIs(s['SECURE_SSL_REDIRECT'], True)
        self.assertEqual(s['SECURE_HSTS_SECONDS'], 300)
        self.assertIs(s['SECURE_HSTS_INCLUDE_SUBDOMAINS'], False)
        self.assertIs(s['SECURE_HSTS_PRELOAD'], False)


class LiveSettingsInvariantsTests(SimpleTestCase):
    def test_csrf_cookie_not_httponly(self):
        # Frontend JS may need the CSRF token — must never be HttpOnly.
        from django.conf import settings
        self.assertFalse(settings.CSRF_COOKIE_HTTPONLY)

    def test_proxy_ssl_header_configured(self):
        # Required so Secure cookies / SSL redirect work behind nginx TLS.
        from django.conf import settings
        self.assertEqual(
            settings.SECURE_PROXY_SSL_HEADER, ('HTTP_X_FORWARDED_PROTO', 'https')
        )
