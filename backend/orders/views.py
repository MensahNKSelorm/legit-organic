from decimal import ROUND_HALF_UP, Decimal
import hashlib
import hmac
import json
import time

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Cart, CartItem, Order, SeevCashWebhookEvent
from .promo_models import PromoCode
from .serializers import (
    CartSerializer, CartItemSerializer,
    OrderSerializer, CreateOrderSerializer,
)
from products.models import Product
from legitorganic.seevcash import SeevCashError, create_checkout, verify_checkout


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart = Cart.objects.prefetch_related('items__product__images').get(pk=cart.pk)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)


class CartItemViewSet(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        cart_item, created = CartItem.objects.get_or_create(
            cart=cart, product=product, defaults={'quantity': quantity}
        )
        if not created:
            cart_item.quantity = quantity
            cart_item.save()

        cart = Cart.objects.prefetch_related('items__product__images').get(pk=cart.pk)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)

    def delete(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        CartItem.objects.filter(cart=cart, product_id=product_id).delete()
        cart = Cart.objects.prefetch_related('items__product__images').get(pk=cart.pk)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)


class CartClearView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        cart = Cart.objects.prefetch_related('items__product__images').get(pk=cart.pk)
        serializer = CartSerializer(cart, context={'request': request})
        return Response(serializer.data)


