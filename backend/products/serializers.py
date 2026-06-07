from rest_framework import serializers
from .models import Badge, Category, Product, Region


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'image']


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ['id', 'name', 'slug', 'country']


class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = ['id', 'name', 'slug', 'color']


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    region = RegionSerializer(read_only=True)
    badge = BadgeSerializer(read_only=True)

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'description', 'price', 'unit',
                  'region', 'category', 'image', 'badge',
                  'is_featured', 'is_available', 'created_at', 'updated_at',
                  'storage_tips', 'nutritional_info', 'nutritional_score']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']
