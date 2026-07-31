from decimal import ROUND_HALF_UP, Decimal

import requests
from django.conf import settings
from django.db import transaction
from rest_framework import generics, permissions, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Cart, CartItem, Order
from .promo_models import PromoCode
from .serializers import (
    CartSerializer, CartItemSerializer,
    OrderSerializer, CreateOrderSerializer,
)
from products.models import Product


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


class VerifyPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        reference = request.data.get('reference')
        if not reference:
            return Response({'detail': 'Reference is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            order = Order.objects.get(reference=reference, user=request.user)
        except Order.DoesNotExist:
            return Response({'detail': 'Order not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Idempotency: an already-verified order returns its current state and is not
        # re-processed (no duplicate emails, status transitions, or commissions).
        if order.payment_status == 'success':
            return Response(OrderSerializer(order).data)

        secret_key = settings.PAYSTACK_SECRET_KEY
        # Fail CLOSED: an order is never marked paid without a positive verification
        # from Paystack. If verification cannot be performed, the payment stays pending.
        if not secret_key:
            return Response(
                {'detail': 'Payment verification is not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        try:
            resp = requests.get(
                f'https://api.paystack.co/transaction/verify/{reference}',
                headers={'Authorization': f'Bearer {secret_key}'},
                timeout=15,
            )
        except requests.RequestException:
            return Response(
                {'detail': 'Could not reach the payment provider. Please try again.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        try:
            payload = resp.json()
        except ValueError:
            return Response(
                {'detail': 'Invalid response from the payment provider.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        pdata = payload.get('data') or {}
        if not payload.get('status') or pdata.get('status') != 'success':
            order.payment_status = 'failed'
            order.save(update_fields=['payment_status'])
            return Response(
                {'detail': 'Payment verification failed.'},
                status=status.HTTP_402_PAYMENT_REQUIRED,
            )

        # The transaction Paystack verified must be the one we asked about.
        if pdata.get('reference') != reference:
            return Response(
                {'detail': 'Payment reference mismatch.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Currency must match what we charge in.
        if (pdata.get('currency') or '').upper() != settings.PAYSTACK_CURRENCY.upper():
            return Response(
                {'detail': 'Payment currency mismatch.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Amount check. Paystack reports the amount in the minor unit (pesewas),
        # i.e. the charged value × 100. Reject underpayment; overpayment is allowed.
        expected_minor = int(
            (order.final_amount * 100).to_integral_value(rounding=ROUND_HALF_UP)
        )
        paid_minor = pdata.get('amount')
        if not isinstance(paid_minor, int) or paid_minor < expected_minor:
            return Response(
                {'detail': 'Payment amount mismatch.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # All checks passed — perform the state transition exactly once, even under
        # concurrent verification requests. select_for_update() serialises the two
        # requests; whichever loses the race reloads a row already marked 'success'
        # and returns without re-running the transition side effects (which fire
        # from Order.save(): confirmation email, status email, commissions).
        with transaction.atomic():
            locked = Order.objects.select_for_update().get(pk=order.pk)
            if locked.payment_status == 'success':
                return Response(OrderSerializer(locked).data)

            locked.paystack_id = str(pdata.get('id', '') or '')
            locked.payment_status = 'success'
            locked.status = 'processing'
            locked.save(update_fields=['payment_status', 'status', 'paystack_id'])
            order = locked

        try:
            from users.emails import send_order_confirmation_email
            if order.user:
                send_order_confirmation_email(order.user, order)
        except Exception:
            pass  # Never let email failure break the payment confirmation

        return Response(OrderSerializer(order).data)


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

        from .exports import generate_orders_excel
        return generate_orders_excel(list(orders), date_from, date_to, status_filter)


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
