from decimal import Decimal
from unittest.mock import patch

from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from users.models import User
from products.models import Product
from .models import Order, OrderItem
from .promo_models import PromoCode

CREATE_URL = '/api/orders/create/'
VERIFY_URL = '/api/orders/verify-payment/'


def paystack_ok(reference='LO-PAYTEST', amount=5000, currency='GHS', txn_id=99):
    return {
        'status': True,
        'data': {
            'status': 'success',
            'reference': reference,
            'currency': currency,
            'amount': amount,
            'id': txn_id,
        },
    }


class PaymentVerificationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email='c@example.com', password='x', first_name='C', last_name='U',
            email_verified=True,
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        self.order = Order.objects.create(
            user=self.user, reference='LO-PAYTEST', delivery_address='Accra',
            total_amount=Decimal('50.00'), discount_amount=Decimal('0.00'),
            payment_status='pending', status='pending', order_source='paystack',
        )

    @override_settings(PAYSTACK_SECRET_KEY='')
    def test_fails_closed_when_paystack_not_configured(self):
        resp = self.client.post(VERIFY_URL, {'reference': 'LO-PAYTEST'}, format='json')
        self.assertEqual(resp.status_code, 503)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'pending')

    @override_settings(PAYSTACK_SECRET_KEY='sk_test')
    @patch('orders.views.requests.get')
    def test_fails_closed_when_paystack_times_out(self, mock_get):
        import requests as _requests
        mock_get.side_effect = _requests.RequestException('timeout')
        resp = self.client.post(VERIFY_URL, {'reference': 'LO-PAYTEST'}, format='json')
        self.assertEqual(resp.status_code, 502)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'pending')

    @override_settings(PAYSTACK_SECRET_KEY='sk_test')
    @patch('orders.views.requests.get')
    def test_declined_payment_marked_failed(self, mock_get):
        mock_get.return_value.json.return_value = {'status': True, 'data': {'status': 'failed'}}
        resp = self.client.post(VERIFY_URL, {'reference': 'LO-PAYTEST'}, format='json')
        self.assertEqual(resp.status_code, 402)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'failed')

    @override_settings(PAYSTACK_SECRET_KEY='sk_test')
    @patch('orders.views.requests.get')
    def test_amount_underpayment_rejected(self, mock_get):
        # Order is GHS 50.00 == 5000 pesewas; provider reports only 1000.
        mock_get.return_value.json.return_value = paystack_ok(amount=1000)
        resp = self.client.post(VERIFY_URL, {'reference': 'LO-PAYTEST'}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'pending')

    @override_settings(PAYSTACK_SECRET_KEY='sk_test')
    @patch('orders.views.requests.get')
    def test_currency_mismatch_rejected(self, mock_get):
        mock_get.return_value.json.return_value = paystack_ok(currency='NGN')
        resp = self.client.post(VERIFY_URL, {'reference': 'LO-PAYTEST'}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'pending')

    @override_settings(PAYSTACK_SECRET_KEY='sk_test')
    @patch('orders.views.requests.get')
    def test_reference_mismatch_rejected(self, mock_get):
        mock_get.return_value.json.return_value = paystack_ok(reference='SOMETHING-ELSE')
        resp = self.client.post(VERIFY_URL, {'reference': 'LO-PAYTEST'}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'pending')

    @override_settings(PAYSTACK_SECRET_KEY='sk_test')
    @patch('users.sms.send_order_status_sms')
    @patch('users.emails.resend.Emails.send')
    @patch('orders.views.requests.get')
    def test_valid_payment_marks_paid(self, mock_get, mock_email, mock_sms):
        mock_get.return_value.json.return_value = paystack_ok(amount=5000, txn_id=12345)
        resp = self.client.post(VERIFY_URL, {'reference': 'LO-PAYTEST'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'success')
        self.assertEqual(self.order.status, 'processing')
        self.assertEqual(self.order.paystack_id, '12345')

    @override_settings(PAYSTACK_SECRET_KEY='sk_test')
    @patch('users.sms.send_order_status_sms')
    @patch('users.emails.resend.Emails.send')
    @patch('orders.views.requests.get')
    def test_repeated_verification_transitions_exactly_once(self, mock_get, mock_email, mock_sms):
        # Guards the transition side effects (confirmation/status emails, commissions)
        # against firing twice. True parallelism needs Postgres + threads; here we
        # assert the idempotent recheck: a second completion does no extra work.
        mock_get.return_value.json.return_value = paystack_ok(amount=5000, txn_id=777)
        r1 = self.client.post(VERIFY_URL, {'reference': 'LO-PAYTEST'}, format='json')
        self.assertEqual(r1.status_code, 200)
        emails_after_first = mock_email.call_count
        self.assertGreaterEqual(emails_after_first, 1)

        r2 = self.client.post(VERIFY_URL, {'reference': 'LO-PAYTEST'}, format='json')
        self.assertEqual(r2.status_code, 200)
        self.assertEqual(mock_email.call_count, emails_after_first)  # no duplicate side effects
        self.order.refresh_from_db()
        self.assertEqual(self.order.payment_status, 'success')

    @override_settings(PAYSTACK_SECRET_KEY='sk_test')
    @patch('orders.views.requests.get')
    def test_already_paid_is_idempotent(self, mock_get):
        self.order.payment_status = 'success'
        self.order.status = 'processing'
        self.order.save(update_fields=['payment_status', 'status'])
        resp = self.client.post(VERIFY_URL, {'reference': 'LO-PAYTEST'}, format='json')
        self.assertEqual(resp.status_code, 200)
        mock_get.assert_not_called()  # no re-verification / re-processing


class ReceiptAuthTests(TestCase):
    def setUp(self):
        cache.clear()
        self.owner = User.objects.create_user(
            email='own@example.com', password='x', first_name='O', last_name='W',
            email_verified=True,
        )
        self.other = User.objects.create_user(
            email='oth@example.com', password='x', first_name='O', last_name='T',
            email_verified=True,
        )
        self.order = Order.objects.create(
            user=self.owner, reference='LO-RCPT1', delivery_address='Accra',
            total_amount=Decimal('20.00'), payment_status='success',
            status='processing', order_source='paystack',
        )

    def test_anonymous_cannot_download_receipt(self):
        resp = APIClient().get('/api/orders/LO-RCPT1/receipt/')
        self.assertIn(resp.status_code, (401, 403))

    def test_non_owner_gets_404(self):
        c = APIClient()
        c.force_authenticate(self.other)
        resp = c.get('/api/orders/LO-RCPT1/receipt/')
        self.assertEqual(resp.status_code, 404)

    def test_owner_can_download_receipt(self):
        c = APIClient()
        c.force_authenticate(self.owner)
        resp = c.get('/api/orders/LO-RCPT1/receipt/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp['Content-Type'], 'application/pdf')


class AtomicOrderCreationTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.product = Product.objects.create(name='Tomatoes', price=Decimal('10.00'))

    def _payload(self, items, **extra):
        base = {
            'items': items,
            'delivery_address': 'Accra',
            'order_source': 'whatsapp',
            'guest_name': 'Guest',
            'guest_phone': '0200000000',
            'guest_email': 'guest@example.com',
        }
        base.update(extra)
        return base

    def test_invalid_product_leaves_no_orphan_order(self):
        before = Order.objects.count()
        resp = self.client.post(CREATE_URL, self._payload([
            {'product_id': self.product.id, 'quantity': 2},
            {'product_id': 999999, 'quantity': 1},
        ]), format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(Order.objects.count(), before)
        self.assertEqual(OrderItem.objects.count(), 0)

    def test_valid_order_created_with_correct_total(self):
        resp = self.client.post(CREATE_URL, self._payload([
            {'product_id': self.product.id, 'quantity': 3},
        ]), format='json')
        self.assertEqual(resp.status_code, 201)
        order = Order.objects.get(reference=resp.data['reference'])
        self.assertEqual(order.total_amount, Decimal('30.00'))
        self.assertEqual(order.items.count(), 1)

    def test_valid_promo_increments_usage_once(self):
        promo = PromoCode.objects.create(
            code='SAVE10', discount_type=PromoCode.DISCOUNT_FIXED,
            discount_value=Decimal('10.00'), is_active=True,
        )
        resp = self.client.post(CREATE_URL, self._payload([
            {'product_id': self.product.id, 'quantity': 2},
        ], promo_code='SAVE10'), format='json')
        self.assertEqual(resp.status_code, 201)
        promo.refresh_from_db()
        self.assertEqual(promo.times_used, 1)
        order = Order.objects.get(reference=resp.data['reference'])
        self.assertEqual(order.discount_amount, Decimal('10.00'))
