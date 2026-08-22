from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from .models import Order, OrderStatusEvent


def transition_order(order_id, to_status, *, actor=None, source='admin', note='', delivery_pin=''):
    """Move an order through the fulfilment workflow exactly once."""
    pin_error = False
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id)
        from_status = order.status
        if to_status == from_status:
            return order, False
        if not order.can_transition_to(to_status):
            raise ValidationError(
                f'Order cannot move from {order.get_status_display()} to '
                f'{dict(Order.STATUS_CHOICES).get(to_status, to_status)}.'
            )
        if to_status in {'processing', 'ready_for_dispatch', 'out_for_delivery', 'delivered'}:
            if order.payment_status != 'success':
                raise ValidationError('Only a successfully paid order can enter fulfilment.')

        update_fields = ['status', 'updated_at']
        if to_status == 'out_for_delivery':
            order.issue_delivery_pin()
            update_fields.extend([
                'delivery_pin_hash', 'delivery_pin_expires_at', 'delivery_pin_attempts',
            ])
        elif to_status == 'delivered':
            if not order.check_delivery_pin(delivery_pin):
                order.delivery_pin_attempts += 1
                order.save(update_fields=['delivery_pin_attempts', 'updated_at'])
                pin_error = True
            else:
                order.delivery_confirmed_at = timezone.now()
                order.delivery_pin_hash = ''
                order.delivery_pin_expires_at = None
                update_fields.extend([
                    'delivery_confirmed_at', 'delivery_pin_hash', 'delivery_pin_expires_at',
                ])

        if not pin_error:
            order.status = to_status
            order.save(update_fields=update_fields)
            OrderStatusEvent.objects.create(
                order=order,
                from_status=from_status,
                to_status=to_status,
                actor=actor if getattr(actor, 'is_authenticated', False) else None,
                source=source,
                note=(note or '')[:300],
            )
    if pin_error:
        raise ValidationError('The delivery PIN is incorrect, expired, or locked.')
    return order, True
