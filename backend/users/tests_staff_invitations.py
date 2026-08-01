from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth.models import Group
from django.test import Client, TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .forms import StaffInvitationAdminForm
from .models import StaffInvitation, User


@override_settings(DASHBOARD_URL='https://dashboard.example.com')
class StaffInvitationTests(TestCase):
    password = 'StrongField!2026'

    @classmethod
    def setUpTestData(cls):
        cls.role = Group.objects.create(name='Product Manager')
        cls.owner = User.objects.create_superuser(
            email='owner@legitorganic.com',
            password='OwnerPass!2026',
            first_name='Owner',
            last_name='Account',
        )

    def make_invitation(self, **overrides):
        data = {
            'first_name': 'Ama',
            'last_name': 'Mensah',
            'company_email': 'ama.mensah@legitorganic.com',
            'delivery_email': 'ama@example.com',
            'role': self.role.name,
            'invited_by': self.owner,
        }
        data.update(overrides)
        invitation = StaffInvitation(**data)
        token = invitation.issue_token()
        invitation.save()
        return invitation, token

    def test_raw_token_is_never_stored(self):
        invitation, token = self.make_invitation()
        self.assertNotEqual(invitation.token_digest, token)
        self.assertEqual(invitation.token_digest, StaffInvitation.digest_token(token))

    def test_admin_form_generates_company_email(self):
        form = StaffInvitationAdminForm(data={
            'first_name': 'Akosua',
            'last_name': 'Boateng',
            'company_email': '',
            'delivery_email': 'akosua@example.com',
            'role': self.role.name,
        })
        self.assertTrue(form.is_valid(), form.errors)
        self.assertEqual(
            form.cleaned_data['company_email'],
            'akosua.boateng@legitorganic.com',
        )

    def test_setup_creates_active_role_scoped_staff_account(self):
        invitation, token = self.make_invitation()
        response = self.client.post(
            reverse('staff-setup', args=[token]),
            {'new_password1': self.password, 'new_password2': self.password},
        )
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "You're in")

        user = User.objects.get(email=invitation.company_email)
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.check_password(self.password))
        self.assertEqual(list(user.groups.values_list('name', flat=True)), [self.role.name])
        invitation.refresh_from_db()
        self.assertIsNotNone(invitation.accepted_at)

    def test_setup_link_cannot_be_reused(self):
        invitation, token = self.make_invitation()
        payload = {'new_password1': self.password, 'new_password2': self.password}
        self.assertEqual(self.client.post(reverse('staff-setup', args=[token]), payload).status_code, 200)
        response = self.client.post(reverse('staff-setup', args=[token]), payload)
        self.assertEqual(response.status_code, 410)
        self.assertEqual(User.objects.filter(email=invitation.company_email).count(), 1)

    def test_expired_and_revoked_links_are_rejected(self):
        expired, expired_token = self.make_invitation()
        expired.expires_at = timezone.now() - timedelta(seconds=1)
        expired.save(update_fields=['expires_at'])
        self.assertEqual(
            self.client.get(reverse('staff-setup', args=[expired_token])).status_code,
            410,
        )

        revoked, revoked_token = self.make_invitation(
            company_email='revoked@legitorganic.com'
        )
        revoked.revoked_at = timezone.now()
        revoked.save(update_fields=['revoked_at'])
        self.assertEqual(
            self.client.get(reverse('staff-setup', args=[revoked_token])).status_code,
            410,
        )

    def test_invalid_link_is_not_cached_or_indexed(self):
        response = self.client.get(reverse('staff-setup', args=['x' * 43]))
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response['Referrer-Policy'], 'same-origin')
        self.assertEqual(response['X-Robots-Tag'], 'noindex, nofollow')
        self.assertIn('no-store', response['Cache-Control'])

    def test_https_setup_submission_passes_real_csrf_checks(self):
        invitation, token = self.make_invitation()
        csrf_client = Client(enforce_csrf_checks=True)
        path = reverse('staff-setup', args=[token])
        get_response = csrf_client.get(
            path, secure=True, HTTP_HOST='localhost'
        )
        self.assertEqual(get_response.status_code, 200)
        self.assertEqual(get_response['Referrer-Policy'], 'same-origin')

        csrf_token = csrf_client.cookies['csrftoken'].value
        post_response = csrf_client.post(
            path,
            {
                'csrfmiddlewaretoken': csrf_token,
                'new_password1': self.password,
                'new_password2': self.password,
            },
            secure=True,
            HTTP_HOST='localhost',
            HTTP_REFERER=f'https://localhost{path}',
        )
        self.assertEqual(post_response.status_code, 200)
        self.assertTrue(User.objects.filter(email=invitation.company_email).exists())

    def test_existing_account_blocks_acceptance(self):
        invitation, token = self.make_invitation()
        User.objects.create_user(
            email=invitation.company_email,
            password='AlreadyHere!2026',
            first_name='Existing',
            last_name='User',
        )
        response = self.client.post(
            reverse('staff-setup', args=[token]),
            {'new_password1': self.password, 'new_password2': self.password},
        )
        self.assertEqual(response.status_code, 409)
        invitation.refresh_from_db()
        self.assertIsNone(invitation.accepted_at)

    def test_non_superuser_cannot_access_invitation_admin(self):
        executive = User.objects.create_user(
            email='executive@legitorganic.com',
            password='Executive!2026',
            first_name='Executive',
            last_name='User',
            is_staff=True,
        )
        executive.groups.add(Group.objects.create(name='Executive Admin'))
        self.client.force_login(executive)
        response = self.client.get(reverse('admin:users_staffinvitation_changelist'))
        self.assertEqual(response.status_code, 403)

    def test_staff_register_is_separate_from_customers_and_owner_only(self):
        staff = User.objects.create_user(
            email='staff@legitorganic.com',
            password='StaffPass!2026',
            first_name='Staff',
            last_name='Member',
            is_staff=True,
        )
        customer = User.objects.create_user(
            email='customer@example.com',
            password='Customer!2026',
            first_name='Customer',
            last_name='Member',
        )

        self.client.force_login(self.owner)
        owner_response = self.client.get(reverse('admin:users_staff_changelist'))
        self.assertEqual(owner_response.status_code, 200)
        self.assertContains(owner_response, staff.email)
        self.assertNotContains(owner_response, customer.email)

        self.client.force_login(staff)
        staff_response = self.client.get(reverse('admin:users_staff_changelist'))
        self.assertEqual(staff_response.status_code, 403)

    @patch('users.admin.StaffInvitationAdmin._deliver', return_value=True)
    def test_owner_can_create_invitation_in_admin(self, _deliver):
        self.client.force_login(self.owner)
        response = self.client.post(reverse('admin:users_staffinvitation_add'), {
            'first_name': 'Kojo',
            'last_name': 'Asare',
            'company_email': '',
            'delivery_email': 'kojo@example.com',
            'role': self.role.name,
            '_save': 'Save',
        })
        self.assertEqual(response.status_code, 302)
        invitation = StaffInvitation.objects.get(delivery_email='kojo@example.com')
        self.assertEqual(invitation.company_email, 'kojo.asare@legitorganic.com')
        self.assertEqual(invitation.invited_by, self.owner)
        self.assertTrue(invitation.token_digest)
