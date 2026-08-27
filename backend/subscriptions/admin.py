from django import forms
from django.contrib import admin
from django.utils import timezone
from unfold.admin import ModelAdmin, TabularInline

from .models import (
    BusinessSupplyAgreement, BusinessSupplyCycle, BusinessSupplyItem,
    BusinessSupplyRevision,
    DeliveryZone, Subscription, SubscriptionItem, SubscriptionPlan,
    SubscriptionPlanItem, SubscriptionPlanPriceChange, SubscriptionPriceNotice,
    SubscriptionWeek, WholesaleQuote, WholesaleQuoteItem,
)
from .services import apply_price_change, deliver_price_notice, prepare_price_change
from .services import schedule_business_cycle


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
    list_editable = ['is_active', 'is_featured']
    search_fields = ['name', 'short_description']
    prepopulated_fields = {'slug': ('name',)}
    inlines = [SubscriptionPlanItemInline]

    def get_readonly_fields(self, request, obj=None):
        return ['weekly_price'] if obj else []


@admin.register(SubscriptionPlanPriceChange)
class SubscriptionPlanPriceChangeAdmin(ModelAdmin):
    list_display = [
        'plan', 'old_price', 'new_price', 'effective_at', 'status',
        'notice_progress', 'created_by',
    ]
    list_filter = ['status', 'effective_at', 'plan']
    search_fields = ['plan__name', 'reason']
    readonly_fields = [
        'old_price', 'created_by', 'recipients_prepared_at', 'applied_at',
        'created_at', 'updated_at',
    ]
    actions = ['retry_failed_notices', 'apply_due_changes', 'cancel_changes']

    def get_readonly_fields(self, request, obj=None):
        base = [
            'old_price', 'created_by', 'recipients_prepared_at', 'applied_at',
            'created_at', 'updated_at',
        ]
        if obj and obj.status != 'draft':
            return base + ['plan', 'new_price', 'effective_at', 'status', 'reason']
        return base

    def has_delete_permission(self, request, obj=None):
        return bool(obj and obj.status == 'draft')

    @admin.display(description='Notices')
    def notice_progress(self, obj):
        total = obj.notices.count()
        sent = obj.notices.filter(status__in=['sent', 'applied']).count()
        failed = obj.notices.filter(status='failed').count()
        return f'{sent}/{total} sent' + (f' · {failed} failed' if failed else '')

    def save_model(self, request, obj, form, change):
        if not obj.pk:
            obj.created_by = request.user
        previous_status = None
        if change:
            previous_status = SubscriptionPlanPriceChange.objects.filter(pk=obj.pk).values_list(
                'status', flat=True
            ).first()
        if obj.status == 'scheduled' and previous_status != 'scheduled':
            obj.old_price = obj.plan.weekly_price
        super().save_model(request, obj, form, change)
        if obj.status == 'scheduled' and previous_status != 'scheduled':
            prepare_price_change(obj.pk)
            for notice_id in obj.notices.values_list('pk', flat=True):
                deliver_price_notice(notice_id)
            from security.audit import record_event
            record_event(
                action='subscription.price_change_scheduled', request=request, target=obj,
                before={'weekly_price': str(obj.old_price)},
                after={'weekly_price': str(obj.new_price), 'effective_at': obj.effective_at.isoformat()},
                reason=obj.reason,
            )

    @admin.action(description='Retry failed or pending customer notices')
    def retry_failed_notices(self, request, queryset):
        sent = failed = 0
        for change in queryset.filter(status='scheduled'):
            prepare_price_change(change.pk)
            for notice_id in change.notices.filter(status__in=['pending', 'failed']).values_list('pk', flat=True):
                notice = deliver_price_notice(notice_id)
                sent += notice.status == 'sent'
                failed += notice.status == 'failed'
        self.message_user(request, f'{sent} notice(s) sent; {failed} still require attention.')

    @admin.action(description='Apply selected changes that have reached their effective date')
    def apply_due_changes(self, request, queryset):
        applied = 0
        for change in queryset.filter(status='scheduled', effective_at__lte=timezone.now()):
            apply_price_change(change.pk)
            applied += 1
        self.message_user(request, f'{applied} price change(s) applied. Unnotified customers kept their old price.')

    @admin.action(description='Cancel selected scheduled changes')
    def cancel_changes(self, request, queryset):
        for change in queryset.filter(status='scheduled'):
            change.status = 'cancelled'
            change.save(update_fields=['status', 'updated_at'])
            change.notices.filter(status__in=['pending', 'sent', 'failed']).update(status='cancelled')
            from security.audit import record_event
            record_event(
                action='subscription.price_change_cancelled', request=request, target=change,
                before={'status': 'scheduled'}, after={'status': 'cancelled'},
                reason='Cancelled from the administration workspace.',
            )


@admin.register(SubscriptionPriceNotice)
class SubscriptionPriceNoticeAdmin(ModelAdmin):
    list_display = [
        'recipient_email', 'subscription', 'price_change', 'status',
        'attempts', 'sent_at', 'updated_at',
    ]
    list_filter = ['status', 'price_change__plan']
    search_fields = ['recipient_email', 'subscription__name', 'subscription__user__email']
    readonly_fields = [
        'price_change', 'subscription', 'recipient_email', 'status', 'delivery_id',
        'attempts', 'last_error', 'sent_at', 'applied_at', 'created_at', 'updated_at',
    ]
    actions = ['retry_delivery']

    @admin.action(description='Retry selected failed or pending notices')
    def retry_delivery(self, request, queryset):
        for notice_id in queryset.filter(status__in=['pending', 'failed']).values_list('pk', flat=True):
            deliver_price_notice(notice_id)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


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


