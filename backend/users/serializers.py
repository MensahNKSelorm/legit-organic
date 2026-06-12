import re
from rest_framework import serializers
from .models import User, WishlistItem, B2BProfile, B2BDiscountTier
from products.serializers import ProductSerializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'street_address', 'house_number', 'city', 'delivery_region',
            'avatar', 'created_at', 'email_verified',
        ]
        read_only_fields = ['id', 'created_at', 'email_verified']

    def validate_phone_number(self, value):
        if not value:
            return value
        pattern = r'^(\+233|0)[0-9]{9}$'
        if not re.match(pattern, value.replace(' ', '')):
            raise serializers.ValidationError(
                'Enter a valid Ghana phone number e.g. +233244123456 or 0244123456'
            )
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password_confirm']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        return User.objects.create_user(**validated_data)


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = WishlistItem
        fields = ['id', 'product', 'product_id', 'created_at']

    def create(self, validated_data):
        user = self.context['request'].user
        product_id = validated_data['product_id']
        item, _ = WishlistItem.objects.get_or_create(
            user=user,
            product_id=product_id,
        )
        return item


class B2BDiscountTierSerializer(serializers.ModelSerializer):
    class Meta:
        model = B2BDiscountTier
        fields = [
            'id', 'name', 'min_order_amount', 'max_order_amount',
            'discount_percent', 'description',
        ]


class B2BProfileSerializer(serializers.ModelSerializer):
    tier = B2BDiscountTierSerializer(read_only=True)
    business_type_display = serializers.CharField(
        source='get_business_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )

    class Meta:
        model = B2BProfile
        fields = [
            'id', 'company_name', 'business_type', 'business_type_display',
            'contact_person', 'business_phone', 'business_email',
            'business_address', 'business_registration',
            'estimated_monthly_order', 'status', 'status_display',
            'tier', 'rejection_reason', 'approved_at', 'created_at',
        ]
        read_only_fields = [
            'id', 'status', 'status_display', 'tier', 'rejection_reason',
            'approved_at', 'created_at',
        ]
