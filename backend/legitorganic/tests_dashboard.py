from decimal import Decimal

from django.contrib.auth.models import Permission
from django.conf import settings
from django.test import RequestFactory, TestCase

from legitorganic.dashboard import dashboard_callback
from orders.models import Order, OrderItem
from products.models import Product
from users.models import User


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

    def test_admin_dashboard_renders_local_chart_asset_and_safe_chart_data(self):
        self.client.force_login(self.owner)

        response = self.client.get('/admin/')

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Today’s work')
        self.assertContains(response, '/static/admin/vendor/chart.umd.min.js')
        self.assertContains(response, 'id="chart-revenue-labels"')

    def test_admin_theme_defaults_to_the_staff_device_preference(self):
        self.assertEqual(settings.UNFOLD['THEME'], 'auto')
