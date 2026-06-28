from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import SalesRep, ReferredCustomer, Commission

User = get_user_model()


class SalesRepSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)

    class Meta:
        model = SalesRep
        fields = [
            'id', 'email', 'first_name', 'last_name', 'referral_code',
            'phone', 'status', 'commission_rate_registration',
            'commission_rate_first_purchase', 'commission_rate_repeat_purchase',
            'created_at',
        ]
        read_only_fields = ['referral_code', 'created_at']


class ReferredCustomerSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.EmailField(source='customer.email', read_only=True)
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = ReferredCustomer
        fields = [
            'id', 'customer_name', 'customer_email', 'source', 'status',
            'commission_expires_at', 'days_remaining', 'created_at',
        ]

    def get_customer_name(self, obj):
        return f'{obj.customer.first_name} {obj.customer.last_name}'.strip()

    def get_days_remaining(self, obj):
        from django.utils import timezone
        delta = obj.commission_expires_at - timezone.now()
        return max(delta.days, 0)


class CommissionSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    order_reference = serializers.CharField(
        source='order.reference', read_only=True, default=None
    )

    class Meta:
        model = Commission
        fields = [
            'id', 'customer_name', 'order_reference', 'type', 'amount',
            'status', 'created_at',
        ]

    def get_customer_name(self, obj):
        c = obj.referred_customer.customer
        return f'{c.first_name} {c.last_name}'.strip()


class AddCustomerSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    phone_number = serializers.CharField(max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_phone_number(self, value):
        if User.objects.filter(phone_number=value).exists():
            raise serializers.ValidationError(
                'A customer with this phone number already has an account.'
            )
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                'A customer with this email already has an account.'
            )
        return value
