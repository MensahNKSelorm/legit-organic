import requests
from django.conf import settings


def verify_google_token(token: str) -> dict | None:
    try:
        response = requests.get(
            'https://oauth2.googleapis.com/tokeninfo',
            params={'id_token': token},
            timeout=10
        )
        if response.status_code != 200:
            return None

        data = response.json()

        if data.get('aud') != settings.GOOGLE_CLIENT_ID:
            return None

        return {
            'google_id': data.get('sub'),
            'email': data.get('email'),
            'first_name': data.get('given_name', ''),
            'last_name': data.get('family_name', ''),
            'avatar': data.get('picture', ''),
            'email_verified': data.get('email_verified') == 'true',
        }
    except Exception:
        return None
