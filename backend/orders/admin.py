from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import Cart, CartItem, Order, OrderItem
from .promo_models import PromoCode


class CartItemInline(TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['product', 'quantity']


@admin.register(Cart)
class CartAdmin(ModelAdmin):
    list_display = ['user', 'item_count', 'created_at']
    readonly_fields = ['user', 'created_at', 'updated_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    inlines = [CartItemInline]

    @admin.display(description='Items')
    def item_count(self, obj):
        return obj.items.count()


class OrderItemInline(TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['product', 'quantity', 'unit_price']


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    list_display = ['id', 'user', 'status', 'total_amount', 'created_at']
    list_filter = ['status']
    search_fields = ['user__email', 'user__first_name']
    list_editable = ['status']
    readonly_fields = ['user', 'total_amount', 'created_at', 'updated_at']
    inlines = [OrderItemInline]
    fieldsets = (
        ('Order Info', {
            'fields': ('user', 'status', 'total_amount', 'discount_amount',
                       'promo_code', 'delivery_address'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


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
