import logging

from django.db import transaction
from django.utils import timezone

from .models import Order, OrderNotificationDelivery

logger = logging.getLogger(__name__)


def _attempt(delivery, order):
    has_email = bool(order.user_id and order.user.email) or bool(order.guest_email)
    has_phone = bool(order.user_id and order.user.phone_number) or bool(order.guest_phone)
    if (delivery.channel == 'email' and not has_email) or (
        delivery.channel == 'sms' and not has_phone
    ):
        delivery.status = 'skipped'
        delivery.error = 'No customer recipient is available.'
        delivery.last_attempt_at = timezone.now()
        delivery.save(update_fields=['status', 'error', 'last_attempt_at'])
        return True

    delivery.attempts += 1
    delivery.last_attempt_at = timezone.now()
    try:
        if delivery.channel == 'email':
            from users.emails import send_order_status_email

            send_order_status_email(order)
        else:
            from users.sms import send_order_status_sms

            if not send_order_status_sms(order):
                raise RuntimeError('Wigal did not accept the SMS for processing.')
    except Exception as exc:
        delivery.status = 'failed'
        delivery.error = str(exc)[:500]
        logger.exception(
            'Order notification failed order=%s event=%s channel=%s',
            order.reference,
            delivery.event,
            delivery.channel,
        )
    else:
        delivery.status = 'sent'
        delivery.error = ''
        delivery.sent_at = timezone.now()
    delivery.save(
        update_fields=[
            'status',
            'attempts',
            'error',
            'last_attempt_at',
            'sent_at',
        ]
    )
    return delivery.status == 'sent'


def deliver_order_status_notifications(order, *, channels=('email', 'sms')):
    results = {}
    for channel in channels:
        delivery = OrderNotificationDelivery.objects.create(
            order=order,
            event=order.status,
            channel=channel,
        )
        results[channel] = _attempt(delivery, order)
    return results


@transaction.atomic
def retry_failed_order_notifications(order_id, event):
    """Retry one failed event; dispatch retries always rotate the delivery PIN."""
    order = Order.objects.select_for_update().get(pk=order_id)
    failed = list(order.notification_deliveries.filter(event=event, status='failed'))
    if not failed:
        return {}

    channels = sorted({delivery.channel for delivery in failed})
    if event == 'out_for_delivery':
        if order.notification_deliveries.filter(event=event, channel='sms').count() >= 3:
            order.notification_deliveries.filter(event=event, status='failed').update(
                status='exhausted'
            )
            return {'exhausted': 'Automatic retry limit reached.'}
        if order.status != 'out_for_delivery':
            return {'skipped': 'Order is no longer out for delivery.'}
        order.issue_delivery_pin()
        order.save(
            update_fields=[
                'delivery_pin_hash',
                'delivery_pin_expires_at',
                'delivery_pin_attempts',
                'updated_at',
            ]
        )
        # The former email may contain a PIN that has just been invalidated.
        # Resend both channels with the same newly issued PIN.
        channels = ['email', 'sms']
    else:
        retryable = []
        for channel in channels:
            if order.notification_deliveries.filter(event=event, channel=channel).count() < 3:
                retryable.append(channel)
            else:
                order.notification_deliveries.filter(
                    event=event, channel=channel, status='failed'
                ).update(status='exhausted')
        channels = retryable
        if not channels:
            return {'exhausted': 'Automatic retry limit reached.'}

    order.notification_deliveries.filter(event=event, status='failed').update(status='superseded')
    return deliver_order_status_notifications(order, channels=channels)
