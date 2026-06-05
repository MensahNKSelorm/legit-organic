from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from .models import User
from .forms import UserCreationForm, UserChangeForm


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    model = User

    list_display = ['email', 'first_name', 'last_name',
                    'phone_number', 'is_staff', 'is_active', 'date_joined']
    list_filter = ['is_staff', 'is_active']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('first_name', 'last_name',
                                       'phone_number', 'delivery_address',
                                       'avatar')}),
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
