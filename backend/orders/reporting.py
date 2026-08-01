import logging

from django.db import transaction
from django.db import models
from django.utils import timezone

from .models import Order

logger = logging.getLogger(__name__)


def send_owner_report_once(order_id, event):
    """Send one owner report per order milestone, safely under concurrency."""
    config = {
        'payment_success': (
            'payment_report_sent_at', 'payment_report_attempts', 'payment_report_error'
        ),
        'delivered': (
            'delivery_report_sent_at', 'delivery_report_attempts', 'delivery_report_error'
        ),
    }.get(event)
    if not config:
        raise ValueError(f'Unknown order report event: {event}')
    field, attempts_field, error_field = config

    try:
        with transaction.atomic():
            order = (
                Order.objects.select_for_update()
                .select_related('user', 'promo_code')
                .prefetch_related('items__product')
                .get(pk=order_id)
            )
            if getattr(order, field) is not None:
                return False
            if event == 'payment_success' and order.payment_status != 'success':
                return False
            if event == 'delivered' and order.status != 'delivered':
                return False

            from users.emails import send_owner_order_report
            send_owner_order_report(order, event)
            setattr(order, field, timezone.now())
            setattr(order, error_field, '')
            setattr(order, attempts_field, getattr(order, attempts_field) + 1)
            order.save(update_fields=[field, attempts_field, error_field, 'updated_at'])
            return True
    except Exception as exc:
        Order.objects.filter(pk=order_id).update(
            **{
                attempts_field: models.F(attempts_field) + 1,
                error_field: str(exc)[:500],
            }
        )
        logger.exception('Owner order report failed for order=%s event=%s', order_id, event)
        return False
