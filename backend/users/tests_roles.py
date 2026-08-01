from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import TestCase


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

    def test_operations_cannot_delete_orders(self):
        permissions = self.permissions_for('Operations')
        self.assertIn(('orders', 'change_order'), permissions)
        self.assertNotIn(('orders', 'delete_order'), permissions)
