import secrets
from decimal import Decimal
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .models import User, WishlistItem, B2BProfile, B2BDiscountTier
from .serializers import (
    RegisterSerializer, UserSerializer, WishlistItemSerializer,
    B2BProfileSerializer, B2BDiscountTierSerializer,
)
from .emails import (
    send_welcome_email, send_verification_email,
    send_b2b_approval_email, send_b2b_rejection_email,
)
from .google_auth import verify_google_token


def link_guest_orders(user):
    from orders.models import Order
    Order.objects.filter(user__isnull=True, guest_email=user.email).update(user=user)


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = secrets.token_urlsafe(32)
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save()

        try:
            send_welcome_email(user)
            send_verification_email(user, token)
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class VerifyEmailView(APIView):
    permission_classes = []

    def get(self, request):
        token = request.query_params.get('token', '')
        if not token:
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email_verification_token=token)
        except User.DoesNotExist:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        user.email_verified = True
        user.email_verification_token = ''
        user.save()

        link_guest_orders(user)

        return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        google_data = verify_google_token(token)
        if not google_data:
            return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)

        email = google_data['email']

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'first_name': google_data['first_name'],
                'last_name': google_data['last_name'],
                'email_verified': google_data['email_verified'],
                'is_active': True,
            },
        )
        print(f'Google login: {email}, created={created}')

        if not created:
            user.first_name = user.first_name or google_data['first_name']
            user.last_name = user.last_name or google_data['last_name']
            if google_data['email_verified']:
                user.email_verified = True
            user.save()

        if created:
            link_guest_orders(user)
            try:
                send_welcome_email(user)
            except Exception:
                pass

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


class WishlistView(generics.ListCreateAPIView):
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(
            user=self.request.user
        ).select_related('product', 'product__category', 'product__region', 'product__badge')


class WishlistItemDeleteView(generics.DestroyAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user)


class B2BApplyView(generics.CreateAPIView):
    serializer_class = B2BProfileSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        email = self.request.data.get('business_email', '')
        if B2BProfile.objects.filter(business_email=email).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business_email': 'An application with this email already exists.'})
        serializer.save()


class B2BSetupPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')

        if not uid or not token or not password:
            return Response({'error': 'uid, token and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.utils.http import urlsafe_base64_decode
            from django.utils.encoding import force_str
            from django.contrib.auth.tokens import default_token_generator

            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)

            if not default_token_generator.check_token(user, token):
                return Response(
                    {'error': 'Invalid or expired link. Please contact support.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user.set_password(password)
            user.save()

            from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken
            from .serializers import UserSerializer as US
            refresh = JWTRefreshToken.for_user(user)
            return Response({
                'message': 'Password set successfully!',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': US(user).data,
            })

        except (User.DoesNotExist, Exception):
            return Response(
                {'error': 'Invalid link. Please contact support.'},
                status=status.HTTP_400_BAD_REQUEST,
            )


class B2BStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = B2BProfile.objects.select_related('tier').get(user=request.user)
        except B2BProfile.DoesNotExist:
            return Response({'status': None}, status=status.HTTP_200_OK)
        return Response(B2BProfileSerializer(profile).data, status=status.HTTP_200_OK)


class B2BDiscountTiersView(generics.ListAPIView):
    queryset = B2BDiscountTier.objects.all()
    serializer_class = B2BDiscountTierSerializer
    permission_classes = []


class B2BDiscountCalculateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            profile = B2BProfile.objects.select_related('tier').get(
                user=request.user, status='approved'
            )
        except B2BProfile.DoesNotExist:
            return Response(
                {'error': 'No approved B2B account found.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            order_total = Decimal(str(request.data.get('order_total', 0)))
        except Exception:
            return Response({'error': 'Invalid order_total.'}, status=status.HTTP_400_BAD_REQUEST)

        tier = profile.tier
        if not tier:
            return Response({
                'discount_percent': '0.00',
                'discount_amount': '0.00',
                'final_amount': str(order_total),
                'tier': None,
            })

        discount_amount = (order_total * tier.discount_percent / Decimal('100')).quantize(Decimal('0.01'))
        final_amount = order_total - discount_amount

        return Response({
            'discount_percent': str(tier.discount_percent),
            'discount_amount': str(discount_amount),
            'final_amount': str(final_amount),
            'tier': B2BDiscountTierSerializer(tier).data,
        })


class ResendVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response({'message': 'Email is already verified.'}, status=status.HTTP_200_OK)

        token = secrets.token_urlsafe(32)
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save()

        try:
            send_verification_email(user, token)
        except Exception:
            return Response(
                {'error': 'Failed to send verification email. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({'message': 'Verification email sent.'}, status=status.HTTP_200_OK)
