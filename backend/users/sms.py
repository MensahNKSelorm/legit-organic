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
        return response.status_code == 200 and data.get('status') == 'ACCEPTD'

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
        return False

    delivery_pin = getattr(order, '_delivery_pin_plaintext', '')
    STATUS_MESSAGES = {
        'paid': f'Legit Organic: Payment received for {order.reference}. We will notify you as your order progresses.',
        'processing': f'Legit Organic: We are preparing order {order.reference}. You will hear from us when it is ready for dispatch.',
        'ready_for_dispatch': f'Legit Organic: Order {order.reference} is packed and ready for dispatch. Your delivery details will follow.',
        'out_for_delivery': (
            f'Legit Organic: Order {order.reference} is out for delivery. '
            f'Delivery PIN: {delivery_pin}. Give this PIN to the driver only after receiving your order.'
        ),
        'shipped': f'Legit Organic: Order {order.reference} has been dispatched. Please ensure someone is available to receive it.',
        'delivered': f'Legit Organic: Delivery completed for order {order.reference}. Thank you for choosing us.',
        'cancelled': f'Legit Organic: Order {order.reference} has been cancelled. For assistance, email hello@legitorganic.com.',
    }

    message = STATUS_MESSAGES.get(order.status)
    if not message:
        return False

    return send_sms(phone, message)
