from datetime import timedelta
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from django.core.management import call_command
from django.utils import timezone
from rest_framework.test import APITestCase

from products.models import Product
from users.models import B2BProfile, User

from .models import DeliveryZone, Subscription, SubscriptionWeek


class SubscriptionAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='family@example.com', password='test-pass', email_verified=True
        )
        self.other = User.objects.create_user(
            email='other@example.com', password='test-pass', email_verified=True
        )
        self.product = Product.objects.create(
            name='Local rice', price=Decimal('40.00'), unit='2kg'
        )
        self.zone = DeliveryZone.objects.create(
            name='Test Accra', delivery_weekday=(timezone.localdate().weekday() + 3) % 7,
            delivery_fee=Decimal('15.00'), cutoff_hours=48,
        )
        self.client.force_authenticate(self.user)

    def create_subscription(self, audience='household'):
        return self.client.post('/api/subscriptions/', {
            'audience': audience,
            'delivery_zone': self.zone.pk,
            'delivery_address': '1 Market Road, Accra',
            'contact_phone': '0244000000',
            'payment_method': 'card',
            'items': [{'product_id': self.product.pk, 'quantity': 2}],
        }, format='json')

    def test_custom_subscription_prices_products_on_server(self):
        response = self.create_subscription()
        self.assertEqual(response.status_code, 201)
        subscription = Subscription.objects.get(pk=response.data['id'])
        self.assertEqual(subscription.weekly_subtotal, Decimal('80.00'))
        self.assertEqual(subscription.weekly_delivery_fee, Decimal('15.00'))
        self.assertEqual(subscription.weeks.get().status, 'payment_due')
        self.assertIsNotNone(subscription.weeks.get().order_id)

    def test_duplicate_products_are_rejected(self):
        response = self.client.post('/api/subscriptions/', {
            'audience': 'household', 'delivery_zone': self.zone.pk,
            'delivery_address': 'Accra', 'contact_phone': '0244000000',
            'payment_method': 'card',
            'items': [
                {'product_id': self.product.pk, 'quantity': 1},
                {'product_id': self.product.pk, 'quantity': 2},
            ],
        }, format='json')
        self.assertEqual(response.status_code, 400)

    def test_business_subscription_requires_approved_profile(self):
        response = self.create_subscription(audience='business')
        self.assertEqual(response.status_code, 400)
        B2BProfile.objects.create(
            user=self.user, company_name='Kitchen Ltd', business_type='restaurant',
            contact_person='Ama', business_phone='0244000000',
            business_email=self.user.email, business_address='Accra', status='approved',
        )
        response = self.create_subscription(audience='business')
        self.assertEqual(response.status_code, 201)

    def test_users_only_see_their_own_subscriptions(self):
        own = self.create_subscription().data['id']
        Subscription.objects.create(
            user=self.other, delivery_zone=self.zone, delivery_address='Elsewhere',
            contact_phone='0200000000', payment_method='card',
        )
        response = self.client.get('/api/subscriptions/')
        self.assertEqual([row['id'] for row in response.data], [own])

    @override_settings(SEEVCASH_SECRET_KEY='')
    def test_payment_initialization_fails_closed_without_key(self):
        subscription_id = self.create_subscription().data['id']
        response = self.client.post(f'/api/subscriptions/{subscription_id}/payment/')
        self.assertEqual(response.status_code, 503)

    def test_skip_creates_next_week(self):
        subscription_id = self.create_subscription().data['id']
        subscription = Subscription.objects.get(pk=subscription_id)
        subscription.status = 'active'
        subscription.save(update_fields=['status'])
        old_date = subscription.next_delivery_date
        response = self.client.post(f'/api/subscriptions/{subscription_id}/skip/')
        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.next_delivery_date, old_date + timedelta(days=7))
        self.assertTrue(subscription.weeks.filter(delivery_date=old_date, status='skipped').exists())

    def test_pause_cancels_unpaid_renewal_and_resume_schedules_next(self):
        subscription_id = self.create_subscription().data['id']
        subscription = Subscription.objects.get(pk=subscription_id)
        subscription.status = 'active'
        subscription.save(update_fields=['status'])
        current = subscription.weeks.get()
        response = self.client.post(f'/api/subscriptions/{subscription_id}/pause/')
        self.assertEqual(response.status_code, 200)
        current.refresh_from_db()
        current.order.refresh_from_db()
        self.assertEqual(current.status, 'cancelled')
        self.assertEqual(current.order.status, 'cancelled')

        response = self.client.post(f'/api/subscriptions/{subscription_id}/resume/')
        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertEqual(subscription.status, 'active')
        self.assertTrue(subscription.weeks.filter(status='scheduled').exists())

    def test_cancel_stops_pending_renewal(self):
        subscription_id = self.create_subscription().data['id']
        subscription = Subscription.objects.get(pk=subscription_id)
        subscription.status = 'active'
        subscription.save(update_fields=['status'])
        response = self.client.post(f'/api/subscriptions/{subscription_id}/cancel/')
        self.assertEqual(response.status_code, 200)
        week = SubscriptionWeek.objects.get(subscription=subscription)
        self.assertEqual(week.status, 'cancelled')
        self.assertEqual(week.order.status, 'cancelled')

    def test_scheduler_expires_unpaid_window_without_activating_subscription(self):
        subscription_id = self.create_subscription().data['id']
        week = SubscriptionWeek.objects.get(subscription_id=subscription_id)
        week.cutoff_at = timezone.now() - timedelta(minutes=1)
        week.save(update_fields=['cutoff_at'])
        call_command('process_subscription_payments')
        week.refresh_from_db()
        week.order.refresh_from_db()
        self.assertEqual(week.status, 'expired')
        self.assertEqual(week.order.payment_status, 'expired')
        self.assertEqual(week.subscription.status, 'draft')

    @override_settings(SEEVCASH_SECRET_KEY='secret', SEEVCASH_CURRENCY='GHS')
    @patch('subscriptions.views.verify_checkout')
    def test_verification_rejects_underpayment(self, mock_verify):
        subscription_id = self.create_subscription().data['id']
        week = SubscriptionWeek.objects.get(subscription_id=subscription_id)
        week.payment_reference = 'LO-SUB-TEST'
        week.save(update_fields=['payment_reference'])
        mock_verify.return_value = {
            'status': 'completed', 'reference': 'LO-SUB-TEST',
            'currency': 'GHS', 'amount': 100, 'final_amount': 100,
        }
        response = self.client.post('/api/subscriptions/payment/verify/', {
            'reference': 'LO-SUB-TEST'
        }, format='json')
        self.assertEqual(response.status_code, 402)
        week.refresh_from_db()
        self.assertEqual(week.status, 'payment_due')
