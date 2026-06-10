from rest_framework import generics
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
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


class ProductSearchView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        from django.db.models import Q, Case, When, IntegerField
        query = self.request.query_params.get('q', '').strip()
        if not query:
            return Product.objects.none()

        return Product.objects.filter(
            is_available=True
        ).filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query) |
            Q(region__name__icontains=query) |
            Q(badge__name__icontains=query)
        ).select_related('category', 'region', 'badge').annotate(
            relevance=Case(
                When(name__iexact=query, then=3),
                When(name__istartswith=query, then=2),
                When(name__icontains=query, then=1),
                default=0,
                output_field=IntegerField(),
            )
        ).order_by('-relevance', 'name').distinct()

    def list(self, request, *args, **kwargs):
        query = request.query_params.get('q', '').strip()
        queryset = self.get_queryset()
        results = self.get_serializer(queryset, many=True).data

        related = []
        if len(results) < 3 and query:
            related_qs = Product.objects.filter(
                is_available=True
            ).exclude(
                id__in=[p['id'] for p in results]
            ).select_related('category', 'region', 'badge').order_by('?')[:6]
            related = self.get_serializer(related_qs, many=True).data

        return Response({
            'query': query,
            'results': results,
            'related': related,
            'has_results': len(results) > 0,
        })
