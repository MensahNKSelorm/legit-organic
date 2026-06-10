from django.urls import path
from .views import (
    BadgeListView, CategoryListView, FeaturedProductsView,
    ProductDetailView, ProductListView, ProductSearchView, RegionListView,
)

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('regions/', RegionListView.as_view(), name='region-list'),
    path('badges/', BadgeListView.as_view(), name='badge-list'),
    path('featured/', FeaturedProductsView.as_view(), name='product-featured'),
    path('search/', ProductSearchView.as_view(), name='product-search'),
    path('<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
    path('', ProductListView.as_view(), name='product-list'),
]
