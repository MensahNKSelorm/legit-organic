from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from .models import User, Customer
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
