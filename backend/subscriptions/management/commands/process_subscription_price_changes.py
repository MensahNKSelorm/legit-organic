"""Retry notice delivery and safely apply due subscription price changes."""

from django.core.management.base import BaseCommand
from django.utils import timezone

from subscriptions.models import SubscriptionPlanPriceChange
from subscriptions.services import apply_price_change, deliver_price_notice, prepare_price_change


class Command(BaseCommand):
    help = 'Deliver scheduled price notices and apply due changes only to notified subscribers.'

    def handle(self, *args, **options):
        scheduled = SubscriptionPlanPriceChange.objects.filter(status='scheduled')
        for change in scheduled:
            prepare_price_change(change.pk)
            # Failed deliveries remain visible for an explicit staff retry.
            for notice_id in change.notices.filter(status='pending').values_list('pk', flat=True):
                deliver_price_notice(notice_id)
            if change.effective_at <= timezone.now():
                apply_price_change(change.pk)
                self.stdout.write(self.style.SUCCESS(f'Applied price change {change.pk}'))
