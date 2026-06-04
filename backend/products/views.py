from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAdminUser
from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = []


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return []
        return [IsAdminUser()]

    def get_queryset(self):
        qs = Product.objects.all()
        featured = self.request.query_params.get('featured')
        category = self.request.query_params.get('category')
        if featured:
            qs = qs.filter(is_featured=True)
        if category:
            qs = qs.filter(category__slug=category)
        return qs
