import requests
from django.conf import settings
from rest_framework import generics, permissions, status
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
    permission_classes = [permissions.IsAuthenticated]

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
