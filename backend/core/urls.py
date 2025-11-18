from django.urls import path, include
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, RegisterView, CartItemViewSet, WatchlistItemViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'cart', CartItemViewSet, basename='cart')
router.register(r'watchlist', WatchlistItemViewSet, basename='watchlist')

def health(request):
    return JsonResponse({'status': 'ok', 'service': 'legitorganic-api'})

urlpatterns = [
    path('health/', health, name='health'),
    path('', include(router.urls)),
    path('register/', RegisterView.as_view(), name='register'),
]