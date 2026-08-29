from unittest.mock import patch

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from .models import B2BProfile, User

REGISTER_URL = '/api/users/register/'
TOKEN_URL = '/api/auth/token/'
VERIFY_URL = '/api/users/verify-email/'
RESEND_URL = '/api/users/resend-verification/'
GOOGLE_URL = '/api/users/google/'
B2B_APPLY_URL = '/api/users/b2b/apply/'

STRONG = 'StrongPass123'


def reg_payload(email='new@example.com'):
    return {
        'email': email,
        'first_name': 'New',
        'last_name': 'User',
        'password': STRONG,
        'password_confirm': STRONG,
    }


def b2b_payload(email='trade@example.com'):
    return {
        'company_name': 'Market Kitchen',
        'business_type': 'restaurant',
        'legal_structure': 'limited_shares',
        'sector': 'Hospitality',
        'organization_tin': 'C0001234567',
        'business_registration': 'CS123456789',
        'verification_document_type': 'orc_certificate',
        'verification_document': SimpleUploadedFile(
            'certificate.pdf', b'%PDF-1.4\nvalid test document',
            content_type='application/pdf',
        ),
        'contact_person': 'Ama Mensah',
        'contact_job_title': 'Procurement Manager',
        'business_phone': '+233200000000',
        'business_email': email,
        'delivery_region': 'Greater Accra',
        'delivery_city': 'Accra',
        'delivery_locality': 'Osu',
        'ghana_post_gps': 'GA-123-4567',
        'receiving_contact_name': 'Kojo Asare',
        'receiving_contact_phone': '0200000000',
        'receiving_hours': 'Monday to Friday, 8:00–16:00',
        'delivery_latitude': '5.556020',
        'delivery_longitude': '-0.182830',
        'produce_categories': '["Tomatoes", "Onions"]',
        'order_frequency': 'weekly',
        'applicant_authorized': 'true',
        'information_confirmed': 'true',
        'privacy_acknowledged': 'true',
    }


class RegistrationGatingTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('users.emails.resend.Emails.send')
    def test_register_creates_account_but_issues_no_jwt(self, mock_send):
        resp = self.client.post(REGISTER_URL, reg_payload(), format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertNotIn('access', resp.data)
        self.assertNotIn('refresh', resp.data)
        self.assertTrue(resp.data.get('email_verification_required'))

        user = User.objects.get(email='new@example.com')
        self.assertFalse(user.email_verified)
        self.assertTrue(user.email_verification_token)

    @patch('users.emails.resend.Emails.send')
    def test_register_sends_verification_email_not_welcome(self, mock_send):
        self.client.post(REGISTER_URL, reg_payload(), format='json')
        subjects = [call.args[0]['subject'] for call in mock_send.call_args_list]
        self.assertTrue(any('Verify' in s for s in subjects), subjects)
        self.assertFalse(any('Welcome' in s for s in subjects), subjects)

    @patch('users.emails.resend.Emails.send')
    def test_register_is_throttled_after_limit(self, mock_send):
        codes = []
        for i in range(6):  # register scope is 5/hour
            r = self.client.post(REGISTER_URL, reg_payload(f'bot{i}@example.com'), format='json')
            codes.append(r.status_code)
        self.assertEqual(codes[-1], 429, codes)

    @patch('users.emails.resend.Emails.send')
    def test_spoofed_forwarded_for_does_not_bypass_throttle(self, mock_send):
        # NUM_PROXIES=1 → identity is the LAST X-Forwarded-For hop (127.0.0.1 here),
        # so varying the client-supplied FIRST value must NOT mint new identities.
        codes = []
        for i in range(6):
            r = self.client.post(
                REGISTER_URL, reg_payload(f'spoof{i}@example.com'), format='json',
                HTTP_X_FORWARDED_FOR=f'{i}.{i}.{i}.{i}, 127.0.0.1',
            )
            codes.append(r.status_code)
        self.assertEqual(codes[-1], 429, codes)

    @override_settings(TURNSTILE_ENABLED=True, TURNSTILE_SECRET_KEY='secret')
    @patch('users.turnstile.requests.post')
    @patch('users.emails.resend.Emails.send')
    def test_registration_blocked_when_turnstile_fails(self, mock_send, mock_post):
        mock_post.return_value.json.return_value = {'success': False}
        resp = self.client.post(REGISTER_URL, reg_payload(), format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertFalse(User.objects.filter(email='new@example.com').exists())


class B2BApplicationBotProtectionTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.email_patcher = patch('users.emails.resend.Emails.send', return_value={'id': 'email_test'})
        self.mock_email_send = self.email_patcher.start()
        self.addCleanup(self.email_patcher.stop)

    @override_settings(TURNSTILE_ENABLED=True, TURNSTILE_SECRET_KEY='secret')
    def test_missing_turnstile_token_cannot_create_application(self):
        resp = self.client.post(B2B_APPLY_URL, b2b_payload(), format='multipart')
        self.assertEqual(resp.status_code, 400)
        self.assertFalse(B2BProfile.objects.exists())

    @override_settings(TURNSTILE_ENABLED=True, TURNSTILE_SECRET_KEY='secret')
    @patch('users.turnstile.requests.post')
    def test_failed_turnstile_cannot_create_application(self, mock_post):
        mock_post.return_value.json.return_value = {'success': False}
        payload = {**b2b_payload(), 'turnstile_token': 'fake-token'}
        resp = self.client.post(B2B_APPLY_URL, payload, format='multipart')
        self.assertEqual(resp.status_code, 400)
        self.assertFalse(B2BProfile.objects.exists())

    @override_settings(TURNSTILE_ENABLED=True, TURNSTILE_SECRET_KEY='secret')
    @patch('users.turnstile.requests.post')
    def test_valid_turnstile_preserves_real_application_flow(self, mock_post):
        mock_post.return_value.json.return_value = {'success': True}
        payload = {**b2b_payload(), 'turnstile_token': 'valid-token'}
        resp = self.client.post(B2B_APPLY_URL, payload, format='multipart')
        self.assertEqual(resp.status_code, 201, resp.data)
        profile = B2BProfile.objects.get(business_email='trade@example.com')
        self.assertEqual(str(profile.delivery_latitude), '5.556020')
        self.assertEqual(str(profile.delivery_longitude), '-0.182830')
        email = self.mock_email_send.call_args.args[0]
        self.assertEqual(email['to'], ['trade@example.com'])
        self.assertEqual(email['reply_to'], 'operations@legitorganic.com')
        self.assertEqual(email['from'], 'Legit Organic <operations@legitorganic.com>')
        self.assertIn('text', email)
        self.assertIn('LO-B2B-', email['subject'])
        self.assertIn('/images/email-logo-dark.png', email['html'])


@override_settings(TURNSTILE_ENABLED=False)
class B2BApplicationValidationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.email_patcher = patch('users.emails.resend.Emails.send', return_value={'id': 'email_test'})
        self.email_patcher.start()
        self.addCleanup(self.email_patcher.stop)

    def test_registered_business_requires_orc_number(self):
        payload = b2b_payload()
        payload['business_registration'] = ''
        response = self.client.post(B2B_APPLY_URL, payload, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertIn('business_registration', response.data)

    def test_public_institution_can_use_official_letter(self):
        payload = b2b_payload('school@example.com')
        payload.update({
            'legal_structure': 'public_institution',
            'business_registration': '',
            'verification_document_type': 'introductory_letter',
            'registration_exemption_reason': 'Public school established by the Government of Ghana.',
        })
        response = self.client.post(B2B_APPLY_URL, payload, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)

    def test_informal_operator_can_apply_with_identity_document(self):
        payload = b2b_payload('trader@example.com')
        payload.update({
            'registration_status': 'informal',
            'legal_structure': 'informal_operator',
            'company_name': 'Adwoa Tomato Supply',
            'organization_tin': '',
            'business_registration': '',
            'contact_job_title': 'Owner / operator',
            'verification_document_type': 'ghana_card',
            'registration_exemption_reason': 'Tomato and onion trader operating at Madina Market.',
        })
        response = self.client.post(B2B_APPLY_URL, payload, format='multipart')
        self.assertEqual(response.status_code, 201, response.data)
        profile = B2BProfile.objects.get(business_email='trader@example.com')
        self.assertEqual(profile.registration_status, 'informal')
        self.assertEqual(profile.legal_structure, 'informal_operator')

    def test_application_rejects_products_outside_b2b_scope(self):
        payload = b2b_payload()
        payload['produce_categories'] = '["Fresh fruit"]'
        response = self.client.post(B2B_APPLY_URL, payload, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertIn('produce_categories', response.data)

    def test_document_content_is_checked(self):
        payload = b2b_payload()
        payload['verification_document'] = SimpleUploadedFile(
            'certificate.pdf', b'not really a pdf', content_type='application/pdf'
        )
        response = self.client.post(B2B_APPLY_URL, payload, format='multipart')
        self.assertEqual(response.status_code, 400)
        self.assertIn('verification_document', response.data)

    def test_document_download_requires_staff(self):
        response = self.client.get('/api/users/b2b/999/document/')
        self.assertIn(response.status_code, (401, 403))


class LoginGatingTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def _make(self, email, verified, staff=False):
        return User.objects.create_user(
            email=email, password=STRONG, first_name='A', last_name='B',
            email_verified=verified, is_staff=staff,
        )

    def test_unverified_non_staff_cannot_obtain_token(self):
        self._make('u@example.com', verified=False)
        resp = self.client.post(TOKEN_URL, {'email': 'u@example.com', 'password': STRONG}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('verify', str(resp.data).lower())

    def test_verified_user_can_obtain_token(self):
        self._make('v@example.com', verified=True)
        resp = self.client.post(TOKEN_URL, {'email': 'v@example.com', 'password': STRONG}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
        self.assertNotIn('refresh', resp.data)
        self.assertIn('refresh_token', resp.cookies)
        self.assertTrue(resp.cookies['refresh_token']['httponly'])

    def test_refresh_cookie_rotates_without_exposing_refresh_token(self):
        self._make('rotate@example.com', verified=True)
        login = self.client.post(
            TOKEN_URL,
            {'email': 'rotate@example.com', 'password': STRONG},
            format='json',
        )
        original = login.cookies['refresh_token'].value
        self.client.cookies['refresh_token'] = original

        response = self.client.post('/api/auth/token/refresh/', {}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)
        self.assertNotIn('refresh', response.data)
        self.assertIn('refresh_token', response.cookies)
        self.assertNotEqual(original, response.cookies['refresh_token'].value)

    def test_logout_revokes_cookie_and_clears_it(self):
        self._make('logout@example.com', verified=True)
        login = self.client.post(
            TOKEN_URL,
            {'email': 'logout@example.com', 'password': STRONG},
            format='json',
        )
        self.client.cookies['refresh_token'] = login.cookies['refresh_token'].value

        response = self.client.post('/api/auth/logout/', {}, format='json')

        self.assertEqual(response.status_code, 204)
        self.assertEqual(response.cookies['refresh_token']['max-age'], 0)

    def test_cookie_auth_actions_reject_untrusted_origins(self):
        self._make('origin@example.com', verified=True)
        login = self.client.post(
            TOKEN_URL,
            {'email': 'origin@example.com', 'password': STRONG},
            format='json',
        )
        self.client.cookies['refresh_token'] = login.cookies['refresh_token'].value

        response = self.client.post(
            '/api/auth/token/refresh/', {}, format='json',
            HTTP_ORIGIN='https://attacker.example',
        )

        self.assertEqual(response.status_code, 403)

    def test_existing_staff_jwt_is_rejected_by_customer_api(self):
        staff = self._make('existing-staff@example.com', verified=True, staff=True)
        access = str(RefreshToken.for_user(staff).access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

        response = self.client.get('/api/users/me/')

        self.assertEqual(response.status_code, 401)
        self.assertIn('staff portal', str(response.data).lower())

    def test_staff_must_use_secure_staff_portal(self):
        self._make('s@example.com', verified=False, staff=True)
        resp = self.client.post(TOKEN_URL, {'email': 's@example.com', 'password': STRONG}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('staff portal', str(resp.data).lower())


class VerifyEmailTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('users.emails.resend.Emails.send')
    def test_verify_marks_verified_logs_in_and_sends_welcome(self, mock_send):
        user = User.objects.create_user(
            email='p@example.com', password=STRONG, first_name='P', last_name='Q',
            email_verified=False, email_verification_token='tok123',
            email_verification_sent_at=timezone.now(),
        )
        resp = self.client.get(f'{VERIFY_URL}?token=tok123')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)

        user.refresh_from_db()
        self.assertTrue(user.email_verified)
        self.assertEqual(user.email_verification_token, '')

        subjects = [call.args[0]['subject'] for call in mock_send.call_args_list]
        self.assertTrue(any('Welcome' in s for s in subjects), subjects)

    def test_verify_with_bad_token_fails(self):
        resp = self.client.get(f'{VERIFY_URL}?token=does-not-exist')
        self.assertEqual(resp.status_code, 400)

    def test_expired_token_is_rejected(self):
        from datetime import timedelta
        user = User.objects.create_user(
            email='exp@example.com', password=STRONG, first_name='E', last_name='X',
            email_verified=False, email_verification_token='exptok',
            email_verification_sent_at=timezone.now() - timedelta(hours=25),
        )
        resp = self.client.get(f'{VERIFY_URL}?token=exptok')
        self.assertEqual(resp.status_code, 400)
        user.refresh_from_db()
        self.assertFalse(user.email_verified)

    def test_token_without_timestamp_is_rejected(self):
        # Invariant: a missing send timestamp means invalid, not valid-forever.
        user = User.objects.create_user(
            email='nots@example.com', password=STRONG, first_name='N', last_name='S',
            email_verified=False, email_verification_token='notstok',
            email_verification_sent_at=None,
        )
        resp = self.client.get(f'{VERIFY_URL}?token=notstok')
        self.assertEqual(resp.status_code, 400)
        user.refresh_from_db()
        self.assertFalse(user.email_verified)

    @patch('users.emails.resend.Emails.send')
    def test_fresh_token_within_window_is_accepted(self, mock_send):
        from django.utils import timezone
        user = User.objects.create_user(
            email='fresh@example.com', password=STRONG, first_name='F', last_name='R',
            email_verified=False, email_verification_token='freshtok',
            email_verification_sent_at=timezone.now(),
        )
        resp = self.client.get(f'{VERIFY_URL}?token=freshtok')
        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.email_verified)


class GoogleAuthTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('users.views.verify_google_token')
    def test_google_rejected_when_email_unverified(self, mock_verify):
        mock_verify.return_value = {
            'google_id': '1', 'email': 'g@example.com', 'first_name': 'G',
            'last_name': 'Oogle', 'avatar': '', 'email_verified': False,
        }
        resp = self.client.post(GOOGLE_URL, {'token': 'abc'}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertFalse(User.objects.filter(email='g@example.com').exists())

    @patch('users.emails.resend.Emails.send')
    @patch('users.views.verify_google_token')
    def test_google_accepted_when_email_verified(self, mock_verify, mock_send):
        mock_verify.return_value = {
            'google_id': '1', 'email': 'g2@example.com', 'first_name': 'G',
            'last_name': 'Oogle', 'avatar': '', 'email_verified': True,
        }
        resp = self.client.post(GOOGLE_URL, {'token': 'abc'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)


class ResendVerificationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    @patch('users.emails.resend.Emails.send')
    def test_unauthenticated_user_can_resend_by_email(self, mock_send):
        user = User.objects.create_user(
            email='r@example.com', password=STRONG, first_name='R', last_name='E',
            email_verified=False,
        )
        resp = self.client.post(RESEND_URL, {'email': 'r@example.com'}, format='json')
        self.assertEqual(resp.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.email_verification_token)

    def test_unknown_email_returns_generic_ok(self):
        # Must not reveal whether an account exists.
        resp = self.client.post(RESEND_URL, {'email': 'nobody@example.com'}, format='json')
        self.assertEqual(resp.status_code, 200)

    @patch('users.emails.resend.Emails.send')
    def test_anonymous_resend_is_enumeration_resistant(self, mock_send):
        # Unknown, verified, unverified, and delivery-failure must be indistinguishable.
        User.objects.create_user(
            email='ver@example.com', password=STRONG, first_name='V', last_name='R',
            email_verified=True,
        )
        User.objects.create_user(
            email='unv@example.com', password=STRONG, first_name='U', last_name='V',
            email_verified=False,
        )

        def call(email, fail=False):
            cache.clear()  # isolate from the resend throttle between probes
            if fail:
                with patch('users.views.send_verification_email', side_effect=Exception('smtp down')):
                    return self.client.post(RESEND_URL, {'email': email}, format='json')
            return self.client.post(RESEND_URL, {'email': email}, format='json')

        responses = [
            call('nobody@example.com'),      # unknown
            call('ver@example.com'),         # verified
            call('unv@example.com'),         # unverified (delivery succeeds)
            call('unv@example.com', fail=True),  # unverified (delivery fails)
        ]
        codes = {r.status_code for r in responses}
        bodies = {str(r.data) for r in responses}
        self.assertEqual(codes, {200}, codes)
        self.assertEqual(len(bodies), 1, bodies)  # every case returns the identical body
