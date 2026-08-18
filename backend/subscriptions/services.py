from datetime import datetime, time, timedelta

from django.utils import timezone
from django.db import transaction

from .models import SubscriptionWeek


def schedule_next_week(subscription, after_date=None):
    delivery_date = (after_date or subscription.next_delivery_date or timezone.localdate()) + timedelta(days=7)
    cutoff_at = timezone.make_aware(datetime.combine(delivery_date, time.min)) - timedelta(
        hours=subscription.delivery_zone.cutoff_hours
    )
    week, _ = SubscriptionWeek.objects.get_or_create(
        subscription=subscription,
        delivery_date=delivery_date,
        defaults={
            'cutoff_at': cutoff_at, 'status': 'scheduled',
            'subtotal': subscription.weekly_subtotal,
            'delivery_fee': subscription.weekly_delivery_fee,
        },
    )
    subscription.next_delivery_date = delivery_date
    subscription.save(update_fields=['next_delivery_date', 'updated_at'])
    return week


@transaction.atomic
def ensure_renewal_order(week_id):
    """Create exactly one unpaid order for a subscription delivery cycle."""
    from orders.models import Order, OrderItem

    week = SubscriptionWeek.objects.select_for_update().select_related(
        'subscription', 'subscription__user'
    ).get(pk=week_id)
    if week.order_id:
        return week.order
    subscription = week.subscription
    reference = f'LO-SUB-{subscription.pk}-{week.delivery_date:%Y%m%d}'
    order, created = Order.objects.get_or_create(
        reference=reference,
        defaults={
            'user': subscription.user, 'status': 'pending',
            'payment_status': 'pending', 'total_amount': week.total,
            'delivery_address': subscription.delivery_address,
            'guest_name': subscription.user.get_full_name() or subscription.user.email,
            'guest_email': subscription.user.email,
            'guest_phone': subscription.contact_phone,
            'order_source': 'subscription', 'payment_provider': 'seevcash',
        },
    )
    if created:
        OrderItem.objects.bulk_create([
            OrderItem(
                order=order, product=item.product, quantity=item.quantity,
                unit_price=item.unit_price,
            )
            for item in subscription.items.select_related('product')
        ])
    week.order = order
    week.payment_reference = reference
    week.status = 'payment_due'
    week.save(update_fields=['order', 'payment_reference', 'status', 'updated_at'])
    return order


@transaction.atomic
def finalize_paid_week(week_id, payment_data):
    week = SubscriptionWeek.objects.select_for_update().select_related(
        'subscription', 'subscription__user'
    ).get(pk=week_id)
    if week.status == 'paid':
        return week
    subscription = week.subscription
    order = ensure_renewal_order(week.pk)
    order.provider_transaction_id = str(payment_data.get('id', '') or '')
    order.payment_status = 'success'
    order.status = 'processing'
    order.save(update_fields=['provider_transaction_id', 'payment_status', 'status'])

    subscription.status = 'active'
    subscription.started_at = subscription.started_at or timezone.now()
    subscription.save(update_fields=[
        'status', 'started_at', 'updated_at',
    ])
    week.status = 'paid'
    week.payment_error = ''
    week.paid_at = timezone.now()
    week.order = order
    week.save(update_fields=[
        'status', 'payment_error', 'paid_at', 'order', 'updated_at'
    ])
    return week
