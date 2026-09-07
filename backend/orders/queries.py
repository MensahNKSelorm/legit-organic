from django.db.models import Q


FULFILMENT_STATUSES = {
    'paid',
    'processing',
    'ready_for_dispatch',
    'out_for_delivery',
    'shipped',
    'delivered',
}


def payment_exception_q():
    """Orders whose payment and fulfilment states contradict each other."""
    paid_but_not_released = Q(
        payment_status='success', status__in={'pending', 'whatsapp_pending'}
    )
    fulfilment_without_payment = ~Q(payment_status='success') & Q(
        status__in=FULFILMENT_STATUSES
    )
    return paid_but_not_released | fulfilment_without_payment
