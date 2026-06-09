import requests
from django.conf import settings

WIGAL_SMS_URL = 'https://frog.wigal.com.gh/api/sms/send'


def send_sms(phone_number: str, message: str) -> bool:
    if not settings.WIGAL_API_KEY:
        return False

    phone = phone_number.strip().replace(' ', '').replace('+', '')
    if phone.startswith('0'):
        phone = '233' + phone[1:]
    elif not phone.startswith('233'):
        phone = '233' + phone

    try:
        response = requests.post(
            WIGAL_SMS_URL,
            json={
                'key': settings.WIGAL_API_KEY,
                'senderid': settings.WIGAL_SENDER_ID,
                'phone': phone,
                'message': message,
            },
            timeout=10
        )
        data = response.json()
        return data.get('status') == 'success' or response.status_code == 200
    except Exception:
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