class CreateOrderView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = 'guest_order'

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data, context={'request': request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            order = serializer.save()
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


def _customer_name(order):
    if order.user:
        return order.user.get_full_name() or order.user.email
    return order.guest_name


class InitializePaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, reference):
        order = get_object_or_404(Order.objects.prefetch_related('items__product'), reference=reference)
        if order.user_id and (not request.user.is_authenticated or order.user_id != request.user.id):
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)
        if order.payment_status == 'success':
            return Response({'detail': 'This order is already paid.'}, status=status.HTTP_400_BAD_REQUEST)
        email = order.user.email if order.user_id else order.guest_email
        if not email:
            return Response(
                {'detail': 'A customer email is required for SeevCash checkout.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not settings.SEEVCASH_SECRET_KEY:
            return Response(
                {'detail': 'SeevCash payments are not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        amount = int((order.final_amount * 100).to_integral_value(rounding=ROUND_HALF_UP))
        try:
            session = create_checkout(
                recipient={
                    'name': _customer_name(order), 'email': email,
                    'phone': order.guest_phone, 'address': order.delivery_address,
                },
                amount_minor=amount,
                redirect_url=f'{settings.FRONTEND_URL}/payment?order={order.reference}',
                meta={'orderId': order.reference, 'kind': order.order_source},
                idempotency_key=f'order-{order.pk}-checkout',
                channels=['mobile_money'],
            )
        except SeevCashError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        order.payment_provider = 'seevcash'
        order.checkout_reference = session.reference
        order.checkout_url = session.checkout_url
        order.checkout_expires_at = parse_datetime(session.expires_at) if session.expires_at else None
        if order.order_source != 'subscription':
            order.order_source = 'seevcash'
        order.save(update_fields=[
            'payment_provider', 'checkout_reference', 'checkout_url',
            'checkout_expires_at', 'order_source', 'updated_at',
        ])
        return Response({'checkout_url': session.checkout_url, 'reference': session.reference})


class VerifyPaymentView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        session_reference = request.data.get('reference')
        order_reference = request.data.get('order_reference')
        if not session_reference and not order_reference:
            return Response({'detail': 'Reference is required.'}, status=status.HTTP_400_BAD_REQUEST)
        filters = {'checkout_reference': session_reference} if session_reference else {'reference': order_reference}
        order = get_object_or_404(Order, **filters)
        if order.user_id and (not request.user.is_authenticated or order.user_id != request.user.id):
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Idempotency: an already-verified order returns its current state and is not
        # re-processed (no duplicate emails, status transitions, or commissions).
        if order.payment_status == 'success':
            return Response(OrderSerializer(order).data)

        provider_reference = session_reference or order.checkout_reference
        if not provider_reference:
            return Response(
                {'detail': 'This order has no SeevCash checkout.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            pdata = verify_checkout(provider_reference)
        except SeevCashError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        error_response = _verified_payment_error(order, pdata)
        provider_status = str(pdata.get('status') or '').lower()
        if provider_status not in ('completed', 'success'):
            if provider_status in ('failed', 'cancelled'):
                order.payment_status = 'failed'
                order.save(update_fields=['payment_status'])
            return Response(
                {'detail': f'Payment is {provider_status or "not completed"}.'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        if error_response:
            return error_response

        # All checks passed — perform the state transition exactly once, even under
        # concurrent verification requests. select_for_update() serialises the two
        # requests; whichever loses the race reloads a row already marked 'success'
        # and returns without re-running the transition side effects (which fire
        # from Order.save(): confirmation email, status email, commissions).
        order, _ = _complete_verified_order(order.pk, pdata)

        return Response(OrderSerializer(order).data)


def _verified_payment_error(order, pdata):
    if str(pdata.get('reference') or '') != order.checkout_reference:
        return Response({'detail': 'Payment reference mismatch.'}, status=400)
    if (pdata.get('currency') or '').upper() != settings.SEEVCASH_CURRENCY.upper():
        return Response({'detail': 'Payment currency mismatch.'}, status=400)
    expected_minor = int((order.final_amount * 100).to_integral_value(rounding=ROUND_HALF_UP))
    paid_minor = pdata.get('final_amount', pdata.get('amount'))
    if not isinstance(paid_minor, int) or paid_minor < expected_minor:
        return Response({'detail': 'Payment amount mismatch.'}, status=400)
    return None


def _complete_verified_order(order_id, pdata):
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order_id)
        if order.payment_status == 'success':
            return order, False
        order.provider_transaction_id = str(pdata.get('id', '') or '')
        order.payment_status = 'success'
        order.status = 'processing'
        order.save(update_fields=['payment_status', 'status', 'provider_transaction_id'])

    if hasattr(order, 'subscription_week'):
        from subscriptions.services import finalize_paid_week
        finalize_paid_week(order.subscription_week.pk, pdata)
    try:
        from users.emails import send_order_confirmation_email
        if order.user:
            send_order_confirmation_email(order.user, order)
    except Exception:
        pass
    return order, True


def _webhook_reference(payload):
    data = payload.get('data', payload) if isinstance(payload, dict) else {}
    if not isinstance(data, dict):
        return ''
    for candidate in (
        data.get('reference'),
        (data.get('payment') or {}).get('reference') if isinstance(data.get('payment'), dict) else None,
        (data.get('session') or {}).get('reference') if isinstance(data.get('session'), dict) else None,
    ):
        if candidate:
            return str(candidate)
    return ''


class SeevCashWebhookView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        secret = settings.SEEVCASH_WEBHOOK_SECRET
        if not secret:
            return Response({'detail': 'Webhook signing is not configured.'}, status=503)

        raw_body = request.body
        event_id = request.headers.get('X-Seev-Event-ID', '')
        event_type = request.headers.get('X-Seev-Event-Type', '')
        timestamp = request.headers.get('X-Seev-Timestamp', '')
        supplied_signature = request.headers.get('X-Seev-Signature', '')
        try:
            timestamp_value = int(timestamp)
        except (TypeError, ValueError):
            return Response({'detail': 'Invalid webhook timestamp.'}, status=401)
        if abs(int(time.time()) - timestamp_value) > 300:
            return Response({'detail': 'Stale webhook timestamp.'}, status=401)
        signed = timestamp.encode() + b'.' + raw_body
        expected = 'v1=' + hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, supplied_signature):
            return Response({'detail': 'Invalid webhook signature.'}, status=401)
        if not event_id or not event_type:
            return Response({'detail': 'Missing webhook headers.'}, status=400)
        try:
            payload = json.loads(raw_body.decode('utf-8'))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return Response({'detail': 'Invalid JSON payload.'}, status=400)

        payload_hash = hashlib.sha256(raw_body).hexdigest()
        event, created = SeevCashWebhookEvent.objects.get_or_create(
            event_id=event_id,
            defaults={'event_type': event_type, 'payload_hash': payload_hash},
        )
        if not created and event.status in ('processed', 'ignored'):
            return Response({'received': True})

        reference = _webhook_reference(payload)
        if event_type not in ('payment.succeeded', 'payment.failed'):
            event.status = 'ignored'
            event.processed_at = timezone.now()
            event.save(update_fields=['status', 'processed_at'])
            return Response({'received': True})
        if not reference:
            event.status = 'failed'
            event.error = 'Missing payment reference.'
            event.save(update_fields=['status', 'error'])
            return Response({'detail': event.error}, status=400)

        try:
            order = Order.objects.get(checkout_reference=reference)
        except Order.DoesNotExist:
            event.status = 'failed'
            event.error = 'Order not found.'
            event.save(update_fields=['status', 'error'])
            return Response({'detail': event.error}, status=404)
        event.order = order

        try:
            if event_type == 'payment.succeeded':
                pdata = verify_checkout(reference)
                provider_status = str(pdata.get('status') or '').lower()
                if provider_status not in ('completed', 'success'):
                    raise ValueError('Payment is not completed.')
                error_response = _verified_payment_error(order, pdata)
                if error_response:
                    raise ValueError(error_response.data['detail'])
                _complete_verified_order(order.pk, pdata)
            else:
                with transaction.atomic():
                    locked = Order.objects.select_for_update().get(pk=order.pk)
                    if locked.payment_status == 'pending':
                        locked.payment_status = 'failed'
                        locked.save(update_fields=['payment_status'])
            event.status = 'processed'
            event.error = ''
            event.processed_at = timezone.now()
            event.save(update_fields=['order', 'status', 'error', 'processed_at'])
        except (SeevCashError, ValueError) as exc:
            event.status = 'failed'
            event.error = str(exc)[:500]
            event.save(update_fields=['order', 'status', 'error'])
            return Response({'detail': str(exc)}, status=502)
        return Response({'received': True})


class ValidatePromoView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'promo_validate'

    def post(self, request):
        code = request.data.get('code', '').strip().upper()
        order_amount = float(request.data.get('order_amount', 0))

        try:
            promo = PromoCode.objects.get(code=code)
        except PromoCode.DoesNotExist:
            return Response(
                {'error': 'Invalid promo code.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        is_valid, message = promo.is_valid(order_amount)
        if not is_valid:
            return Response(
                {'error': message},
                status=status.HTTP_400_BAD_REQUEST
            )

        discount = promo.calculate_discount(order_amount)

        return Response({
            'code': promo.code,
            'ambassador_name': promo.ambassador_name,
            'discount_type': promo.discount_type,
            'discount_value': float(promo.discount_value),
            'discount_amount': float(discount),
            'final_amount': round(order_amount - float(discount), 2),
            'message': f'Promo code applied! You save GH₵{discount:.2f}',
        })


class UserOrderListView(generics.ListAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .prefetch_related('items__product__images')
            .order_by('-created_at')
        )


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'reference'

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user)


class ExportOrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {'error': 'Staff access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        date_from     = request.query_params.get('date_from')
        date_to       = request.query_params.get('date_to')
        status_filter = request.query_params.get('status')
        source_filter = request.query_params.get('source')
        payment_filter = request.query_params.get('payment_status')
        customer = request.query_params.get('customer', '').strip()

        orders = Order.objects.select_related(
            'user', 'promo_code'
        ).prefetch_related(
            'items', 'items__product'
        ).order_by('-created_at')

        if date_from:
            orders = orders.filter(created_at__date__gte=date_from)
        if date_to:
            orders = orders.filter(created_at__date__lte=date_to)
        if status_filter and status_filter != 'all':
            orders = orders.filter(status=status_filter)
        if source_filter and source_filter != 'all':
            orders = orders.filter(order_source=source_filter)
        if payment_filter and payment_filter != 'all':
            orders = orders.filter(payment_status=payment_filter)
        if customer:
            from django.db.models import Q
            orders = orders.filter(
                Q(reference__icontains=customer)
                | Q(user__email__icontains=customer)
                | Q(user__first_name__icontains=customer)
                | Q(user__last_name__icontains=customer)
                | Q(guest_name__icontains=customer)
                | Q(guest_email__icontains=customer)
                | Q(guest_phone__icontains=customer)
            )

        from .exports import generate_orders_excel
        from security.audit import record_event
        from security.models import AuditEvent
        record_event(
            action='order.exported', request=request,
            severity=AuditEvent.Severity.SENSITIVE,
            metadata={
                'scope': 'api_filtered', 'count': orders.count(),
                'filters': {
                    'date_from': date_from, 'date_to': date_to,
                    'status': status_filter, 'payment_status': payment_filter,
                    'source': source_filter, 'customer': customer,
                },
            },
        )
        return generate_orders_excel(
            list(orders), date_from, date_to, status_filter,
            filters={
                'Date from': date_from, 'Date to': date_to,
                'Order status': status_filter, 'Payment status': payment_filter,
                'Channel': source_filter, 'Customer/reference': customer,
            },
        )


class OrderReceiptView(APIView):
    # Authentication required. This closes the previous hole where an anonymous
    # request with any known/leaked reference could download a receipt PDF
    # containing customer name, email, phone, and delivery address.
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reference):
        try:
            order = Order.objects.prefetch_related(
                'items', 'items__product', 'promo_code'
            ).get(reference=reference)
        except Order.DoesNotExist:
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        is_owner = order.user_id is not None and order.user_id == request.user.id
        if not (is_owner or request.user.is_staff):
            # 404 (not 403) so a reference can't be confirmed by a non-owner.
            # NOTE: guest-order receipts (no user attached) are staff-only for now.
            # Self-service guest receipts will use signed, expiring tokens (follow-up).
            return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        from .receipt import generate_receipt_pdf
        return generate_receipt_pdf(order)
