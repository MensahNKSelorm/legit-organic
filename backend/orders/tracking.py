import base64
import hashlib
import hmac

from django.conf import settings

TRACKING_SALT = 'orders.customer-tracking.v1'


def _signature(value):
    digest = hmac.new(
        settings.SECRET_KEY.encode(),
        f'{TRACKING_SALT}:{value}'.encode(),
        hashlib.sha256,
    ).digest()[:16]
    return base64.urlsafe_b64encode(digest).decode().rstrip('=')


def issue_tracking_token(order):
    value = f'{order.pk:x}.{order.tracking_nonce.hex}'
    return f'{value}.{_signature(value)}'


def tracking_url(order):
    token = issue_tracking_token(order)
    return f'{settings.FRONTEND_URL}/track/{token}'


def read_tracking_token(token):
    try:
        order_hex, nonce, signature = token.split('.', 2)
        value = f'{order_hex}.{nonce}'
        if not hmac.compare_digest(signature, _signature(value)):
            raise ValueError('Invalid tracking signature.')
        return {'order_id': int(order_hex, 16), 'nonce': nonce}
    except (TypeError, ValueError) as exc:
        raise ValueError('Invalid tracking token.') from exc
