from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import TestCase
from django.urls import reverse
from django_otp.plugins.otp_totp.models import TOTPDevice
from unittest.mock import patch

from security.models import AuditEvent
from users.models import User


class StaffRolePermissionTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        call_command('setup_groups', verbosity=0)

    def permissions_for(self, group_name):
        return set(
            Group.objects.get(name=group_name).permissions.values_list(
                'content_type__app_label', 'codename'
            )
        )

    def test_executive_admin_cannot_manage_staff_security(self):
        permissions = self.permissions_for('Executive Admin')
        self.assertIn(('orders', 'change_order'), permissions)
        self.assertIn(('users', 'view_user'), permissions)
        self.assertIn(('users', 'view_customer'), permissions)
        self.assertNotIn(('users', 'change_user'), permissions)
        self.assertNotIn(('users', 'delete_user'), permissions)
        self.assertNotIn(('auth', 'change_group'), permissions)
        self.assertNotIn(('sales', 'change_commission'), permissions)

    def test_product_manager_is_limited_to_catalogue_and_demand(self):
        permissions = self.permissions_for('Product Manager')
        self.assertIn(('products', 'change_product'), permissions)
        self.assertIn(('products', 'change_productimage'), permissions)
        self.assertIn(('orders', 'view_order'), permissions)
        self.assertNotIn(('orders', 'change_order'), permissions)
        self.assertNotIn(('users', 'view_user'), permissions)
        self.assertNotIn(('blog', 'change_blogpost'), permissions)
        self.assertNotIn(('products', 'delete_product'), permissions)

    def test_operations_cannot_delete_orders(self):
        permissions = self.permissions_for('Operations')
        self.assertIn(('orders', 'change_order'), permissions)
        self.assertNotIn(('orders', 'delete_order'), permissions)

    def test_content_team_archives_instead_of_deleting(self):
        permissions = self.permissions_for('Content Team')
        self.assertIn(('blog', 'change_blogpost'), permissions)
        self.assertIn(('recipes', 'change_recipe'), permissions)
        self.assertNotIn(('blog', 'delete_blogpost'), permissions)
        self.assertNotIn(('recipes', 'delete_recipe'), permissions)


class StaffAccessAdminSecurityTests(TestCase):
    def setUp(self):
        call_command('setup_groups', verbosity=0)
        self.owner = User.objects.create_superuser(
            email='owner@legitorganic.com', password='OwnerPass123!',
            first_name='Owner', last_name='User',
        )
        TOTPDevice.objects.create(
            user=self.owner, name='Owner authenticator', confirmed=True,
        )
        self.staff = User.objects.create_user(
            email='staff@legitorganic.com', password='StaffPass123!',
            first_name='Staff', last_name='Member', is_staff=True,
        )
        self.operations = Group.objects.get(name='Operations')
        self.product_manager = Group.objects.get(name='Product Manager')
        self.staff.groups.add(self.operations)
        self.client.force_login(self.owner)

    def test_role_change_requires_owner_reauthentication_and_reason(self):
        # The form imports the verifier lazily, so patch the canonical function.
        with patch('security.auth.verify_staff_code', return_value=(True, False)):
            url = reverse('admin:users_staff_change', args=[self.staff.pk])
            denied = self.client.post(url, {
                'is_active': 'on', 'groups': [self.product_manager.pk],
                'access_change_reason': '', 'owner_password': 'wrong',
                'owner_otp_token': '000000', '_save': 'Save',
            })
            self.assertEqual(denied.status_code, 200)
            self.assertEqual(
                set(self.staff.groups.values_list('name', flat=True)), {'Operations'}
            )

            allowed = self.client.post(url, {
                'is_active': 'on', 'groups': [self.product_manager.pk],
                'access_change_reason': 'Moved to catalogue operations',
                'owner_password': 'OwnerPass123!', 'owner_otp_token': '123456',
                '_save': 'Save',
            })
            self.assertEqual(allowed.status_code, 302)

        self.staff.refresh_from_db()
        self.assertEqual(
            set(self.staff.groups.values_list('name', flat=True)), {'Product Manager'}
        )
        event = AuditEvent.objects.get(action='staff.access_changed')
        self.assertEqual(event.reason, 'Moved to catalogue operations')
        self.assertEqual(event.before['roles'], ['Operations'])
        self.assertEqual(event.after['roles'], ['Product Manager'])
