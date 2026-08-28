"""Generate customer-paid subscription renewals; never charge automatically."""

from django.core.management.base import BaseCommand
from django.utils import timezone

from subscriptions.models import SubscriptionWeek
from subscriptions.services import ensure_renewal_order, schedule_next_week


def notify_expired(week):
    try:
        from subscriptions.emails import send_week_expired_email
        send_week_expired_email(week)
    except Exception as exc:
        return str(exc)
    return ''


class Command(BaseCommand):
    help = 'Create renewal orders and expire unpaid subscription payment windows.'

    def handle(self, *args, **options):
        now = timezone.now()

        expired = SubscriptionWeek.objects.select_related('order', 'subscription').filter(
            subscription__status__in=['draft', 'active'],
            status='payment_due', cutoff_at__lte=now,
        )
        for week in expired:
            week.status = 'expired'
            week.payment_error = 'The renewal payment window expired without payment.'
            week.save(update_fields=['status', 'payment_error', 'updated_at'])
            if week.order_id and week.order.payment_status != 'success':
                week.order.payment_status = 'expired'
                week.order.save(update_fields=['payment_status'])
            if week.subscription.status == 'active':
                schedule_next_week(week.subscription, week.delivery_date)
            error = notify_expired(week)
            if error:
                self.stderr.write(f'Expiry email failed for week {week.pk}: {error}')
            self.stdout.write(f'Expired renewal week {week.pk}')

        scheduled = SubscriptionWeek.objects.select_related('subscription').filter(
            subscription__status='active', status__in=['scheduled', 'renewal_order'],
            cutoff_at__gt=now,
        )
        for week in scheduled:
            ensure_renewal_order(week.pk)
            self.stdout.write(f'Created renewal order for week {week.pk}')
