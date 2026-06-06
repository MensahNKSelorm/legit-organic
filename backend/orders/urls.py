from django.urls import path
from .views import (
    CartView, CartItemViewSet,
    CreateOrderView, VerifyPaymentView,
    UserOrderListView, OrderDetailView,
)

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/items/', CartItemViewSet.as_view(), name='cart-items'),
    path('create/', CreateOrderView.as_view(), name='order-create'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('my-orders/', UserOrderListView.as_view(), name='my-orders'),
    path('<str:reference>/', OrderDetailView.as_view(), name='order-detail'),
]
