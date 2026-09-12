from decimal import Decimal

from django.contrib.auth.models import Group, Permission
from django.conf import settings
from django.test import RequestFactory, TestCase, override_settings

from legitorganic.dashboard import dashboard_callback
from orders.models import GrowthEvent, Order, OrderItem
from products.models import Product
from users.models import User


@override_settings(STAFF_2FA_MODE='enroll', STAFF_OWNER_2FA_REQUIRED=False)
class DashboardCallbackTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.owner = User.objects.create_superuser(
            email='owner@legitorganic.com',
            password='test-pass',
            first_name='Ama',
        )
        cls.customer = User.objects.create_user(
            email='customer@example.com',
            password='test-pass',
        )
        cls.product = Product.objects.create(
            name='Organic Tomatoes',
            price=Decimal('20.00'),
            unit='crate',
        )

    def request_for(self, user):
        request = RequestFactory().get('/admin/')
        request.user = user
        return request

    def create_order(self, reference, *, payment_status, source='seevcash', amount='100.00'):
        return Order.objects.create(
            user=self.customer,
            reference=reference,
            payment_status=payment_status,
            status='paid' if payment_status == 'success' else 'pending',
            order_source=source,
            total_amount=Decimal(amount),
            delivery_address='Accra',
        )

    def test_revenue_uses_successful_payments_only_and_window_includes_today(self):
        paid = self.create_order('PAID-1', payment_status='success', amount='120.00')
        self.create_order('PENDING-1', payment_status='pending', amount='900.00')
        OrderItem.objects.create(
            order=paid,
            product=self.product,
            quantity=3,
            unit_price=Decimal('20.00'),
        )

        context = dashboard_callback(self.request_for(self.owner), {})

        self.assertEqual(context['kpi']['total_revenue'], 'GH₵ 120.00')
        self.assertEqual(len(context['chart_revenue_labels']), 30)
        self.assertEqual(context['chart_revenue_data'][-1], 120.0)
        self.assertEqual(context['chart_orders_data'][-1], 1)

    def test_channel_chart_includes_every_current_order_source(self):
        for index, source in enumerate(
            ('seevcash', 'subscription', 'business_supply', 'paystack', 'whatsapp')
        ):
            self.create_order(
                f'SOURCE-{index}',
                payment_status='success',
                source=source,
            )

        context = dashboard_callback(self.request_for(self.owner), {})

        self.assertEqual(
            context['chart_channel_labels'],
            [
                'Online checkout',
                'Subscriptions',
                'Business supply',
                'Paystack (legacy)',
                'WhatsApp',
            ],
        )
        self.assertEqual(context['chart_channel_data'], [1, 1, 1, 1, 1])

    def test_attention_queue_hides_zeroes_and_respects_permissions(self):
        staff = User.objects.create_user(
            email='catalogue@legitorganic.com',
            password='test-pass',
            is_staff=True,
        )
        staff.user_permissions.add(Permission.objects.get(codename='view_product'))
        self.product.is_available = False
        self.product.save(update_fields=['is_available'])
        self.create_order('HIDDEN-ORDER', payment_status='pending', source='whatsapp')

        context = dashboard_callback(self.request_for(staff), {})

        self.assertEqual(
            [(item['label'], item['count']) for item in context['attention_items']],
            [('Unavailable products', 1)],
        )
        self.assertEqual(context['attention_total'], 1)

    def test_critical_work_is_sorted_before_lower_priority_work(self):
        self.product.is_available = False
        self.product.save(update_fields=['is_available'])
        waiting = self.create_order('WAITING-1', payment_status='pending', source='whatsapp')
        waiting.status = 'whatsapp_pending'
        waiting.save(update_fields=['status'])

        context = dashboard_callback(self.request_for(self.owner), {})

        priorities = [item['priority'] for item in context['attention_items']]
        priority_order = {'critical': 0, 'high': 1, 'normal': 2, 'low': 3}
        self.assertEqual(priorities, sorted(priorities, key=priority_order.get))
        self.assertEqual(priorities, ['high', 'low'])

    def test_operational_views_are_permission_aware_and_keep_zero_count_queues(self):
        preparing = self.create_order('PREP-1', payment_status='success')
        Order.objects.filter(pk=preparing.pk).update(status='processing')
        self.create_order('ABANDONED-1', payment_status='failed')
        mismatch = self.create_order('MISMATCH-1', payment_status='failed')
        Order.objects.filter(pk=mismatch.pk).update(status='paid')

        owner_context = dashboard_callback(self.request_for(self.owner), {})
        order_views = {
            item['label']: item for item in owner_context['operational_views'][:3]
        }

        self.assertEqual(order_views['Orders to prepare']['count'], 1)
        self.assertEqual(order_views['Ready for delivery']['count'], 0)
        self.assertEqual(order_views['Payment exceptions']['count'], 1)
        self.assertIn('payment_exception=yes', order_views['Payment exceptions']['href'])
        self.client.force_login(self.owner)
        for item in order_views.values():
            self.assertEqual(self.client.get(item['href']).status_code, 200)

        staff = User.objects.create_user(
            email='content@legitorganic.com', password='test-pass', is_staff=True
        )
        staff.user_permissions.add(Permission.objects.get(codename='view_recipe'))
        staff_context = dashboard_callback(self.request_for(staff), {})
        self.assertEqual(
            [item['label'] for item in staff_context['operational_views']],
            ['Recipes awaiting review'],
        )

    def test_admin_dashboard_renders_local_chart_asset_and_safe_chart_data(self):
        self.client.force_login(self.owner)

        response = self.client.get('/admin/')

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Today’s work')
        self.assertContains(response, '/static/admin/vendor/chart.umd.min.js')
        self.assertContains(response, 'id="chart-revenue-labels"')
        self.assertContains(response, 'Work views')
        self.assertContains(response, "switchTheme('light')")
        self.assertContains(response, "switchTheme('dark')")
        self.assertContains(response, "switchTheme('auto')")

    def test_admin_theme_allows_staff_to_choose_their_preference(self):
        self.assertIsNone(settings.UNFOLD['THEME'])

    def test_growth_funnel_is_visible_to_sales_but_not_content_staff(self):
        GrowthEvent.objects.create(event='page_view', session_hash='visit')
        GrowthEvent.objects.create(event='add_to_cart', session_hash='visit')
        sales = User.objects.create_user(
            email='growth@legitorganic.com', password='test-pass', is_staff=True
        )
        sales.groups.add(Group.objects.create(name='Sales & Marketing'))
        content = User.objects.create_user(
            email='writer@legitorganic.com', password='test-pass', is_staff=True
        )
        content.groups.add(Group.objects.create(name='Content Team'))

        sales_context = dashboard_callback(self.request_for(sales), {})
        content_context = dashboard_callback(self.request_for(content), {})

        self.assertTrue(sales_context['can_see_growth'])
        self.assertEqual(sales_context['growth_funnel'][0]['count'], 1)
        self.assertFalse(content_context['can_see_growth'])
        self.assertEqual(content_context['growth_funnel'], [])

    def test_sensitive_sidebar_links_are_role_focused_and_owner_keeps_access(self):
        staff = User.objects.create_user(
            email='content-nav@legitorganic.com', password='test-pass', is_staff=True
        )
        staff.groups.add(Group.objects.create(name='Content Team'))
        request = self.request_for(staff)

        sections = settings.UNFOLD['SIDEBAR']['navigation']
        items = {
            item['title']: item
            for section in sections
            for item in section['items']
        }

        self.assertFalse(items['Security audit']['permission'](request))
        self.assertFalse(items['Wigal SMS Dashboard']['permission'](request))
        self.assertTrue(items['View Recipes']['permission'](request))

        owner_request = self.request_for(self.owner)
        self.assertTrue(items['Security audit']['permission'](owner_request))
        self.assertTrue(items['Wigal SMS Dashboard']['permission'](owner_request))
        self.assertTrue(items['View Recipes']['permission'](owner_request))

    def test_recipe_list_uses_a_purposeful_empty_state(self):
        self.client.force_login(self.owner)

        response = self.client.get('/admin/recipes/recipe/')

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'No recipes yet')
        self.assertContains(response, 'Create recipe')
        self.assertNotContains(response, '0 recipes')
