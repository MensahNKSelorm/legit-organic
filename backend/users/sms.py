import requests
import json
import uuid
from django.conf import settings

WIGAL_SMS_URL = 'https://frogapi.wigal.com.gh/api/v3/sms/send'


def send_sms(phone_number: str, message: str) -> bool:
    if not settings.WIGAL_API_KEY:
        return False

    # Normalize phone number
    phone = phone_number.strip().replace(' ', '').replace('+', '')
    if phone.startswith('0'):
        phone = '233' + phone[1:]
    elif not phone.startswith('233'):
        phone = '233' + phone

    try:
        post_data = {
            'senderid': settings.WIGAL_SENDER_ID,
            'destinations': [{
                'destination': phone,
                'msgid': str(uuid.uuid4())[:8].upper()
            }],
            'message': message,
            'smstype': 'text'
        }

        headers = {
            'Content-Type': 'application/json',
            'API-KEY': settings.WIGAL_API_KEY,
            'USERNAME': settings.WIGAL_USERNAME,
        }

        response = requests.post(
            WIGAL_SMS_URL,
            headers=headers,
            data=json.dumps(post_data),
            timeout=10
        )

        data = response.json()
        print('Wigal SMS response:', data)
        return response.status_code == 200

    except Exception as e:
        print('Wigal SMS error:', e)
        return False


def send_order_status_sms(order):
    """Send SMS when order status changes."""
    if order.user and order.user.phone_number:
        phone = order.user.phone_number
    elif order.guest_phone:
        phone = order.guest_phone
    else:
        return

    STATUS_MESSAGES = {
        'paid': f'Legit Organic: Payment confirmed for order {order.reference}. We are preparing your organic produce. Thank you!',
        'processing': f'Legit Organic: Your order {order.reference} is being prepared. We will notify you when it ships.',
        'shipped': f'Legit Organic: Great news! Your order {order.reference} is on its way. Expected delivery: 1-3 business days.',
        'delivered': f'Legit Organic: Your order {order.reference} has been delivered. Enjoy your fresh organic produce! Thank you for choosing us.',
        'cancelled': f'Legit Organic: Your order {order.reference} has been cancelled. Contact us at hello@legitorganic.com for assistance.',
    }

    message = STATUS_MESSAGES.get(order.status)
    if not message:
        return

    send_sms(phone, message)
