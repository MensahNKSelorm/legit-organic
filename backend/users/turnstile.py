"""Cloudflare Turnstile server-side verification.

Turnstile is only enforced when a secret key is configured (settings.TURNSTILE_ENABLED).
Until keys are provisioned, verify_turnstile() is a no-op that returns True, so dev and
the current production signup flow are unchanged. When enabled, it fails closed.
"""

import requests
from django.conf import settings

VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'


def verify_turnstile(token, remoteip=None):
    if not settings.TURNSTILE_ENABLED:
        return True
    if not token:
        return False
    try:
        resp = requests.post(
            VERIFY_URL,
            data={
                'secret': settings.TURNSTILE_SECRET_KEY,
                'response': token,
                'remoteip': remoteip or '',
            },
            timeout=10,
        )
        return bool(resp.json().get('success'))
    except Exception:
        # Enabled but provider unreachable / malformed → fail closed.
        return False
