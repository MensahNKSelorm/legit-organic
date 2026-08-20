from datetime import datetime, time, timedelta

from django.utils import timezone
from django.db import transaction

from .models import (
    SubscriptionPlanPriceChange, SubscriptionPriceNotice, SubscriptionWeek,
)


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


@transaction.atomic
def prepare_price_change(change_id):
    """Create the fixed recipient ledger before any notices are sent."""
    change = SubscriptionPlanPriceChange.objects.select_for_update().select_related('plan').get(
        pk=change_id
    )
    if change.status != 'scheduled' or change.recipients_prepared_at:
        return change
    subscriptions = change.plan.subscriptions.filter(
        status__in=['draft', 'active', 'paused']
    ).select_related('user')
    SubscriptionPriceNotice.objects.bulk_create([
        SubscriptionPriceNotice(
            price_change=change,
            subscription=subscription,
            recipient_email=subscription.user.email,
        )
        for subscription in subscriptions
    ], ignore_conflicts=True)
    change.recipients_prepared_at = timezone.now()
    change.save(update_fields=['recipients_prepared_at', 'updated_at'])
    return change


def deliver_price_notice(notice_id):
    from .emails import send_price_change_notice

    notice = SubscriptionPriceNotice.objects.select_related(
        'price_change__plan', 'subscription__user'
    ).get(pk=notice_id)
    if notice.status in {'sent', 'applied', 'cancelled'}:
        return notice
    notice.attempts += 1
    try:
        notice.delivery_id = send_price_change_notice(notice)
        notice.status = 'sent'
        notice.sent_at = timezone.now()
        notice.last_error = ''
    except Exception as exc:
        notice.status = 'failed'
        notice.last_error = str(exc)[:500]
    notice.save(update_fields=[
        'attempts', 'delivery_id', 'status', 'sent_at', 'last_error', 'updated_at',
    ])
    return notice


@transaction.atomic
def apply_price_change(change_id):
    """Apply only to subscribers with a successfully recorded notice."""
    change = SubscriptionPlanPriceChange.objects.select_for_update().select_related('plan').get(
        pk=change_id
    )
    if change.status != 'scheduled' or change.effective_at > timezone.now():
        return change

    now = timezone.now()
    eligible = change.notices.select_for_update().filter(
        status='sent', subscription__status__in=['draft', 'active', 'paused']
    )
    eligible_count = eligible.count()
    for notice in eligible.select_related('subscription'):
        subscription = notice.subscription
        subscription.weekly_subtotal = change.new_price
        subscription.save(update_fields=['weekly_subtotal', 'updated_at'])
        notice.status = 'applied'
        notice.applied_at = now
        notice.save(update_fields=['status', 'applied_at', 'updated_at'])

    change.plan.weekly_price = change.new_price
    change.plan.save(update_fields=['weekly_price', 'updated_at'])
    change.status = 'applied'
    change.applied_at = now
    change.save(update_fields=['status', 'applied_at', 'updated_at'])
    from security.audit import record_event
    record_event(
        action='subscription.price_change_applied',
        target=change,
        before={'weekly_price': str(change.old_price)},
        after={
            'weekly_price': str(change.new_price),
            'notified_subscribers': eligible_count,
            'blocked_notices': change.notices.filter(status='failed').count(),
        },
        reason=change.reason,
    )
    return change
