from decimal import Decimal
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.db import transaction
from django.db.models import Q, Sum
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from users.models import User
from users.sms import send_sms
from .models import SalesRep, ReferredCustomer, Commission
from .serializers import (
    SalesRepSerializer, ReferredCustomerSerializer,
    CommissionSerializer, AddCustomerSerializer,
)


class ValidateReferralCodeView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get('code', '').strip().upper()
        if not code:
            return Response({'valid': False}, status=status.HTTP_400_BAD_REQUEST)
        rep = SalesRep.objects.filter(
            referral_code=code, status='active'
        ).first()
        if not rep:
            return Response({'valid': False})
        return Response({'valid': True})


def _get_rep_or_403(user):
    try:
        return user.sales_rep_profile
    except SalesRep.DoesNotExist:
        raise PermissionDenied('Not authorized as a sales rep.')


class SalesRepDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rep = _get_rep_or_403(request.user)
        return Response(SalesRepSerializer(rep).data)


class ReferredCustomerListView(generics.ListAPIView):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReferredCustomerSerializer

    def get_queryset(self):
        rep = _get_rep_or_403(self.request.user)
        return rep.referred_customers.select_related('customer').order_by('-created_at')


class CommissionListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        rep = _get_rep_or_403(request.user)

        commissions = rep.commissions.select_related(
            'referred_customer__customer', 'order'
        )
        agg = commissions.aggregate(
            pending=Sum('amount', filter=Q(status='pending')),
            approved=Sum('amount', filter=Q(status='approved')),
            paid=Sum('amount', filter=Q(status='paid')),
        )

        return Response({
            'commissions': CommissionSerializer(commissions, many=True).data,
            'summary': {
                'pending': str(agg['pending'] or Decimal('0.00')),
                'approved': str(agg['approved'] or Decimal('0.00')),
                'paid': str(agg['paid'] or Decimal('0.00')),
            },
        })


class AddCustomerView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        rep = _get_rep_or_403(request.user)

        if rep.status != 'active':
            return Response(
                {'error': 'Your sales rep account is suspended.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AddCustomerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        # The placeholder email is intentional and temporary. It satisfies the unique email
        # constraint when no real email is provided, allowing phone-only customers to exist
        # in the system. If the customer later self-registers on the normal signup flow and
        # supplies the same phone number, RegisterSerializer.create() detects this pattern
        # (email__startswith='noemail+', email__endswith='@rep.legitorganic.internal') and
        # updates the existing User in place — preserving all ReferredCustomer/Commission FK
        # links without any data migration. Phone-based login does not exist yet; these
        # accounts can only authenticate once they have a real email and have set a password.
        email = data.get('email') or f'noemail+{data["phone_number"]}@rep.legitorganic.internal'

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                first_name=data['first_name'],
                last_name=data['last_name'],
                phone_number=data['phone_number'],
                is_active=True,
                password=None,
            )

            referred = ReferredCustomer.objects.create(
                sales_rep=rep,
                customer=user,
                source='rep_form',
                status='registered',
            )

            Commission.objects.create(
                sales_rep=rep,
                referred_customer=referred,
                type='registration',
                amount=rep.commission_rate_registration,
                status='pending',
            )

        # Token generation reuses the same mechanism as B2B approval (users/admin.py).
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        setup_link = f'{settings.FRONTEND_URL}/sales/setup-password?uid={uid}&token={token}'

        try:
            send_sms(
                data['phone_number'],
                f'Legit Organic: {request.user.first_name} has added you as a customer. '
                f'Set up your account here: {setup_link}',
            )
        except Exception:
            pass

        return Response(
            ReferredCustomerSerializer(referred).data,
            status=status.HTTP_201_CREATED,
        )
