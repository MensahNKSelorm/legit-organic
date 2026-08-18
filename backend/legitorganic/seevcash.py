"""Small server-side client for the SeevCash hosted Checkout API."""

from dataclasses import dataclass

import requests
from django.conf import settings


class SeevCashError(Exception):
    """A safe, user-displayable payment provider error."""


@dataclass(frozen=True)
class CheckoutSession:
    reference: str
    checkout_url: str
    status: str
    expires_at: str = ''
    session_id: str = ''


def _data(response):
    try:
        payload = response.json()
    except ValueError as exc:
        raise SeevCashError('SeevCash returned an invalid response.') from exc
    if not response.ok or not payload.get('success') or not isinstance(payload.get('data'), dict):
        message = payload.get('message') or payload.get('error') or 'SeevCash rejected the request.'
        raise SeevCashError(str(message))
    return payload['data']


def create_checkout(*, recipient, amount_minor, redirect_url, meta, idempotency_key,
                    channels=None):
    if not settings.SEEVCASH_SECRET_KEY:
        raise SeevCashError('SeevCash payments are not configured.')
    body = {
        'type': 'checkout',
        'recipient': recipient,
        'amount': amount_minor,
        'currency': settings.SEEVCASH_CURRENCY,
        'redirect_url': redirect_url,
        'meta': meta,
    }
    if channels:
        body['channels'] = channels
    try:
        response = requests.post(
            f'{settings.SEEVCASH_BASE_URL}/api/v1/developer/payments',
            json=body,
            headers={
                'Authorization': f'Bearer {settings.SEEVCASH_SECRET_KEY}',
                'Idempotency-Key': idempotency_key,
                'Content-Type': 'application/json',
            },
            timeout=settings.SEEVCASH_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise SeevCashError('Could not reach SeevCash. Please try again.') from exc
    data = _data(response)
    reference = str(data.get('reference') or '')
    checkout_url = str(data.get('checkout_url') or '')
    if not reference or not checkout_url:
        raise SeevCashError('SeevCash did not return a checkout session.')
    return CheckoutSession(
        reference=reference,
        checkout_url=checkout_url,
        status=str(data.get('status') or 'pending'),
        expires_at=str(data.get('expires_at') or ''),
        session_id=str(data.get('id') or ''),
    )


def verify_checkout(session_reference):
    try:
        response = requests.get(
            f'{settings.SEEVCASH_BASE_URL}/api/v1/developer/payments/{session_reference}',
            timeout=settings.SEEVCASH_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise SeevCashError('Could not reach SeevCash. Please try again.') from exc
    return _data(response)
