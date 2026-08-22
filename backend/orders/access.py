"""Short-lived capability tokens for anonymous order checkout flows."""

from django.conf import settings
from django.core import signing


GUEST_ORDER_SALT = 'orders.guest-access.v1'


def issue_guest_order_token(order):
    return signing.dumps(
        {'reference': order.reference, 'email': order.guest_email},
        salt=GUEST_ORDER_SALT,
        compress=True,
    )


def valid_guest_order_token(order, token):
    if not token or order.user_id:
        return False
    try:
        payload = signing.loads(
            token,
            salt=GUEST_ORDER_SALT,
            max_age=settings.GUEST_ORDER_TOKEN_MAX_AGE,
        )
    except signing.BadSignature:
        return False
    return payload == {'reference': order.reference, 'email': order.guest_email}
