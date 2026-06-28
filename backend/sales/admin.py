from django.contrib import admin
from .models import SalesRep, ReferredCustomer, Commission


@admin.register(SalesRep)
class SalesRepAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'referral_code', 'status',
        'commission_rate_registration',
        'commission_rate_first_purchase',
        'commission_rate_repeat_purchase',
        'created_at'
    ]
    list_filter = ['status']
    search_fields = ['user__email', 'referral_code', 'phone']
    readonly_fields = ['referral_code', 'created_at']


@admin.register(ReferredCustomer)
class ReferredCustomerAdmin(admin.ModelAdmin):
    list_display = [
        'customer', 'sales_rep', 'source', 'status',
        'commission_expires_at', 'created_at'
    ]
    list_filter = ['source', 'status']
    search_fields = ['customer__email', 'sales_rep__user__email']
    readonly_fields = ['commission_expires_at', 'created_at']


@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = [
        'sales_rep', 'referred_customer', 'type', 'amount',
        'status', 'created_at'
    ]
    list_filter = ['type', 'status']
    search_fields = ['sales_rep__user__email', 'referred_customer__customer__email']
    readonly_fields = ['created_at']
    actions = ['mark_approved', 'mark_paid']

    def mark_approved(self, request, queryset):
        queryset.update(status='approved')
    mark_approved.short_description = 'Mark selected as approved'

    def mark_paid(self, request, queryset):
        queryset.update(status='paid')
    mark_paid.short_description = 'Mark selected as paid'
