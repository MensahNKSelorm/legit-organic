import uuid
from decimal import Decimal
from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
from .promo_models import PromoCode
from products.models import Product


class CartItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.price', max_digits=10,
                                             decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_name', 'product_price', 'quantity']


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ['id', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class MinimalProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'image', 'price', 'unit']


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
    order_source = serializers.CharField(required=False, default='whatsapp')

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

        if is_auth and not delivery_address:
            user = request.user
            parts = [
                getattr(user, 'house_number', ''),
                getattr(user, 'street_address', ''),
                getattr(user, 'city', ''),
                getattr(user, 'delivery_region', ''),
            ]
            delivery_address = ', '.join(p for p in parts if p)

        order_status = 'whatsapp_pending' if order_source == 'whatsapp' else 'pending'
        reference = f"LO-{uuid.uuid4().hex[:12].upper()}"
        total = Decimal('0')

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

        for item_data in items_data:
            product = Product.objects.get(pk=item_data['product_id'])
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
                    promo.times_used += 1
                    promo.save(update_fields=['times_used'])
                    update_fields.append('promo_code')
            except PromoCode.DoesNotExist:
                pass

        order.save(update_fields=update_fields)
        return order
