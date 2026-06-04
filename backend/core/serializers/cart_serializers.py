from rest_framework import serializers
from ..models import CartItem, WatchlistItem

class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = '__all__'
        read_only_fields = ['user', 'added_at']


class WatchlistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WatchlistItem
        fields = '__all__'
        read_only_fields = ['user', 'added_at']
