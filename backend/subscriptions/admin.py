from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline

from .models import (
    DeliveryZone, Subscription, SubscriptionItem, SubscriptionPlan,
    SubscriptionPlanItem, SubscriptionWeek, WholesaleQuote, WholesaleQuoteItem,
)


class SubscriptionPlanItemInline(TabularInline):
    model = SubscriptionPlanItem
    extra = 1
    fields = ['product', 'quantity', 'can_swap', 'display_order']


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(ModelAdmin):
    list_display = [
        'name', 'audience', 'plan_type', 'weekly_price',
        'household_size', 'is_active', 'is_featured',
    ]
    list_filter = ['audience', 'plan_type', 'is_active', 'is_featured']
    list_editable = ['weekly_price', 'is_active', 'is_featured']
    search_fields = ['name', 'short_description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [SubscriptionPlanItemInline]


@admin.register(DeliveryZone)
class DeliveryZoneAdmin(ModelAdmin):
    list_display = [
        'name', 'delivery_weekday', 'cutoff_hours',
        'delivery_fee', 'is_active', 'display_order',
    ]
    list_editable = ['is_active', 'display_order']
    list_filter = ['delivery_weekday', 'is_active']
    prepopulated_fields = {'slug': ('name',)}


class SubscriptionItemInline(TabularInline):
    model = SubscriptionItem
    extra = 0
    fields = [
        'product', 'quantity', 'unit_price', 'can_substitute', 'display_order'
    ]


class SubscriptionWeekInline(TabularInline):
    model = SubscriptionWeek
    extra = 0
    fields = [
        'delivery_date', 'status', 'subtotal', 'delivery_fee',
        'payment_reference', 'order',
    ]
    readonly_fields = ['payment_reference', 'order']
    ordering = ['-delivery_date']


@admin.register(Subscription)
class SubscriptionAdmin(ModelAdmin):
    list_display = [
        'name', 'user', 'audience', 'status', 'delivery_zone',
        'next_delivery_date', 'weekly_subtotal', 'payment_method',
    ]
    list_filter = [
        'audience', 'status', 'payment_method', 'delivery_zone',
        'next_delivery_date',
    ]
    search_fields = [
        'name', 'user__email', 'user__first_name', 'user__last_name',
        'business_profile__company_name', 'contact_phone',
    ]
    readonly_fields = [
        'user', 'business_profile', 'weekly_subtotal', 'weekly_delivery_fee',
        'paystack_customer_code', 'payment_email', 'card_brand', 'card_last4',
        'authorization_reusable', 'started_at', 'paused_at', 'cancelled_at',
        'created_at', 'updated_at',
    ]
    inlines = [SubscriptionItemInline, SubscriptionWeekInline]

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(SubscriptionWeek)
class SubscriptionWeekAdmin(ModelAdmin):
    list_display = ['delivery_date', 'subscription', 'status', 'subtotal', 'delivery_fee', 'order']
    list_filter = ['status', 'delivery_date']
    search_fields = ['subscription__user__email', 'subscription__name', 'payment_reference']
    readonly_fields = ['subscription', 'payment_reference', 'payment_attempts', 'paid_at', 'order', 'created_at', 'updated_at']

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        previous_status = None
        if change:
            previous_status = SubscriptionWeek.objects.filter(pk=obj.pk).values_list(
                'status', flat=True
            ).first()
        super().save_model(request, obj, form, change)
        if (
            obj.status == 'delivered' and previous_status != 'delivered'
            and obj.subscription.status == 'active'
        ):
            from .services import schedule_next_week
            schedule_next_week(obj.subscription, obj.delivery_date)


class WholesaleQuoteItemInline(TabularInline):
    model = WholesaleQuoteItem
    extra = 0
    fields = [
        'product', 'quantity', 'requested_unit', 'quoted_unit_price', 'note'
    ]


@admin.register(WholesaleQuote)
class WholesaleQuoteAdmin(ModelAdmin):
    list_display = [
        'id', 'business', 'status', 'is_recurring',
        'requested_delivery_date', 'quoted_subtotal', 'valid_until', 'created_at',
    ]
    list_filter = ['status', 'is_recurring', 'requested_delivery_date', 'created_at']
    search_fields = [
        'business__company_name', 'business__business_email', 'customer_note'
    ]
    readonly_fields = ['business', 'converted_order', 'created_at', 'updated_at']
    inlines = [WholesaleQuoteItemInline]

    def has_delete_permission(self, request, obj=None):
        return False
