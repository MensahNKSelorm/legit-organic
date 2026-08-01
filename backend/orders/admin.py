from django.contrib import admin
from django.contrib import messages
from django.db.models import Q
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.dateparse import parse_date
from unfold.admin import ModelAdmin, TabularInline
from .models import Cart, CartItem, Order, OrderItem
from .promo_models import PromoCode


@admin.action(description='📊 Export selected orders to Excel')
def export_to_excel(modeladmin, request, queryset):
    from .exports import generate_orders_excel
    orders = queryset.select_related(
        'user', 'promo_code'
    ).prefetch_related('items', 'items__product')
    return generate_orders_excel(list(orders))


class CartItemInline(TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['product', 'quantity']

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(Cart)
class CartAdmin(ModelAdmin):
    list_display = ['user', 'item_count', 'created_at']
    readonly_fields = ['user', 'created_at', 'updated_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    inlines = [CartItemInline]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    @admin.display(description='Items')
    def item_count(self, obj):
        return obj.items.count()


class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'unit_price']

    def has_add_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    change_list_template = 'admin/orders/order/change_list.html'
    actions = [export_to_excel]
    list_display = ['reference', 'get_customer', 'status', 'payment_status',
                    'order_source', 'total_amount', 'created_at']
    list_filter = ['status', 'payment_status', 'order_source', 'created_at']
    search_fields = ['reference', 'user__email', 'user__first_name', 'user__last_name',
                     'guest_name', 'guest_phone', 'guest_email', 'delivery_address']
    list_editable = []
    ordering = ['-created_at']
    readonly_fields = [
        'reference', 'paystack_id', 'created_at', 'updated_at',
        'user', 'guest_name', 'guest_phone', 'guest_email',
        'total_amount', 'discount_amount', 'promo_code',
        'delivery_address', 'order_source',
        'payment_report_sent_at', 'delivery_report_sent_at',
        'payment_report_attempts', 'delivery_report_attempts',
        'payment_report_error', 'delivery_report_error',
    ]
    inlines = [OrderItemInline]
    fieldsets = (
        ('Order Info', {
            'fields': (
                'reference', 'user', 'order_source',
                'guest_name', 'guest_email', 'guest_phone',
                'total_amount', 'discount_amount', 'promo_code',
                'delivery_address',
                'payment_report_sent_at', 'delivery_report_sent_at',
                'payment_report_attempts', 'delivery_report_attempts',
                'payment_report_error', 'delivery_report_error',
            ),
        }),
        ('Status', {
            'fields': ('status', 'payment_status'),
            'description': 'Only these fields can be edited.',
        }),
        ('Payment', {
            'fields': ('paystack_id',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    def get_urls(self):
        from django.urls import path
        urls = super().get_urls()
        custom_urls = [
            path(
                'export-all/',
                self.admin_site.admin_view(self.export_all_view),
                name='orders-export-all',
            ),
        ]
        return custom_urls + urls

    def export_all_view(self, request):
        from .exports import generate_orders_excel
        if not self.has_view_permission(request):
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied

        date_from = request.GET.get('date_from', '').strip()
        date_to = request.GET.get('date_to', '').strip()
        status_filter = request.GET.get('status', '').strip()
        payment_filter = request.GET.get('payment_status', '').strip()
        source_filter = request.GET.get('source', '').strip()
        customer = request.GET.get('customer', '').strip()

        if (date_from and parse_date(date_from) is None) or (
            date_to and parse_date(date_to) is None
        ):
            messages.error(request, 'Choose valid From and To dates before exporting.')
            return redirect('admin:orders_order_changelist')
        if date_from and date_to and parse_date(date_from) > parse_date(date_to):
            messages.error(request, 'The From date cannot be later than the To date.')
            return redirect('admin:orders_order_changelist')

        orders = Order.objects.select_related(
            'user', 'promo_code'
        ).prefetch_related(
            'items', 'items__product'
        ).order_by('-created_at')
        if date_from:
            orders = orders.filter(created_at__date__gte=date_from)
        if date_to:
            orders = orders.filter(created_at__date__lte=date_to)
        if status_filter:
            orders = orders.filter(status=status_filter)
        if payment_filter:
            orders = orders.filter(payment_status=payment_filter)
        if source_filter:
            orders = orders.filter(order_source=source_filter)
        if customer:
            orders = orders.filter(
                Q(reference__icontains=customer)
                | Q(user__email__icontains=customer)
                | Q(user__first_name__icontains=customer)
                | Q(user__last_name__icontains=customer)
                | Q(guest_name__icontains=customer)
                | Q(guest_email__icontains=customer)
                | Q(guest_phone__icontains=customer)
            )

        filters = {
            'Date from': date_from,
            'Date to': date_to,
            'Order status': status_filter,
            'Payment status': payment_filter,
            'Channel': source_filter,
            'Customer/reference': customer,
        }
        return generate_orders_excel(
            list(orders), date_from, date_to, status_filter, filters=filters
        )

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context.update({
            'order_export_url': reverse('admin:orders-export-all'),
            'order_status_choices': Order.STATUS_CHOICES,
            'payment_status_choices': Order.PAYMENT_STATUS_CHOICES,
            'order_source_choices': Order._meta.get_field('order_source').choices,
        })
        return super().changelist_view(request, extra_context=extra_context)

    @admin.display(description='Customer')
    def get_customer(self, obj):
        if obj.guest_name:
            email = obj.guest_email or (obj.user.email if obj.user else 'No email')
            return f"{obj.guest_name} ({email})"
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name} ({obj.user.email})"
        return f"Guest — {obj.guest_phone or 'No contact'}"


@admin.register(PromoCode)
class PromoCodeAdmin(ModelAdmin):
    list_display = ['code', 'ambassador_name', 'discount_type',
                    'discount_value', 'minimum_order_amount',
                    'times_used', 'is_active', 'expires_at']
    list_filter = ['discount_type', 'is_active']
    list_editable = ['is_active']
    search_fields = ['code', 'ambassador_name', 'ambassador_email']
    readonly_fields = ['times_used', 'created_at', 'updated_at']

    fieldsets = (
        ('Code Details', {
            'fields': ('code', 'description', 'is_active', 'expires_at')
        }),
        ('Ambassador', {
            'fields': ('ambassador_name', 'ambassador_email')
        }),
        ('Discount', {
            'fields': ('discount_type', 'discount_value',
                       'minimum_order_amount')
        }),
        ('Statistics', {
            'fields': ('times_used', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
