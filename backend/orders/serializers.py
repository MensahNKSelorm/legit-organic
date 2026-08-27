import re
import uuid
from decimal import Decimal
from django.db import transaction
from django.db.models import F
from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from .promo_models import PromoCode
from products.models import Product


class CartProductSerializer(serializers.ModelSerializer):
    category = serializers.SerializerMethodField()
    region = serializers.SerializerMethodField()
    badge = serializers.SerializerMethodField()
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'unit', 'image',
            'category', 'region', 'badge', 'is_featured', 'is_available',
            'created_at', 'updated_at',
        ]

    def get_image(self, obj):
        request = self.context.get('request')
        first_gallery = obj.images.order_by('order', 'created_at').first()
        if first_gallery and first_gallery.image:
            if request:
                return request.build_absolute_uri(first_gallery.image.url)
            return first_gallery.image.url
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

    def get_category(self, obj):
        if not obj.category_id:
            return None
        return {
            'id': obj.category.id,
            'name': obj.category.name,
            'slug': obj.category.slug,
            'description': getattr(obj.category, 'description', ''),
            'image': None,
        }

    def get_region(self, obj):
        return None

    def get_badge(self, obj):
        return None


class CartItemSerializer(serializers.ModelSerializer):
    product = CartProductSerializer(read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class MinimalProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'image', 'price', 'unit']

    def get_image(self, obj):
        request = self.context.get('request')
        first_gallery = obj.images.order_by('order', 'created_at').first()
        if first_gallery and first_gallery.image:
            if request:
                return request.build_absolute_uri(first_gallery.image.url)
            return first_gallery.image.url
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    product = MinimalProductSerializer(read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'unit_price', 'subtotal']

    def get_subtotal(self, obj):
        return str(obj.unit_price * obj.quantity)


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    promo_code = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'reference', 'status', 'payment_status', 'order_source',
            'total_amount', 'discount_amount', 'promo_code', 'delivery_address',
            'guest_name', 'guest_phone',
            'items', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'reference', 'created_at', 'updated_at']

    def get_promo_code(self, obj):
        return obj.promo_code.code if obj.promo_code_id else None


class CreateOrderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CreateOrderSerializer(serializers.Serializer):
    items = CreateOrderItemSerializer(many=True)
    delivery_address = serializers.CharField(required=False, allow_blank=True, default='')
    promo_code = serializers.CharField(required=False, allow_blank=True, default='')
    guest_name = serializers.CharField(required=False, allow_blank=True, default='')
    guest_phone = serializers.CharField(required=False, allow_blank=True, default='')
    guest_email = serializers.CharField(required=False, allow_blank=True, default='')
    order_source = serializers.ChoiceField(
        choices=('seevcash', 'whatsapp'), required=False, default='whatsapp',
    )
    phone_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
    house_number = serializers.CharField(required=False, allow_blank=True, write_only=True)
    street_address = serializers.CharField(required=False, allow_blank=True, write_only=True)
    city = serializers.CharField(required=False, allow_blank=True, write_only=True)
    delivery_region = serializers.CharField(required=False, allow_blank=True, write_only=True)

    def validate(self, attrs):
        request = self.context['request']
        if request.user.is_authenticated:
            user = request.user
            phone = (attrs.get('phone_number') or user.phone_number or '').replace(' ', '')
            street = (attrs.get('street_address') or user.street_address or '').strip()
            city = (attrs.get('city') or user.city or '').strip()
            region = (attrs.get('delivery_region') or user.delivery_region or '').strip()
            house = (attrs.get('house_number') or user.house_number or '').strip()
        else:
            phone = (attrs.get('phone_number') or attrs.get('guest_phone') or '').replace(' ', '')
            street = (attrs.get('street_address') or '').strip()
            city = (attrs.get('city') or '').strip()
            region = (attrs.get('delivery_region') or '').strip()
            house = (attrs.get('house_number') or '').strip()
            if not (attrs.get('guest_name') or '').strip():
                raise serializers.ValidationError({'guest_name': 'Customer name is required.'})

        if not phone:
            raise serializers.ValidationError({'guest_phone': 'A phone number is required.'})
        if not re.fullmatch(r'(?:\+233|0)[0-9]{9}', phone):
            raise serializers.ValidationError({
                'guest_phone': 'Enter a valid Ghana phone number, for example 0244123456.'
            })
        missing = [
            label for label, value in (
                ('street_address', street), ('city', city), ('delivery_region', region)
            ) if not value
        ]
        if missing:
            raise serializers.ValidationError({
                field: 'This delivery field is required.' for field in missing
            })

        attrs['phone_number'] = phone
        attrs['house_number'] = house
        attrs['street_address'] = street
        attrs['city'] = city
        attrs['delivery_region'] = region
        attrs['delivery_address'] = ', '.join(p for p in (house, street, city, region) if p)
        if not request.user.is_authenticated:
            attrs['guest_phone'] = phone
        return attrs

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Order must contain at least one item.")
        return items

    def create(self, validated_data):
        request = self.context['request']
        is_auth = request.user.is_authenticated
        items_data = validated_data['items']
        delivery_address = validated_data.get('delivery_address', '')
        promo_code_str = validated_data.get('promo_code', '').strip().upper()
        guest_name = validated_data.get('guest_name', '')
        guest_phone = validated_data.get('guest_phone', '')
        guest_email = validated_data.get('guest_email', '')
        order_source = validated_data.get('order_source', 'whatsapp')
        phone_number = validated_data.pop('phone_number', '')
        house_number = validated_data.pop('house_number', '')
        street_address = validated_data.pop('street_address', '')
        city = validated_data.pop('city', '')
        delivery_region = validated_data.pop('delivery_region', '')

        if is_auth:
            user = request.user
            guest_name = f'{user.first_name} {user.last_name}'.strip() or user.email
            guest_email = user.email
            guest_phone = phone_number

        order_status = 'whatsapp_pending' if order_source == 'whatsapp' else 'pending'

        # Validate every product BEFORE writing anything, and do the whole build
        # in one transaction so a failure can never leave an orphaned Order or a
        # partial set of OrderItems behind.
        with transaction.atomic():
            if is_auth:
                user.phone_number = phone_number
                user.house_number = house_number
                user.street_address = street_address
                user.city = city
                user.delivery_region = delivery_region
                user.save(update_fields=[
                    'phone_number', 'house_number', 'street_address',
                    'city', 'delivery_region',
                ])
            product_ids = [item['product_id'] for item in items_data]
            products = {
                p.id: p for p in Product.objects.filter(
                    id__in=product_ids, is_available=True,
                )
            }
            missing = [pid for pid in product_ids if pid not in products]
            if missing:
                raise serializers.ValidationError(
                    {'items': f'Invalid or unavailable product id(s): {missing}'}
                )

            reference = f"LO-{uuid.uuid4().hex[:12].upper()}"
            order = Order.objects.create(
                user=request.user if is_auth else None,
                reference=reference,
                delivery_address=delivery_address,
                status=order_status,
                payment_status='pending',
                total_amount=0,
                discount_amount=0,
                guest_name=guest_name,
                guest_phone=guest_phone,
                guest_email=guest_email,
                order_source=order_source,
            )

            total = Decimal('0')
            for item_data in items_data:
                product = products[item_data['product_id']]
                quantity = item_data['quantity']
                unit_price = product.price
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=quantity,
                    unit_price=unit_price,
                )
                total += unit_price * quantity

            order.total_amount = total
            update_fields = ['total_amount', 'discount_amount']

            if promo_code_str:
                try:
                    promo = PromoCode.objects.get(code=promo_code_str)
                    is_valid, _ = promo.is_valid(float(total))
                    if is_valid:
                        discount = Decimal(str(promo.calculate_discount(float(total))))
                        order.promo_code = promo
                        order.discount_amount = discount
                        # Concurrency-safe increment (avoids a read-modify-write race).
                        PromoCode.objects.filter(pk=promo.pk).update(
                            times_used=F('times_used') + 1
                        )
                        update_fields.append('promo_code')
                except PromoCode.DoesNotExist:
                    pass

            order.save(update_fields=update_fields)

            if order_source == 'whatsapp' and not order.is_test:
                order_id = order.pk
                transaction.on_commit(
                    lambda: _send_whatsapp_order_report(order_id)
                )

        return order


def _send_whatsapp_order_report(order_id):
    from .reporting import send_owner_report_once
    send_owner_report_once(order_id, 'whatsapp_submitted')
