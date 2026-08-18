from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from products.models import Product
from users.models import BusinessPrice, B2BProfile

from .models import (
    DeliveryZone, Subscription, SubscriptionItem, SubscriptionPlan,
    SubscriptionPlanItem, SubscriptionWeek, WholesaleQuote, WholesaleQuoteItem,
)


class ProductSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'price', 'unit', 'image', 'is_available']


class DeliveryZoneSerializer(serializers.ModelSerializer):
    delivery_day = serializers.CharField(
        source='get_delivery_weekday_display', read_only=True
    )

    class Meta:
        model = DeliveryZone
        fields = [
            'id', 'name', 'slug', 'delivery_weekday', 'delivery_day',
            'cutoff_hours', 'delivery_fee',
        ]


class SubscriptionPlanItemSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer(read_only=True)

    class Meta:
        model = SubscriptionPlanItem
        fields = ['id', 'product', 'quantity', 'can_swap']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    items = SubscriptionPlanItemSerializer(many=True, read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id', 'name', 'slug', 'audience', 'plan_type', 'short_description',
            'weekly_price', 'household_size', 'image', 'is_featured', 'items',
        ]


class SubscriptionItemSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        source='product', queryset=Product.objects.filter(is_available=True),
        write_only=True,
    )
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SubscriptionItem
        fields = [
            'id', 'product', 'product_id', 'quantity', 'unit_price',
            'subtotal', 'can_substitute', 'display_order',
        ]
        read_only_fields = ['id', 'unit_price', 'subtotal']


class SubscriptionWeekSerializer(serializers.ModelSerializer):
    total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = SubscriptionWeek
        fields = [
            'id', 'delivery_date', 'cutoff_at', 'status', 'subtotal',
            'delivery_fee', 'total', 'payment_reference', 'paid_at', 'customer_note',
            'order',
        ]


def next_delivery_for(zone):
    today = timezone.localdate()
    days_ahead = (zone.delivery_weekday - today.weekday()) % 7
    delivery = today + timedelta(days=days_ahead)
    cutoff = timezone.make_aware(
        datetime.combine(delivery, time.min)
    ) - timedelta(hours=zone.cutoff_hours)
    if cutoff <= timezone.now():
        delivery += timedelta(days=7)
        cutoff += timedelta(days=7)
    return delivery, cutoff


class SubscriptionSerializer(serializers.ModelSerializer):
    items = SubscriptionItemSerializer(many=True)
    plan_detail = SubscriptionPlanSerializer(source='plan', read_only=True)
    delivery_zone_detail = DeliveryZoneSerializer(source='delivery_zone', read_only=True)
    weeks = SubscriptionWeekSerializer(many=True, read_only=True)
    weekly_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'name', 'audience', 'status', 'plan', 'plan_detail',
            'delivery_zone', 'delivery_zone_detail', 'delivery_address',
            'contact_phone', 'payment_method', 'weekly_subtotal',
            'weekly_delivery_fee', 'weekly_total', 'next_delivery_date',
            'card_brand', 'card_last4', 'items', 'weeks', 'created_at',
        ]
        read_only_fields = [
            'id', 'status', 'weekly_subtotal', 'weekly_delivery_fee',
            'next_delivery_date', 'card_brand', 'card_last4', 'created_at',
        ]

    def validate(self, attrs):
        user = self.context['request'].user
        audience = attrs.get('audience', 'household')
        plan = attrs.get('plan')
        if plan and plan.audience != audience:
            raise serializers.ValidationError({'plan': 'Choose a plan for this account type.'})
        if audience == 'business':
            try:
                profile = user.b2b_profile
            except B2BProfile.DoesNotExist:
                profile = None
            if profile is None or profile.status != 'approved':
                raise serializers.ValidationError(
                    {'audience': 'An approved business account is required.'}
                )
        items = attrs.get('items') or []
        if not plan and not items:
            raise serializers.ValidationError({'items': 'Choose at least one product.'})
        product_ids = [item['product'].pk for item in items]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError({'items': 'Choose each product once.'})
        if plan and plan.plan_type == 'curated' and not plan.items.exists():
            raise serializers.ValidationError({'plan': 'This plan is not ready yet.'})
        return attrs

    def _unit_price(self, product, quantity, audience, profile):
        if audience == 'business' and profile and profile.price_list_id:
            business_price = BusinessPrice.objects.filter(
                price_list=profile.price_list, product=product, is_available=True,
                minimum_quantity__lte=quantity,
            ).first()
            if business_price:
                return business_price.unit_price
        return product.price

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        supplied_items = validated_data.pop('items', [])
        plan = validated_data.get('plan')
        audience = validated_data.get('audience', 'household')
        if audience == 'business':
            try:
                profile = request.user.b2b_profile
            except B2BProfile.DoesNotExist:
                profile = None
        else:
            profile = None
        zone = validated_data['delivery_zone']
        delivery_date, cutoff = next_delivery_for(zone)

        subscription = Subscription.objects.create(
            user=request.user,
            business_profile=profile,
            status='draft',
            weekly_delivery_fee=zone.delivery_fee,
            next_delivery_date=delivery_date,
            **validated_data,
        )
        item_rows = []
        source_items = supplied_items
        if plan and plan.plan_type == 'curated':
            source_items = [
                {
                    'product': item.product,
                    'quantity': item.quantity,
                    'can_substitute': item.can_swap,
                    'display_order': item.display_order,
                }
                for item in plan.items.select_related('product')
            ]
        subtotal = Decimal('0.00')
        for index, item in enumerate(source_items):
            product = item['product']
            quantity = item['quantity']
            unit_price = self._unit_price(product, quantity, audience, profile)
            row = SubscriptionItem(
                subscription=subscription, product=product, quantity=quantity,
                unit_price=unit_price,
                can_substitute=item.get('can_substitute', True),
                display_order=item.get('display_order', index),
            )
            item_rows.append(row)
            subtotal += unit_price * quantity
        SubscriptionItem.objects.bulk_create(item_rows)
        if plan and plan.plan_type == 'curated':
            subtotal = plan.weekly_price
        subscription.weekly_subtotal = subtotal
        subscription.save(update_fields=['weekly_subtotal', 'updated_at'])
        week = SubscriptionWeek.objects.create(
            subscription=subscription, delivery_date=delivery_date,
            cutoff_at=cutoff, status='renewal_order', subtotal=subtotal,
            delivery_fee=zone.delivery_fee,
        )
        from .services import ensure_renewal_order
        ensure_renewal_order(week.pk)
        return subscription


class WholesaleQuoteItemSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        source='product', queryset=Product.objects.filter(is_available=True),
        write_only=True,
    )

    class Meta:
        model = WholesaleQuoteItem
        fields = [
            'id', 'product', 'product_id', 'quantity', 'requested_unit',
            'quoted_unit_price', 'note',
        ]
        read_only_fields = ['id', 'quoted_unit_price']


class WholesaleQuoteSerializer(serializers.ModelSerializer):
    items = WholesaleQuoteItemSerializer(many=True)

    class Meta:
        model = WholesaleQuote
        fields = [
            'id', 'status', 'requested_delivery_date', 'is_recurring',
            'customer_note', 'quoted_subtotal', 'valid_until', 'items',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'quoted_subtotal', 'valid_until',
            'created_at', 'updated_at',
        ]

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop('items')
        profile = self.context['request'].user.b2b_profile
        quote = WholesaleQuote.objects.create(
            business=profile, status='submitted', **validated_data
        )
        WholesaleQuoteItem.objects.bulk_create([
            WholesaleQuoteItem(quote=quote, **item) for item in items
        ])
        return quote