class BusinessSupplyItemInline(TabularInline):
    model = BusinessSupplyItem
    extra = 0
    fields = ['product', 'quantity', 'unit_price', 'can_substitute', 'display_order']


class BusinessSupplyCycleInline(TabularInline):
    model = BusinessSupplyCycle
    extra = 0
    fields = [
        'delivery_date', 'payment_due_at', 'status', 'subtotal',
        'delivery_fee', 'payment_reference', 'order',
    ]
    readonly_fields = ['payment_reference', 'order']


class BusinessSupplyAgreementAdminForm(forms.ModelForm):
    review_note = forms.CharField(
        required=False, widget=forms.Textarea(attrs={'rows': 3}),
        help_text='Required when changing the agreement status.',
    )

    class Meta:
        model = BusinessSupplyAgreement
        fields = '__all__'

    def clean(self):
        cleaned = super().clean()
        if self.instance.pk:
            previous = BusinessSupplyAgreement.objects.filter(
                pk=self.instance.pk
            ).values_list('status', flat=True).first()
            if previous != cleaned.get('status') and not cleaned.get('review_note', '').strip():
                self.add_error('review_note', 'Record a concise reason for this status change.')
        return cleaned


@admin.register(BusinessSupplyAgreement)
class BusinessSupplyAgreementAdmin(ModelAdmin):
    form = BusinessSupplyAgreementAdminForm
    list_display = [
        'name', 'business', 'status', 'frequency', 'next_delivery_date',
        'subtotal', 'delivery_fee', 'updated_at',
    ]
    list_filter = ['status', 'frequency', 'delivery_zone', 'next_delivery_date']
    search_fields = [
        'name', 'business__company_name', 'business__business_email',
        'receiving_contact_name', 'receiving_contact_phone',
    ]
    readonly_fields = [
        'business', 'subtotal', 'legacy_subscription', 'approved_at',
        'activated_at', 'paused_at', 'cancelled_at', 'created_at', 'updated_at',
    ]
    fieldsets = (
        ('Agreement', {'fields': (
            'business', 'name', 'status', 'frequency', 'delivery_zone',
            'next_delivery_date', 'review_note', 'staff_note',
        )}),
        ('Receiving', {'fields': (
            'delivery_address', 'receiving_contact_name',
            'receiving_contact_phone', 'receiving_hours', 'delivery_instructions',
        )}),
        ('Commercial terms', {'fields': ('subtotal', 'delivery_fee')}),
        ('History', {'fields': (
            'legacy_subscription', 'approved_at', 'activated_at', 'paused_at',
            'cancelled_at', 'created_at', 'updated_at',
        ), 'classes': ('collapse',)}),
    )
    inlines = [BusinessSupplyItemInline, BusinessSupplyCycleInline]

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        previous = None
        if change:
            previous = BusinessSupplyAgreement.objects.filter(pk=obj.pk).values_list(
                'status', flat=True
            ).first()
        if obj.status in {'approved', 'active'} and previous not in {'approved', 'active'}:
            obj.approved_at = obj.approved_at or timezone.now()
        super().save_model(request, obj, form, change)
        if obj.status in {'approved', 'active'} and previous not in {'approved', 'active'}:
            schedule_business_cycle(obj, obj.next_delivery_date)
        if previous and previous != obj.status:
            from security.audit import record_event
            record_event(
                action='business_supply.status_changed', request=request, target=obj,
                before={'status': previous}, after={'status': obj.status},
                reason=form.cleaned_data.get('review_note', ''),
            )


@admin.register(BusinessSupplyRevision)
class BusinessSupplyRevisionAdmin(ModelAdmin):
    list_display = ['agreement', 'status', 'requested_by', 'reviewed_by', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['agreement__name', 'agreement__business__company_name', 'customer_note']
    readonly_fields = [
        'agreement', 'requested_by', 'proposed_changes', 'customer_note',
        'created_at', 'updated_at',
    ]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        previous = None
        if change:
            previous = BusinessSupplyRevision.objects.filter(pk=obj.pk).values_list(
                'status', flat=True
            ).first()
        if previous == 'submitted' and obj.status in {'approved', 'rejected'}:
            obj.reviewed_by = request.user
            obj.reviewed_at = timezone.now()
        super().save_model(request, obj, form, change)
        if previous == 'submitted' and obj.status == 'approved':
            allowed = {
                'frequency', 'delivery_address', 'receiving_contact_name',
                'receiving_contact_phone', 'receiving_hours',
                'delivery_instructions',
            }
            changes = {
                key: value for key, value in obj.proposed_changes.items()
                if key in allowed
            }
            if changes:
                BusinessSupplyAgreement.objects.filter(pk=obj.agreement_id).update(
                    **changes, updated_at=timezone.now()
                )
            from security.audit import record_event
            record_event(
                action='business_supply.revision_approved', request=request,
                target=obj.agreement, before={}, after=changes,
                reason=obj.staff_note or obj.customer_note,
            )


@admin.register(BusinessSupplyCycle)
class BusinessSupplyCycleAdmin(ModelAdmin):
    list_display = [
        'delivery_date', 'agreement', 'status', 'subtotal', 'delivery_fee', 'order'
    ]
    list_filter = ['status', 'delivery_date']
    search_fields = [
        'agreement__name', 'agreement__business__company_name', 'payment_reference'
    ]
    readonly_fields = [
        'agreement', 'subtotal', 'delivery_fee', 'payment_reference',
        'payment_attempts', 'payment_error', 'paid_at', 'order',
        'created_at', 'updated_at',
    ]

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
