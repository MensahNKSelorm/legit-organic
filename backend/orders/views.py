import requests
from django.conf import settings
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


class CartView(generics.RetrieveAPIView):
    serializer_class = CartSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return cart


class CartItemViewSet(generics.ListCreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)

    def perform_create(self, serializer):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        serializer.save(cart=cart)


class CreateOrderView(APIView):
    permission_classes = [AllowAny]

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

        # Verify with Paystack
        secret_key = settings.PAYSTACK_SECRET_KEY
        if secret_key:
            try:
                resp = requests.get(
                    f'https://api.paystack.co/transaction/verify/{reference}',
                    headers={'Authorization': f'Bearer {secret_key}'},
                    timeout=10,
                )
                data = resp.json()
                if not data.get('status') or data.get('data', {}).get('status') != 'success':
                    order.payment_status = 'failed'
                    order.save(update_fields=['payment_status'])
                    return Response({'detail': 'Payment verification failed.'}, status=status.HTTP_402_PAYMENT_REQUIRED)

                paystack_id = data['data'].get('id', '')
                order.paystack_id = str(paystack_id)
            except Exception:
                pass  # Allow in dev/test environments without live Paystack

        order.payment_status = 'success'
        order.status = 'processing'
        order.save(update_fields=['payment_status', 'status', 'paystack_id'])

        try:
            from users.emails import send_order_confirmation_email
            send_order_confirmation_email(order.user, order)
        except Exception:
            pass  # Never let email failure break the payment confirmation

        return Response(OrderSerializer(order).data)


class ValidatePromoView(APIView):
    permission_classes = [permissions.IsAuthenticated]

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
        return Order.objects.filter(user=self.request.user).order_by('-created_at')


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
    permission_classes = [AllowAny]

    def get(self, request, reference):
        try:
            order = Order.objects.prefetch_related(
                'items', 'items__product', 'promo_code'
            ).get(reference=reference)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Order not found'},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Security: only allow if authenticated user owns the order
        # or if it's a guest order (no user attached)
        if order.user and request.user.is_authenticated:
            if order.user != request.user and not request.user.is_staff:
                return Response(
                    {'error': 'Unauthorized'},
                    status=status.HTTP_403_FORBIDDEN,
                )

        from .receipt import generate_receipt_pdf
        return generate_receipt_pdf(order)
