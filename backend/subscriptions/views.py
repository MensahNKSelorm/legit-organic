from decimal import ROUND_HALF_UP

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    DeliveryZone, Subscription, SubscriptionPlan, SubscriptionWeek,
    WholesaleQuote,
)
from .serializers import (
    DeliveryZoneSerializer, SubscriptionPlanSerializer, SubscriptionSerializer,
    WholesaleQuoteSerializer,
)
from .services import finalize_paid_week, schedule_next_week
from .services import ensure_renewal_order
from legitorganic.seevcash import SeevCashError, create_checkout, verify_checkout


class DeliveryZoneListView(generics.ListAPIView):
    queryset = DeliveryZone.objects.filter(is_active=True)
    serializer_class = DeliveryZoneSerializer
    permission_classes = [permissions.AllowAny]


class SubscriptionPlanListView(generics.ListAPIView):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = SubscriptionPlan.objects.filter(is_active=True).prefetch_related(
            'items__product'
        )
        audience = self.request.query_params.get('audience')
        return queryset.filter(audience=audience) if audience else queryset


class SubscriptionListCreateView(generics.ListCreateAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user).select_related(
            'plan', 'delivery_zone', 'business_profile'
        ).prefetch_related('items__product', 'plan__items__product', 'weeks')


class SubscriptionDetailView(generics.RetrieveAPIView):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user).select_related(
            'plan', 'delivery_zone', 'business_profile'
        ).prefetch_related('items__product', 'plan__items__product', 'weeks')


class SubscriptionActionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk, action):
        subscription = get_object_or_404(
            Subscription, pk=pk, user=request.user
        )
        now = timezone.now()
        if action == 'pause' and subscription.status == 'active':
            subscription.status = 'paused'
            subscription.paused_at = now
            for week in subscription.weeks.select_related('order').filter(
                status__in=['scheduled', 'renewal_order', 'payment_due']
            ):
                week.status = 'cancelled'
                week.save(update_fields=['status', 'updated_at'])
                if week.order_id and week.order.payment_status == 'pending':
                    week.order.status = 'cancelled'
                    week.order.save(update_fields=['status'])
        elif action == 'resume' and subscription.status == 'paused':
            subscription.status = 'active'
            subscription.paused_at = None
            schedule_next_week(subscription, subscription.next_delivery_date)
        elif action == 'cancel' and subscription.status != 'cancelled':
            subscription.status = 'cancelled'
            subscription.cancelled_at = now
            pending_weeks = subscription.weeks.select_related('order').filter(
                status__in=['scheduled', 'renewal_order', 'payment_due']
            )
            for week in pending_weeks:
                week.status = 'cancelled'
                week.save(update_fields=['status', 'updated_at'])
                if week.order_id and week.order.payment_status == 'pending':
                    week.order.status = 'cancelled'
                    week.order.save(update_fields=['status'])
        elif action == 'skip':
            week = subscription.weeks.filter(
                delivery_date=subscription.next_delivery_date,
                status__in=['scheduled', 'renewal_order', 'payment_due'],
                cutoff_at__gt=now,
            ).first()
            if not week:
                return Response(
                    {'detail': 'This delivery can no longer be skipped.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            week.status = 'skipped'
            week.save(update_fields=['status', 'updated_at'])
            schedule_next_week(subscription, week.delivery_date)
            return Response(SubscriptionSerializer(subscription, context={'request': request}).data)
        else:
            return Response(
                {'detail': 'That action is not available.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        subscription.save(update_fields=[
            'status', 'paused_at', 'cancelled_at', 'updated_at'
        ])
        return Response(SubscriptionSerializer(subscription, context={'request': request}).data)


def _business_profile(user):
    try:
        return user.b2b_profile
    except Exception:
        return None


class WholesaleQuoteListCreateView(generics.ListCreateAPIView):
    serializer_class = WholesaleQuoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        profile = _business_profile(self.request.user)
        if not profile or profile.status != 'approved':
            return WholesaleQuote.objects.none()
        return profile.quotes.prefetch_related('items__product')

    def perform_create(self, serializer):
        profile = _business_profile(self.request.user)
        if not profile or profile.status != 'approved':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('An approved business account is required.')
        serializer.save()


class SubscriptionPaymentInitializeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        subscription = get_object_or_404(
            Subscription.objects.prefetch_related('weeks'), pk=pk, user=request.user
        )
        week = subscription.weeks.filter(
            status__in=['renewal_order', 'payment_due']
        ).order_by('delivery_date').first()
        if not week:
            return Response({'detail': 'No payment is due.'}, status=status.HTTP_400_BAD_REQUEST)
        if week.cutoff_at <= timezone.now():
            week.status = 'expired'
            week.payment_error = 'The payment window closed before payment was completed.'
            week.save(update_fields=['status', 'payment_error', 'updated_at'])
            if week.order_id:
                week.order.payment_status = 'expired'
                week.order.save(update_fields=['payment_status'])
            return Response({'detail': 'This renewal payment window has expired.'}, status=status.HTTP_410_GONE)
        order = ensure_renewal_order(week.pk)
        if not settings.SEEVCASH_SECRET_KEY:
            return Response(
                {'detail': 'SeevCash payments are not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        amount = int((week.total * 100).to_integral_value(rounding=ROUND_HALF_UP))
        try:
            session = create_checkout(
                recipient={
                    'name': request.user.get_full_name() or request.user.email,
                    'email': request.user.email, 'phone': subscription.contact_phone,
                    'address': subscription.delivery_address,
                },
                amount_minor=amount,
                redirect_url=f'{settings.FRONTEND_URL}/subscriptions/payment?week={week.pk}',
                meta={
                    'orderId': order.reference, 'subscriptionId': subscription.pk,
                    'weekId': week.pk,
                },
                idempotency_key=f'subscription-week-{week.pk}-checkout',
                channels=['mobile_money'],
            )
        except SeevCashError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        order.checkout_reference = session.reference
        order.checkout_url = session.checkout_url
        order.payment_provider = 'seevcash'
        order.save(update_fields=[
            'checkout_reference', 'checkout_url', 'payment_provider', 'updated_at'
        ])
        week.payment_reference = session.reference
        week.payment_attempts += 1
        week.save(update_fields=['payment_reference', 'payment_attempts', 'updated_at'])
        return Response({'checkout_url': session.checkout_url, 'reference': session.reference})


class SubscriptionPaymentVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        reference = request.data.get('reference', '')
        week_id = request.data.get('week_id')
        week = get_object_or_404(
            SubscriptionWeek.objects.select_related('subscription').filter(
                subscription__user=request.user
            ), **({'payment_reference': reference} if reference else {'pk': week_id}),
        )
        if week.status == 'paid':
            return Response(SubscriptionSerializer(week.subscription, context={'request': request}).data)
        if not week.payment_reference:
            return Response({'detail': 'This renewal has no checkout session.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            data = verify_checkout(week.payment_reference)
        except SeevCashError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        expected = int((week.total * 100).to_integral_value(rounding=ROUND_HALF_UP))
        paid = data.get('final_amount', data.get('amount'))
        valid = (
            str(data.get('status') or '').lower() in ('completed', 'success')
            and data.get('reference') == week.payment_reference
            and (data.get('currency') or '').upper() == settings.SEEVCASH_CURRENCY.upper()
            and isinstance(paid, int) and paid >= expected
        )
        if not valid:
            return Response({'detail': 'Payment verification failed.'}, status=status.HTTP_402_PAYMENT_REQUIRED)

        finalize_paid_week(week.pk, data)
        subscription = Subscription.objects.select_related(
            'plan', 'delivery_zone', 'business_profile'
        ).prefetch_related('items__product', 'weeks').get(pk=week.subscription_id)
        return Response(SubscriptionSerializer(subscription, context={'request': request}).data)
