from django.urls import path
from .views import (
    CartView, CartItemViewSet, CartClearView,
    CreateOrderView, VerifyPaymentView, ValidatePromoView,
    UserOrderListView, OrderDetailView, ExportOrdersView,
    OrderReceiptView,
)

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/items/', CartItemViewSet.as_view(), name='cart-items'),
    path('cart/clear/', CartClearView.as_view(), name='cart-clear'),
    path('create/', CreateOrderView.as_view(), name='order-create'),
    path('verify-payment/', VerifyPaymentView.as_view(), name='verify-payment'),
    path('validate-promo/', ValidatePromoView.as_view(), name='validate-promo'),
    path('my-orders/', UserOrderListView.as_view(), name='my-orders'),
    path('export/', ExportOrdersView.as_view(), name='export-orders'),
    path('<str:reference>/receipt/', OrderReceiptView.as_view(), name='order-receipt'),
    path('<str:reference>/', OrderDetailView.as_view(), name='order-detail'),
]
