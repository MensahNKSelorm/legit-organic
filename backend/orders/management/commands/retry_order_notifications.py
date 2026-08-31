from django.core.management.base import BaseCommand

from orders.models import OrderNotificationDelivery
from orders.notifications import retry_failed_order_notifications


class Command(BaseCommand):
    help = 'Retry failed customer order emails and SMS messages safely.'

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=100)

    def handle(self, *args, **options):
        pairs = list(
            OrderNotificationDelivery.objects.filter(status='failed')
            .values_list('order_id', 'event')
            .distinct()[: options['limit']]
        )
        succeeded = 0
        for order_id, event in pairs:
            result = retry_failed_order_notifications(order_id, event)
            succeeded += sum(value is True for value in result.values())
        self.stdout.write(
            self.style.SUCCESS(
                f'Retried {len(pairs)} order event(s); {succeeded} delivery attempt(s) succeeded.'
            )
        )
