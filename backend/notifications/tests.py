from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from users.models import User
from .models import Notification, WebPushSubscription
from .utils import notify_admins


class NotificationApiTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            email='operations@example.com',
            password='x',
            is_staff=True,
        )
        self.customer = User.objects.create_user(
            email='customer@example.com',
            password='x',
        )

    @override_settings(
        WEB_PUSH_VAPID_PUBLIC_KEY='public-key',
        WEB_PUSH_VAPID_PRIVATE_KEY='private-key',
    )
    def test_staff_can_register_and_disable_push_subscription(self):
        client = APIClient()
        client.force_authenticate(self.staff)
        payload = {
            'endpoint': 'https://push.example.test/subscription/1',
            'keys': {'p256dh': 'device-key', 'auth': 'device-auth'},
        }
        response = client.post(
            '/api/notifications/push/subscription/',
            payload,
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        subscription = WebPushSubscription.objects.get(recipient=self.staff)
        self.assertTrue(subscription.is_active)

        response = client.delete(
            '/api/notifications/push/subscription/',
            {'endpoint': payload['endpoint']},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        subscription.refresh_from_db()
        self.assertFalse(subscription.is_active)

    def test_customer_cannot_access_staff_notification_feed(self):
        client = APIClient()
        client.force_login(self.customer)
        self.assertEqual(client.get('/api/notifications/').status_code, 403)
        self.assertEqual(
            client.get('/api/notifications/push/config/').status_code,
            403,
        )

    def test_admin_session_can_read_notification_feed(self):
        Notification.objects.create(
            recipient=self.staff,
            type='order_placed',
            title='New order placed',
            body='LO-SESSION was submitted.',
        )
        client = APIClient()
        client.force_login(self.staff)
        response = client.get('/api/notifications/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['unread_count'], 1)
        self.assertEqual(response.data['results'][0]['title'], 'New order placed')

    @override_settings(WEB_PUSH_VAPID_PRIVATE_KEY='')
    def test_notification_is_recorded_when_push_is_not_configured(self):
        with self.captureOnCommitCallbacks(execute=True):
            notify_admins(
                'order_placed',
                'New WhatsApp order',
                'LO-TEST was submitted.',
                '/admin/orders/order/1/change/',
            )
        notification = Notification.objects.get(recipient=self.staff)
        self.assertFalse(notification.is_read)
        self.assertEqual(notification.title, 'New WhatsApp order')

    @override_settings(
        WEB_PUSH_VAPID_PRIVATE_KEY='private-key',
        WEB_PUSH_VAPID_SUBJECT='mailto:legitorganic9@gmail.com',
        DASHBOARD_URL='https://api.legitorganic.com',
    )
    @patch('pywebpush.webpush')
    def test_new_notification_is_pushed_to_active_staff_device(self, mock_webpush):
        WebPushSubscription.objects.create(
            recipient=self.staff,
            endpoint='https://push.example.test/subscription/2',
            p256dh='device-key',
            auth='device-auth',
        )
        with self.captureOnCommitCallbacks(execute=True):
            notify_admins(
                'order_paid',
                'Order paid',
                'LO-PAID has been verified.',
                '/admin/orders/order/2/change/',
            )
        mock_webpush.assert_called_once()
        call = mock_webpush.call_args.kwargs
        self.assertIn('LO-PAID has been verified.', call['data'])
        self.assertEqual(call['ttl'], 300)
        self.assertEqual(call['timeout'], 5)
