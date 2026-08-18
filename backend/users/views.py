import logging
import secrets
from datetime import timedelta
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone

logger = logging.getLogger(__name__)
from .models import User, WishlistItem, B2BProfile, BusinessPriceList
from .serializers import (
    RegisterSerializer, UserSerializer, WishlistItemSerializer,
    B2BProfileSerializer, BusinessPriceListSerializer,
)
from .emails import (
    send_welcome_email, send_verification_email,
    send_b2b_approval_email, send_b2b_rejection_email,
)
from .google_auth import verify_google_token
from .turnstile import verify_turnstile


def link_guest_orders(user):
    from orders.models import Order
    Order.objects.filter(user__isnull=True, guest_email=user.email).update(user=user)


def _client_ip(request):
    # Trust only proxy-supplied values. Nginx overwrites X-Real-IP with the real
    # peer address, and appends it as the LAST X-Forwarded-For entry. The FIRST
    # X-Forwarded-For value is client-controlled and must never be trusted.
    real_ip = request.META.get('HTTP_X_REAL_IP', '').strip()
    if real_ip:
        return real_ip
    xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if xff:
        return xff.split(',')[-1].strip()
    return request.META.get('REMOTE_ADDR', '')


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = []
    throttle_scope = 'register'

    def create(self, request, *args, **kwargs):
        # Bot mitigation (only enforced once a Turnstile key is configured).
        if not verify_turnstile(request.data.get('turnstile_token'), _client_ip(request)):
            return Response(
                {'detail': 'Captcha verification failed. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = secrets.token_urlsafe(32)
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save()

        # No JWT is issued at signup. The account cannot log in until the email is
        # verified (see VerifiedTokenObtainPairView). The welcome email is deferred
        # to VerifyEmailView so unverified/bot signups never trigger it.
        try:
            send_verification_email(user, token)
        except Exception:
            pass

        return Response({
            'user': UserSerializer(user).data,
            'email_verification_required': True,
            'detail': 'Account created. Please check your email to verify your address before logging in.',
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

        # Enforce token expiry. Invariant: a token with no send timestamp is
        # invalid (not indefinitely valid), and one older than the window expires.
        expiry = timedelta(hours=settings.EMAIL_VERIFICATION_TOKEN_HOURS)
        sent_at = user.email_verification_sent_at
        if sent_at is None or timezone.now() - sent_at > expiry:
            return Response(
                {'error': 'Invalid or expired token.', 'code': 'token_expired'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        already_verified = user.email_verified
        user.email_verified = True
        user.email_verification_token = ''
        user.save(update_fields=['email_verified', 'email_verification_token'])

        link_guest_orders(user)

        # Welcome email now fires here (after verification), not at signup, so bot/
        # unverified accounts never receive it. Guard against re-sending if the link
        # is opened twice.
        if not already_verified:
            try:
                send_welcome_email(user)
            except Exception:
                pass

        # Issue tokens so the freshly-verified user is logged in immediately.
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Email verified successfully.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)

        google_data = verify_google_token(token)
        if not google_data:
            return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)

        # Only accept Google identities Google itself reports as verified.
        if not google_data.get('email_verified'):
            return Response(
                {'error': 'Your Google account email is not verified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

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
    throttle_scope = 'b2b_apply'

    def create(self, request, *args, **kwargs):
        # B2B applications are public and were being targeted by distributed
        # bots. Per-IP throttling is not sufficient when addresses rotate, so
        # enforce the same server-verified Turnstile boundary as registration.
        if not verify_turnstile(request.data.get('turnstile_token'), _client_ip(request)):
            return Response(
                {'detail': 'Captcha verification failed. Please try again.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        email = self.request.data.get('business_email', '')
        if B2BProfile.objects.filter(business_email=email).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'business_email': 'An application with this email already exists.'})
        serializer.save()

        try:
            from notifications.utils import notify_admins
            profile = serializer.instance
            notify_admins(
                type='b2b_application',
                title='New B2B application',
                body=f'{profile.company_name} submitted a B2B application',
                link=f'/admin/users/b2bprofile/{profile.pk}/change/',
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f'b2b_application notification failed: {e}', exc_info=True)


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
            profile = B2BProfile.objects.select_related('price_list').get(user=request.user)
        except B2BProfile.DoesNotExist:
            return Response({'status': None}, status=status.HTTP_200_OK)
        return Response(B2BProfileSerializer(profile).data, status=status.HTTP_200_OK)


class B2BPriceListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            profile = B2BProfile.objects.select_related('price_list').get(
                user=request.user, status='approved'
            )
        except B2BProfile.DoesNotExist:
            return Response(
                {'error': 'No approved B2B account found.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        price_list = profile.price_list or BusinessPriceList.objects.filter(
            is_default=True, is_active=True
        ).first()
        if not price_list:
            return Response({'price_list': None})
        return Response({
            'price_list': BusinessPriceListSerializer(price_list).data,
        })


class ResendVerificationView(APIView):
    # AllowAny: with verification-gating, unverified users hold no JWT, so this
    # endpoint must be reachable without authentication (looked up by email).
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'resend_verification'

    # Identical response for anonymous callers regardless of account state, so the
    # endpoint cannot be used to enumerate which emails are registered/verified.
    GENERIC_MESSAGE = (
        'If an account exists for that email and is not yet verified, '
        'a verification link has been sent.'
    )

    def _issue(self, user):
        """Regenerate + send a verification token for an unverified user.
        Delivery failures are logged internally, never surfaced to the caller."""
        if user.email_verified:
            return
        token = secrets.token_urlsafe(32)
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save(update_fields=['email_verification_token', 'email_verification_sent_at'])
        try:
            send_verification_email(user, token)
        except Exception as e:
            logger.error(
                f'Verification email delivery failed for user {user.pk}: {e}',
                exc_info=True,
            )

    def post(self, request):
        # Authenticated user resending for themselves — not an enumeration vector,
        # so specific messaging is fine.
        if request.user and request.user.is_authenticated:
            user = request.user
            if user.email_verified:
                return Response({'message': 'Email is already verified.'}, status=status.HTTP_200_OK)
            self._issue(user)
            return Response({'message': 'Verification email sent.'}, status=status.HTTP_200_OK)

        # Anonymous: unknown / verified / unverified / delivery-failure must all
        # produce exactly the same status and body.
        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if user is not None:
            self._issue(user)

        return Response({'message': self.GENERIC_MESSAGE}, status=status.HTTP_200_OK)
