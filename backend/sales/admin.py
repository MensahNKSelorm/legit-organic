from django.contrib import admin
from django.db.models import Sum
from django.urls import reverse
from django.utils.html import format_html
from .models import SalesRep, ReferredCustomer, Commission, SalesRepPerformance


@admin.register(SalesRep)
class SalesRepAdmin(admin.ModelAdmin):
    list_display = [
        'user', 'referral_code', 'phone', 'status',
        'total_customers', 'converted_customers',
        'total_pending_commission', 'created_at',
    ]
    list_filter = ['status']
    search_fields = ['user__email', 'referral_code', 'phone']
    readonly_fields = ['referral_code', 'created_at']
    actions = ['suspend_reps', 'activate_reps']

    def total_customers(self, obj):
        return obj.referred_customers.count()
    total_customers.short_description = 'Customers'

    def converted_customers(self, obj):
        return obj.referred_customers.filter(status='converted').count()
    converted_customers.short_description = 'Converted'

    def total_pending_commission(self, obj):
        total = obj.commissions.filter(status='pending').aggregate(total=Sum('amount'))['total']
        return f'GHS {total:.2f}' if total else 'GHS 0.00'
    total_pending_commission.short_description = 'Pending (GHS)'

    def suspend_reps(self, request, queryset):
        queryset.update(status='suspended')
        self.message_user(request, f'{queryset.count()} rep(s) suspended.')
    suspend_reps.short_description = 'Suspend selected reps'

    def activate_reps(self, request, queryset):
        queryset.update(status='active')
        self.message_user(request, f'{queryset.count()} rep(s) activated.')
    activate_reps.short_description = 'Activate selected reps'


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
        'sales_rep', 'customer_name', 'type', 'amount',
        'status', 'order_link', 'created_at',
    ]
    list_filter = ['status', 'type', 'sales_rep', 'created_at']
    search_fields = ['sales_rep__user__email', 'referred_customer__customer__email']
    readonly_fields = ['created_at']
    actions = ['mark_approved', 'mark_paid']

    def customer_name(self, obj):
        c = obj.referred_customer.customer
        return f'{c.first_name} {c.last_name}'.strip() or c.email
    customer_name.short_description = 'Customer'

    def order_link(self, obj):
        if not obj.order:
            return '—'
        url = reverse('admin:orders_order_change', args=[obj.order.pk])
        return format_html('<a href="{}">{}</a>', url, obj.order.reference)
    order_link.short_description = 'Order'
    order_link.allow_tags = True

    def mark_approved(self, request, queryset):
        updated = queryset.filter(status='pending').update(status='approved')
        self.message_user(request, f'{updated} commission(s) approved.')
    mark_approved.short_description = 'Mark selected as approved'

    def mark_paid(self, request, queryset):
        updated = queryset.filter(status='approved').update(status='paid')
        self.message_user(request, f'{updated} commission(s) marked paid.')
    mark_paid.short_description = 'Mark selected as paid'


@admin.register(SalesRepPerformance)
class SalesRepPerformanceAdmin(admin.ModelAdmin):
    list_display = [
        'rep_name', 'referral_code', 'total_customers',
        'converted_customers', 'conversion_rate',
        'total_pending', 'total_approved', 'total_paid',
    ]
    list_display_links = None
    actions = None

    def rep_name(self, obj):
        return f'{obj.user.first_name} {obj.user.last_name}'.strip() or obj.user.email
    rep_name.short_description = 'Rep'

    def total_customers(self, obj):
        return obj.referred_customers.count()
    total_customers.short_description = 'Customers'

    def converted_customers(self, obj):
        return obj.referred_customers.filter(status='converted').count()
    converted_customers.short_description = 'Converted'

    def conversion_rate(self, obj):
        total = obj.referred_customers.count()
        if not total:
            return '—'
        converted = obj.referred_customers.filter(status='converted').count()
        return f'{(converted / total * 100):.0f}%'
    conversion_rate.short_description = 'Conversion %'

    def _commission_total(self, obj, status):
        total = obj.commissions.filter(status=status).aggregate(t=Sum('amount'))['t']
        return f'GHS {total:.2f}' if total else 'GHS 0.00'

    def total_pending(self, obj):
        return self._commission_total(obj, 'pending')
    total_pending.short_description = 'Pending'

    def total_approved(self, obj):
        return self._commission_total(obj, 'approved')
    total_approved.short_description = 'Approved'

    def total_paid(self, obj):
        return self._commission_total(obj, 'paid')
    total_paid.short_description = 'Paid'

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related(
            'referred_customers', 'commissions'
        )
