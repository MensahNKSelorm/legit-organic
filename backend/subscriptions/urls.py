from django.urls import path

from .views import (
    BusinessSupplyActionView, BusinessSupplyDetailView,
    BusinessSupplyListCreateView, BusinessSupplyPaymentInitializeView,
    BusinessSupplyPaymentVerifyView, BusinessSupplyRevisionCreateView,
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
    path('business/supply/', BusinessSupplyListCreateView.as_view(), name='business-supply-list-create'),
    path('business/supply/payment/verify/', BusinessSupplyPaymentVerifyView.as_view(), name='business-supply-payment-verify'),
    path('business/supply/cycles/<int:cycle_pk>/payment/', BusinessSupplyPaymentInitializeView.as_view(), name='business-supply-payment'),
    path('business/supply/<int:pk>/', BusinessSupplyDetailView.as_view(), name='business-supply-detail'),
    path('business/supply/<int:pk>/revisions/', BusinessSupplyRevisionCreateView.as_view(), name='business-supply-revision'),
    path('business/supply/<int:pk>/<str:action>/', BusinessSupplyActionView.as_view(), name='business-supply-action'),
    path('payment/verify/', SubscriptionPaymentVerifyView.as_view(), name='subscription-payment-verify'),
    path('<int:pk>/payment/', SubscriptionPaymentInitializeView.as_view(), name='subscription-payment'),
    path('<int:pk>/', SubscriptionDetailView.as_view(), name='subscription-detail'),
    path('<int:pk>/<str:action>/', SubscriptionActionView.as_view(), name='subscription-action'),
]
