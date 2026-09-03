from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone

from .models import Driver, Order
from .services import transition_order
from .tracking import issue_tracking_token


@override_settings(FRONTEND_URL='https://legitorganic.test')
class DeliveryTrackingTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='customer@example.com',
            password='StrongPass123!',
            first_name='Ama',
        )
        self.driver = Driver.objects.create(
            name='Kofi Driver',
            phone_number='0244000000',
            vehicle_type='van',
            vehicle_registration='GT 1234-26',
        )
        self.order = Order.objects.create(
            user=self.user,
            reference='LO-TRACK-001',
            status='processing',
            payment_status='success',
            total_amount='120.00',
            delivery_address='13 New Aplaku, Accra',
        )

    @patch('orders.notifications.deliver_order_status_notifications')
    def test_dispatch_requires_an_active_driver(self, _notify):
        transition_order(self.order.pk, 'ready_for_dispatch', actor=self.user)
        with self.assertRaisesMessage(ValidationError, 'Assign an active driver'):
            transition_order(self.order.pk, 'out_for_delivery', actor=self.user)

    @patch('orders.notifications.deliver_order_status_notifications')
    def test_valid_token_returns_only_delivery_safe_data(self, _notify):
        self.order.driver = self.driver
        self.order.save(update_fields=['driver', 'updated_at'])
        transition_order(self.order.pk, 'ready_for_dispatch', actor=self.user)
        dispatched, _ = transition_order(self.order.pk, 'out_for_delivery', actor=self.user)
        token = issue_tracking_token(dispatched)

        response = self.client.get(reverse('order-tracking', args=[token]))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['reference'], self.order.reference)
        self.assertEqual(response.json()['driver']['name'], self.driver.name)
        self.assertNotIn('total_amount', response.json())
        self.assertNotIn('guest_email', response.json())

    @patch('orders.notifications.deliver_order_status_notifications')
    def test_tampered_or_expired_token_is_rejected(self, _notify):
        self.order.driver = self.driver
        self.order.save(update_fields=['driver', 'updated_at'])
        transition_order(self.order.pk, 'ready_for_dispatch', actor=self.user)
        dispatched, _ = transition_order(self.order.pk, 'out_for_delivery', actor=self.user)
        token = issue_tracking_token(dispatched)

        self.assertEqual(
            self.client.get(reverse('order-tracking', args=[f'{token}x'])).status_code,
            404,
        )

        Order.objects.filter(pk=self.order.pk).update(
            status='delivered',
            delivery_confirmed_at=timezone.now() - timedelta(hours=25),
        )
        self.assertEqual(self.client.get(reverse('order-tracking', args=[token])).status_code, 404)
