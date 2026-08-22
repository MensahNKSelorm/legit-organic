from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Q

from orders.models import Order
from orders.reporting import send_owner_report_once


class Command(BaseCommand):
    help = 'Retry owner order reports that previously failed to send.'

    def handle(self, *args, **options):
        max_attempts = getattr(settings, 'ORDER_REPORT_MAX_ATTEMPTS', 10)
        candidates = Order.objects.filter(is_test=False).filter(
            Q(
                payment_status='success', payment_report_sent_at__isnull=True,
                payment_report_attempts__lt=max_attempts,
            )
            | Q(
                status='delivered', delivery_report_sent_at__isnull=True,
                delivery_report_attempts__lt=max_attempts,
            )
        ).only(
            'id', 'payment_status', 'status', 'payment_report_sent_at',
            'delivery_report_sent_at', 'payment_report_attempts',
            'delivery_report_attempts',
        )

        sent = 0
        for order in candidates.iterator():
            if order.payment_status == 'success' and order.payment_report_sent_at is None:
                sent += int(send_owner_report_once(order.pk, 'payment_success'))
            if order.status == 'delivered' and order.delivery_report_sent_at is None:
                sent += int(send_owner_report_once(order.pk, 'delivered'))
        self.stdout.write(self.style.SUCCESS(f'Owner reports sent: {sent}'))
