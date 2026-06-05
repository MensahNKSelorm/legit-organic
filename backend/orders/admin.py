from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import Cart, CartItem, Order, OrderItem


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
            'fields': ('user', 'status', 'total_amount', 'delivery_address'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
