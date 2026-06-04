from django.urls import path
from .views import CategoryListView, FeaturedProductsView, ProductDetailView, ProductListView

urlpatterns = [
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('featured/', FeaturedProductsView.as_view(), name='product-featured'),
    path('<slug:slug>/', ProductDetailView.as_view(), name='product-detail'),
    path('', ProductListView.as_view(), name='product-list'),
]
