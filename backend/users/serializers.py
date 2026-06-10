import re
from rest_framework import serializers
from .models import User, WishlistItem
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
