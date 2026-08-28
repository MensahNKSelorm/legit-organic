import json
import logging

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()
logger = logging.getLogger(__name__)


def notify_admins(type, title, body, link=''):
    from .models import Notification
    admins = User.objects.filter(is_staff=True)
    notifications = Notification.objects.bulk_create([
        Notification(
            recipient=admin,
            type=type,
            title=title,
            body=body,
            link=link,
        )
        for admin in admins
    ])
    notification_ids = [notification.pk for notification in notifications]
    if notification_ids:
        transaction.on_commit(
            lambda: send_web_push_for_notifications(notification_ids)
        )


def send_web_push_for_notifications(notification_ids):
    """Best-effort push delivery. In-app notifications remain authoritative."""
    if not settings.WEB_PUSH_VAPID_PRIVATE_KEY:
        return

    try:
        from pywebpush import WebPushException, webpush
        from .models import Notification, WebPushSubscription

        notifications = Notification.objects.filter(
            pk__in=notification_ids,
        ).select_related('recipient')
        for notification in notifications:
            payload = json.dumps({
                'title': notification.title,
                'body': notification.body,
                'url': f'{settings.DASHBOARD_URL}{notification.link}'
                if notification.link else settings.DASHBOARD_URL,
                'tag': f'legitorganic-notification-{notification.pk}',
            })
            subscriptions = WebPushSubscription.objects.filter(
                recipient=notification.recipient,
                is_active=True,
            )
            for subscription in subscriptions:
                try:
                    webpush(
                        subscription_info={
                            'endpoint': subscription.endpoint,
                            'keys': {
                                'p256dh': subscription.p256dh,
                                'auth': subscription.auth,
                            },
                        },
                        data=payload,
                        vapid_private_key=settings.WEB_PUSH_VAPID_PRIVATE_KEY,
                        vapid_claims={'sub': settings.WEB_PUSH_VAPID_SUBJECT},
                        ttl=300,
                        timeout=5,
                    )
                except WebPushException as exc:
                    status_code = getattr(getattr(exc, 'response', None), 'status_code', None)
                    if status_code in {404, 410}:
                        subscription.is_active = False
                        subscription.save(update_fields=['is_active', 'updated_at'])
                    else:
                        logger.warning(
                            'Web push failed for subscription=%s: %s',
                            subscription.pk, exc,
                        )
    except Exception:
        logger.exception('Web push notification fan-out failed')
