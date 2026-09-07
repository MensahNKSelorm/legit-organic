from django.test import TestCase

from .models import Order
from .queries import payment_exception_q


class PaymentExceptionQueryTests(TestCase):
    def create_order(self, reference, *, payment_status, status):
        return Order.objects.create(
            reference=reference,
            payment_status=payment_status,
            status=status,
            total_amount='20.00',
            delivery_address='Accra',
        )

    def test_abandoned_payments_are_not_exceptions(self):
        self.create_order('FAILED', payment_status='failed', status='pending')
        self.create_order('EXPIRED', payment_status='expired', status='whatsapp_pending')

        self.assertFalse(Order.objects.filter(payment_exception_q()).exists())

    def test_only_payment_and_fulfilment_contradictions_are_exceptions(self):
        paid_not_released = self.create_order(
            'PAID-PENDING', payment_status='success', status='pending'
        )
        unpaid_in_fulfilment = self.create_order(
            'UNPAID-PACKING', payment_status='failed', status='processing'
        )
        self.create_order('NORMAL-PAID', payment_status='success', status='processing')

        self.assertCountEqual(
            Order.objects.filter(payment_exception_q()).values_list('pk', flat=True),
            [paid_not_released.pk, unpaid_in_fulfilment.pk],
        )
