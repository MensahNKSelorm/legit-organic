import uuid
from decimal import Decimal
from rest_framework import serializers
from .models import Cart, CartItem, Order, OrderItem
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
        fields = ['id', 'name', 'slug', 'price', 'unit']


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

    class Meta:
        model = Order
        fields = [
            'id', 'reference', 'status', 'payment_status', 'total_amount',
            'delivery_address', 'items', 'created_at',
        ]
        read_only_fields = ['id', 'reference', 'created_at']


class CreateOrderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CreateOrderSerializer(serializers.Serializer):
    items = CreateOrderItemSerializer(many=True)
    delivery_address = serializers.CharField()

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Order must contain at least one item.")
        return items

    def create(self, validated_data):
        user = self.context['request'].user
        items_data = validated_data['items']
        delivery_address = validated_data['delivery_address']

        reference = f"LO-{uuid.uuid4().hex[:12].upper()}"
        total = Decimal('0')

        order = Order.objects.create(
            user=user,
            reference=reference,
            delivery_address=delivery_address,
            status='pending',
            payment_status='pending',
            total_amount=0,
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
        order.save(update_fields=['total_amount'])
        return order
