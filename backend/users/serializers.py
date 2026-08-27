import json
import logging
import re
from django.db import transaction
from rest_framework import serializers

logger = logging.getLogger(__name__)
from .models import (
    B2BProfile, BusinessPrice, BusinessPriceList, User, WishlistItem,
)
from products.serializers import ProductSerializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone_number',
            'street_address', 'house_number', 'city', 'delivery_region',
            'avatar', 'created_at', 'email_verified', 'is_staff',
        ]
        read_only_fields = ['id', 'created_at', 'email_verified', 'is_staff']

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


class BusinessPriceSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = BusinessPrice
        fields = [
            'id', 'product', 'unit_price', 'minimum_quantity', 'is_available',
        ]


class BusinessPriceListSerializer(serializers.ModelSerializer):
    prices = serializers.SerializerMethodField()

    class Meta:
        model = BusinessPriceList
        fields = ['id', 'name', 'description', 'prices']

    def get_prices(self, obj):
        rows = obj.prices.filter(
            is_available=True,
            product__is_available=True,
        ).exclude(product__business_supply_category='').select_related('product')
        return BusinessPriceSerializer(rows, many=True, context=self.context).data


class B2BProfileSerializer(serializers.ModelSerializer):
    verification_document = serializers.FileField(write_only=True, required=False)
    price_list = BusinessPriceListSerializer(read_only=True)
    business_type_display = serializers.CharField(
        source='get_business_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )
    registration_status_display = serializers.CharField(
        source='get_registration_status_display', read_only=True
    )

    class Meta:
        model = B2BProfile
        fields = [
            'id', 'company_name', 'registration_status', 'registration_status_display',
            'business_type', 'business_type_display',
            'contact_person', 'business_phone', 'business_email',
            'business_address', 'business_registration',
            'trading_name', 'legal_structure', 'sector', 'year_started', 'website',
            'organization_tin', 'verification_document_type',
            'verification_document', 'registration_exemption_reason',
            'contact_job_title', 'alternative_phone',
            'delivery_region', 'delivery_city', 'delivery_district',
            'delivery_locality', 'delivery_street', 'ghana_post_gps',
            'delivery_landmark', 'delivery_directions',
            'receiving_contact_name', 'receiving_contact_phone',
            'receiving_hours', 'access_restrictions', 'produce_categories',
            'order_frequency', 'preferred_start_date', 'purchase_order_required',
            'invoice_requirements', 'procurement_notes', 'applicant_authorized',
            'information_confirmed', 'privacy_acknowledged',
            'estimated_monthly_order', 'status', 'status_display',
            'price_list', 'rejection_reason', 'approved_at', 'created_at',
        ]
        read_only_fields = [
            'id', 'business_address', 'status', 'status_display', 'price_list',
            'rejection_reason', 'approved_at', 'created_at',
        ]

    def validate_verification_document(self, value):
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError('The document must be 5 MB or smaller.')
        header = value.read(8)
        value.seek(0)
        valid = (
            header.startswith(b'%PDF-') or
            header.startswith(b'\xff\xd8\xff') or
            header.startswith(b'\x89PNG\r\n\x1a\n')
        )
        if not valid:
            raise serializers.ValidationError('Upload a PDF, JPG or PNG document.')
        return value

    def validate_produce_categories(self, value):
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except json.JSONDecodeError as exc:
                raise serializers.ValidationError('Select valid produce categories.') from exc
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise serializers.ValidationError('Select valid produce categories.')
        cleaned = list(dict.fromkeys(item.strip() for item in value if item.strip()))
        if not cleaned:
            raise serializers.ValidationError('Select tomatoes, onions, or both.')
        allowed = {'Tomatoes', 'Onions'}
        unsupported = [item for item in cleaned if item not in allowed]
        if unsupported:
            raise serializers.ValidationError('Business supply is currently limited to tomatoes and onions.')
        return cleaned

    def validate(self, attrs):
        registered = {'business_name', 'partnership', 'limited_shares', 'limited_guarantee'}
        exempt = {'public_institution', 'cooperative', 'foreign_mission', 'other'}
        structure = attrs.get('legal_structure', '')
        registration_status = attrs.get('registration_status', 'registered')

        required = {
            'company_name': 'Enter the business or organisation name.',
            'contact_person': 'Enter the authorised contact name.',
            'business_phone': 'Enter a primary business phone.',
            'business_email': 'Enter a work email address.',
            'delivery_region': 'Select the delivery region.',
            'delivery_city': 'Enter the city or town.',
            'delivery_locality': 'Enter the locality or neighbourhood.',
            'receiving_contact_name': 'Enter the receiving contact.',
            'receiving_contact_phone': 'Enter the receiving contact phone.',
            'receiving_hours': 'Enter the normal receiving hours.',
            'order_frequency': 'Select an expected ordering frequency.',
        }
        errors = {field: message for field, message in required.items() if not attrs.get(field)}
        if not attrs.get('produce_categories'):
            errors['produce_categories'] = 'Select tomatoes, onions, or both.'
        if not attrs.get('ghana_post_gps') and not (
            attrs.get('delivery_landmark') and attrs.get('delivery_directions')
        ):
            errors['ghana_post_gps'] = 'Add a GhanaPost GPS address, or provide both a landmark and directions.'
        if attrs.get('ghana_post_gps') and not re.fullmatch(
            r'[A-Za-z]{2}-\d{3,4}-\d{4}', attrs['ghana_post_gps'].strip()
        ):
            errors['ghana_post_gps'] = 'Use a GhanaPost GPS format such as GA-123-4567.'

        if registration_status == 'informal':
            attrs['legal_structure'] = 'informal_operator'
            if not attrs.get('registration_exemption_reason'):
                errors['registration_exemption_reason'] = 'Describe where and how the business operates.'
            if attrs.get('verification_document_type') not in {
                'ghana_card', 'drivers_licence', 'passport',
                'trade_association_letter', 'operating_site_evidence'
            }:
                errors['verification_document_type'] = 'Choose the evidence you are providing.'
        elif not attrs.get('organization_tin'):
            errors['organization_tin'] = 'Enter the organisation TIN.'
        if registration_status == 'registered' and not attrs.get('contact_job_title'):
            errors['contact_job_title'] = 'Enter the contact person’s role.'

        if registration_status == 'registered' and structure in registered:
            if not attrs.get('business_registration'):
                errors['business_registration'] = 'Enter the ORC registration number.'
            if attrs.get('verification_document_type') != 'orc_certificate':
                errors['verification_document_type'] = 'Select the ORC certificate option.'
        elif registration_status == 'registered' and structure in exempt:
            if not attrs.get('registration_exemption_reason'):
                errors['registration_exemption_reason'] = 'Explain the organisation’s registration basis.'
            if attrs.get('verification_document_type') != 'introductory_letter':
                errors['verification_document_type'] = 'Select the official letter option.'
        elif registration_status == 'registered':
            errors['legal_structure'] = 'Select a recognised legal structure.'

        if not self.instance and not attrs.get('verification_document'):
            errors['verification_document'] = 'Upload the supporting document.'
        for field, message in (
            ('applicant_authorized', 'Confirm that you are authorised to apply.'),
            ('information_confirmed', 'Confirm that the information is accurate.'),
            ('privacy_acknowledged', 'Confirm that you have read the privacy notice.'),
        ):
            if attrs.get(field) is not True:
                errors[field] = message
        if errors:
            raise serializers.ValidationError(errors)

        attrs['business_address'] = ', '.join(filter(None, [
            attrs.get('delivery_street'), attrs.get('delivery_locality'),
            attrs.get('delivery_city'), attrs.get('delivery_region'),
            attrs.get('ghana_post_gps'),
        ]))
        return attrs
