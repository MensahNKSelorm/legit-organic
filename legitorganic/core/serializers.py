from rest_framework import serializers
from .models import Farm, Certification, Product, BlogPost, ContactMessage


class CertificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certification
        fields = "__all__"

class FarmSerializer(serializers.ModelSerializer):
    organic_certifications = serializers.PrimaryKeyRelatedField(many=True, queryset=Certification.objects.all())

    class Meta:
        model = Farm
        fields = "__all__"

class ProductSerializer(serializers.ModelSerializer):
    farm = serializers.PrimaryKeyRelatedField(queryset=Farm.objects.all())
    farm_details = FarmSerializer(source='farm', read_only=True)

    class Meta:
        model = Product
        fields = "__all__"

class BlogPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogPost
        fields = "__all__"

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = "__all__"