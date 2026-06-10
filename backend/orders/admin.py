from django.contrib import admin
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
    ]
    inlines = [OrderItemInline]
    fieldsets = (
        ('Order Info', {
            'fields': (
                'user', 'order_source',
                'total_amount', 'discount_amount', 'promo_code',
                'delivery_address',
            ),
        }),
        ('Status', {
            'fields': ('status', 'payment_status'),
            'description': 'Only these fields can be edited.',
        }),
        ('Guest Details', {
            'fields': ('guest_name', 'guest_phone', 'guest_email'),
            'classes': ('collapse',),
        }),
        ('Payment', {
            'fields': ('reference', 'paystack_id'),
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
        orders = Order.objects.select_related(
            'user', 'promo_code'
        ).prefetch_related(
            'items', 'items__product'
        ).order_by('-created_at')
        return generate_orders_excel(list(orders))

    @admin.display(description='Customer')
    def get_customer(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name} ({obj.user.email})"
        return f"{obj.guest_name} - Guest ({obj.guest_phone})"


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
