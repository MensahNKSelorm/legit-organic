from rest_framework import generics
from .models import Badge, Category, Product, Region
from .serializers import BadgeSerializer, CategorySerializer, ProductSerializer, RegionSerializer


class CategoryListView(generics.ListAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = []


class RegionListView(generics.ListAPIView):
    queryset = Region.objects.filter(is_active=True)
    serializer_class = RegionSerializer
    permission_classes = []


class BadgeListView(generics.ListAPIView):
    queryset = Badge.objects.filter(is_active=True)
    serializer_class = BadgeSerializer
    permission_classes = []


class ProductListView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = []

    def get_queryset(self):
        qs = Product.objects.filter(is_available=True).select_related('category', 'region', 'badge')
        featured = self.request.query_params.get('featured')
        category = self.request.query_params.get('category')
        if featured:
            qs = qs.filter(is_featured=True)
        if category:
            qs = qs.filter(category__slug=category)
        return qs


class ProductDetailView(generics.RetrieveAPIView):
    queryset = Product.objects.filter(is_available=True).select_related('category', 'region', 'badge')
    serializer_class = ProductSerializer
    permission_classes = []
    lookup_field = 'slug'


class FeaturedProductsView(generics.ListAPIView):
    queryset = Product.objects.filter(is_featured=True, is_available=True).select_related('category', 'region', 'badge')
    serializer_class = ProductSerializer
    permission_classes = []
