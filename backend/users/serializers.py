import logging
import re
from django.db import transaction
from rest_framework import serializers

logger = logging.getLogger(__name__)
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

    def update(self, instance, validated_data):
        # Mirror of RegisterSerializer.create()'s placeholder reconciliation, covering
        # the case where an already-authenticated user adds a phone_number via
        # PATCH /api/users/me/ rather than supplying it at signup time.
        # See RegisterSerializer.create() for the complementary new-signup direction.
        new_phone = validated_data.get('phone_number', '')
        if new_phone and new_phone != instance.phone_number:
            placeholder = User.objects.filter(
                phone_number=new_phone,
                email__startswith='noemail+',
                email__endswith='@rep.legitorganic.internal',
            ).exclude(pk=instance.pk).first()

            if placeholder is not None:
                with transaction.atomic():
                    # ReferredCustomer.customer is a OneToOneField (related_name='referral_record').
                    # Commission has no direct FK to User — it only links via ReferredCustomer —
                    # so re-pointing the single ReferredCustomer row is sufficient.
                    # The re-point must be saved BEFORE deleting placeholder; otherwise the
                    # CASCADE from User → ReferredCustomer → Commission wipes the records.
                    try:
                        referred = placeholder.referral_record
                        if not hasattr(instance, 'referral_record'):
                            referred.customer = instance
                            referred.save()
                            placeholder.delete()
                        # If instance already has its own referral_record, leave both intact
                        # rather than risk losing either set of commission data.
                    except Exception:
                        # placeholder has no referral_record (edge case); safe to remove directly.
                        placeholder.delete()

        return super().update(instance, validated_data)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
    referral_code = serializers.CharField(max_length=10, required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone_number', 'password', 'password_confirm', 'referral_code']

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        phone_number = validated_data.get('phone_number', '')
        referral_code = validated_data.pop('referral_code', '')

        user = None

        if phone_number:
            # If a placeholder account exists for this phone number (created by a sales rep
            # before the customer self-registered), update it in place so that the
            # ReferredCustomer and Commission FK links remain valid. See AddCustomerView in
            # sales/views.py for where placeholder accounts are created.
            try:
                existing = User.objects.get(
                    phone_number=phone_number,
                    email__startswith='noemail+',
                    email__endswith='@rep.legitorganic.internal',
                )
                existing.email = User.objects.normalize_email(validated_data['email'])
                existing.first_name = validated_data.get('first_name', existing.first_name)
                existing.last_name = validated_data.get('last_name', existing.last_name)
                existing.phone_number = phone_number
                existing.set_password(validated_data['password'])
                existing.save()
                user = existing
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                pass

        if user is None:
            user = User.objects.create_user(**validated_data)

        # Referral link attribution — runs after user is resolved (reconciled or newly created).
        # Guard against double-attribution: if the placeholder-reconciliation path already
        # attached a ReferredCustomer (source='rep_form'), we skip creating a second one.
        # A bad or expired referral_code silently does nothing — it must never block signup.
        if referral_code and not hasattr(user, 'referral_record'):
            try:
                from sales.models import SalesRep, ReferredCustomer
                rep = SalesRep.objects.filter(
                    referral_code=referral_code, status='active'
                ).first()
                if not rep:
                    pass  # typo'd, expired, or suspended code — silent skip, not an error
                else:
                    ReferredCustomer.objects.create(
                        sales_rep=rep,
                        customer=user,
                        source='referral_link',
                    )
            except Exception as e:
                logger.error(
                    f'Referral attribution failed for user {user.id} '
                    f'with referral_code={referral_code!r}: {e}',
                    exc_info=True,
                )

        return user


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
