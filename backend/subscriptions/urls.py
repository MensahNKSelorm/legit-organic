from django.urls import path

from .views import (
    DeliveryZoneListView, SubscriptionActionView, SubscriptionDetailView,
    SubscriptionPaymentInitializeView, SubscriptionPaymentVerifyView,
    SubscriptionListCreateView, SubscriptionPlanListView,
    WholesaleQuoteListCreateView,
)


urlpatterns = [
    path('zones/', DeliveryZoneListView.as_view(), name='subscription-zones'),
    path('plans/', SubscriptionPlanListView.as_view(), name='subscription-plans'),
    path('', SubscriptionListCreateView.as_view(), name='subscription-list-create'),
    path('business/quotes/', WholesaleQuoteListCreateView.as_view(), name='wholesale-quotes'),
    path('payment/verify/', SubscriptionPaymentVerifyView.as_view(), name='subscription-payment-verify'),
    path('<int:pk>/payment/', SubscriptionPaymentInitializeView.as_view(), name='subscription-payment'),
    path('<int:pk>/', SubscriptionDetailView.as_view(), name='subscription-detail'),
    path('<int:pk>/<str:action>/', SubscriptionActionView.as_view(), name='subscription-action'),
]
