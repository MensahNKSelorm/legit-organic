from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils import timezone
from unfold.admin import ModelAdmin
from .models import User, Customer, B2BProfile, B2BDiscountTier
from .forms import UserCreationForm, UserChangeForm


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    model = User

    list_display = ['email', 'first_name', 'last_name',
                    'get_user_type', 'is_active', 'date_joined']
    list_filter = ['is_staff', 'is_active', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name',
                                       'phone_number', 'avatar')}),
        ('Delivery Address', {'fields': ('house_number', 'street_address',
                                          'city', 'delivery_region')}),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser',
                       'groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',),
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'first_name', 'last_name',
                       'password1', 'password2', 'is_staff', 'is_active'),
        }),
    )

    readonly_fields = ['last_login', 'date_joined']

    @admin.display(description='Type')
    def get_user_type(self, obj):
        if obj.is_superuser:
            return '⚙️ Admin'
        if obj.is_staff:
            return '👤 Staff'
        return '🛒 Customer'


@admin.register(Customer)
class CustomerAdmin(ModelAdmin):
    list_display = ['email', 'first_name', 'last_name',
                    'phone_number', 'date_joined', 'is_active']
    list_filter = ['is_active', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering = ['-date_joined']
    readonly_fields = ['date_joined', 'last_login']

    def get_queryset(self, request):
        return super().get_queryset(request).filter(
            is_staff=False, is_superuser=False
        )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(B2BDiscountTier)
class B2BDiscountTierAdmin(ModelAdmin):
    list_display = ['name', 'discount_percent', 'min_order_amount', 'max_order_amount', 'description']
    ordering = ['min_order_amount']


@admin.register(B2BProfile)
class B2BProfileAdmin(ModelAdmin):
    list_display = [
        'company_name', 'get_email', 'business_type', 'status',
        'tier', 'created_at',
    ]
    list_filter = ['status', 'business_type', 'tier']
    search_fields = ['company_name', 'user__email', 'contact_person', 'business_phone']
    ordering = ['-created_at']
    readonly_fields = ['user', 'created_at', 'updated_at', 'approved_at']

    fieldsets = (
        ('Business Info', {
            'fields': (
                'user', 'company_name', 'business_type',
                'contact_person', 'business_phone', 'business_email',
                'business_address', 'business_registration',
                'estimated_monthly_order',
            ),
        }),
        ('Review', {
            'fields': ('status', 'tier', 'rejection_reason', 'notes'),
        }),
        ('Timestamps', {
            'fields': ('approved_at', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email

    def save_model(self, request, obj, form, change):
        previous_status = None
        if change:
            try:
                previous_status = B2BProfile.objects.get(pk=obj.pk).status
            except B2BProfile.DoesNotExist:
                pass

        if obj.status == 'approved' and previous_status != 'approved':
            obj.approved_at = timezone.now()

        super().save_model(request, obj, form, change)

        if not change:
            return

        from .emails import send_b2b_approval_email, send_b2b_rejection_email
        if obj.status == 'approved' and previous_status != 'approved':
            try:
                send_b2b_approval_email(obj)
            except Exception:
                pass
        elif obj.status == 'rejected' and previous_status != 'rejected':
            try:
                send_b2b_rejection_email(obj)
            except Exception:
                pass
