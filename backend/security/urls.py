from django.urls import path

from .views import (
    anonymize_customer, exceptional_delete,
    security_reset_staff, security_setup, security_verify,
)

app_name = 'staff-security'

urlpatterns = [
    path('setup/', security_setup, name='setup'),
    path('verify/', security_verify, name='verify'),
    path('reset/<int:user_id>/', security_reset_staff, name='reset-staff'),
    path(
        'delete/<str:app_label>/<str:model_name>/<int:object_id>/',
        exceptional_delete,
        name='exceptional-delete',
    ),
    path(
        'anonymize/customer/<int:user_id>/',
        anonymize_customer,
        name='anonymize-customer',
    ),
]
