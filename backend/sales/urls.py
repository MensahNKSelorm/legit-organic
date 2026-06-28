from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/', views.SalesRepDashboardView.as_view(), name='sales-dashboard'),
    path('customers/', views.ReferredCustomerListView.as_view(), name='sales-customers'),
    path('commissions/', views.CommissionListView.as_view(), name='sales-commissions'),
    path('customers/add/', views.AddCustomerView.as_view(), name='sales-add-customer'),
    path('validate-code/', views.ValidateReferralCodeView.as_view(), name='sales-validate-code'),
]
