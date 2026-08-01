from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib import messages
from django.utils import timezone
from unfold.admin import ModelAdmin, StackedInline
from .models import (
    User, Customer, Staff, B2BProfile, B2BDiscountTier, StaffInvitation,
)
from .forms import UserCreationForm, UserChangeForm, StaffInvitationAdminForm
from sales.models import SalesRep


class SalesRepInline(StackedInline):
    model = SalesRep
    extra = 0
    fields = [
        'phone', 'status', 'commission_rate_registration',
        'commission_rate_first_purchase', 'commission_rate_repeat_purchase',
    ]


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    add_form = UserCreationForm
    form = UserChangeForm
    model = User
    inlines = [SalesRepInline]

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
                    'phone_number', 'email_verified', 'date_joined', 'is_active']
    # email_verified toggleable straight from the list — used to mark the known
    # legitimate customers verified before verification-gating is deployed.
    list_editable = ['email_verified']
    list_filter = ['email_verified', 'is_active', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name', 'phone_number']
    ordering = ['-date_joined']
    readonly_fields = ['date_joined', 'last_login']
    # Explicit fields so email_verified is editable on the detail page while the
    # raw password hash field is not exposed on this proxy admin.
    fields = [
        'email', 'first_name', 'last_name', 'phone_number',
        'email_verified', 'is_active',
        'house_number', 'street_address', 'city', 'delivery_region',
        'date_joined', 'last_login',
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).filter(
            is_staff=False, is_superuser=False
        )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(Staff)
class StaffAdmin(ModelAdmin):
    list_display = [
        'email', 'first_name', 'last_name', 'staff_role',
        'is_active', 'last_login',
    ]
    list_filter = ['is_active', 'groups', 'date_joined']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['first_name', 'last_name', 'email']
    filter_horizontal = ['groups']
    fields = [
        'email', 'first_name', 'last_name', 'staff_role',
        'is_active', 'groups', 'last_login', 'date_joined',
    ]
    readonly_fields = [
        'email', 'first_name', 'last_name', 'staff_role',
        'last_login', 'date_joined',
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).filter(is_staff=True)

    @admin.display(description='Role')
    def staff_role(self, obj):
        if obj.is_superuser:
            return 'Owner'
        return ', '.join(obj.groups.values_list('name', flat=True)) or 'Staff'

    def has_module_permission(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        if not request.user.is_superuser:
            return False
        # The owner account is deliberately protected from this operational
        # screen. Owner security changes belong in the dedicated user admin.
        return obj is None or not obj.is_superuser

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(StaffInvitation)
class StaffInvitationAdmin(ModelAdmin):
    form = StaffInvitationAdminForm
    list_display = [
        'company_email', 'full_name', 'delivery_email', 'role',
        'invitation_status', 'expires_at', 'invited_by',
    ]
    list_filter = ['role', 'delivery_status', 'created_at']
    search_fields = [
        'company_email', 'delivery_email', 'first_name', 'last_name'
    ]
    ordering = ['-created_at']
    actions = ['resend_invitations', 'revoke_invitations']

    def get_fields(self, request, obj=None):
        if obj is None:
            return ['first_name', 'last_name', 'company_email', 'delivery_email', 'role']
        return [
            'first_name', 'last_name', 'company_email', 'delivery_email', 'role',
            'invitation_status', 'delivery_status', 'delivery_error',
            'expires_at', 'accepted_at', 'revoked_at', 'invited_by',
            'created_at', 'updated_at',
        ]

    def get_readonly_fields(self, request, obj=None):
        if obj is None:
            return []
        return self.get_fields(request, obj)

    @admin.display(description='Name')
    def full_name(self, obj):
        return f'{obj.first_name} {obj.last_name}'.strip()

    @admin.display(description='Status')
    def invitation_status(self, obj):
        return obj.status.replace('_', ' ').title()

    def save_model(self, request, obj, form, change):
        if change:
            return super().save_model(request, obj, form, change)

        obj.invited_by = request.user
        raw_token = obj.issue_token()
        super().save_model(request, obj, form, change)
        delivered = self._deliver(obj, raw_token)
        if delivered:
            self.message_user(
                request,
                f'Setup link sent to {obj.delivery_email}.',
                messages.SUCCESS,
            )
        else:
            self.message_user(
                request,
                'Invitation saved, but email delivery failed. Use Resend after checking the address.',
                messages.WARNING,
            )

    def _deliver(self, invitation, raw_token):
        from .emails import send_staff_invitation_email
        try:
            send_staff_invitation_email(invitation, raw_token)
        except Exception as exc:
            invitation.delivery_status = 'failed'
            invitation.delivery_error = str(exc)[:500]
            invitation.save(update_fields=[
                'delivery_status', 'delivery_error', 'updated_at'
            ])
            return False

        invitation.delivery_status = 'sent'
        invitation.delivery_error = ''
        invitation.save(update_fields=[
            'delivery_status', 'delivery_error', 'updated_at'
        ])
        return True

    @admin.action(description='Resend selected setup links')
    def resend_invitations(self, request, queryset):
        sent = skipped = failed = 0
        for invitation in queryset:
            if invitation.accepted_at or invitation.revoked_at:
                skipped += 1
                continue
            raw_token = invitation.issue_token()
            invitation.save(update_fields=[
                'token_digest', 'expires_at', 'revoked_at',
                'delivery_status', 'delivery_error', 'updated_at',
            ])
            if self._deliver(invitation, raw_token):
                sent += 1
            else:
                failed += 1
        self.message_user(
            request,
            f'Resent: {sent}. Failed: {failed}. Skipped: {skipped}.',
            messages.SUCCESS if not failed else messages.WARNING,
        )

    @admin.action(description='Revoke selected invitations')
    def revoke_invitations(self, request, queryset):
        updated = queryset.filter(
            accepted_at__isnull=True,
            revoked_at__isnull=True,
        ).update(revoked_at=timezone.now())
        self.message_user(request, f'Revoked {updated} invitation(s).')

    def has_module_permission(self, request):
        return request.user.is_superuser

    def has_view_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        return False


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
    search_fields = ['company_name', 'business_email', 'contact_person', 'business_phone']
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
        return obj.user.email if obj.user else obj.business_email

    def save_model(self, request, obj, form, change):
        previous_status = None
        if change:
            try:
                previous_status = B2BProfile.objects.get(pk=obj.pk).status
            except B2BProfile.DoesNotExist:
                pass

        uid = None
        token = None

        if obj.status == 'approved' and previous_status != 'approved':
            obj.approved_at = timezone.now()

            if not obj.user:
                from django.contrib.auth import get_user_model
                from django.contrib.auth.tokens import default_token_generator
                from django.utils.http import urlsafe_base64_encode
                from django.utils.encoding import force_bytes

                UserModel = get_user_model()
                name_parts = obj.contact_person.split() if obj.contact_person else []
                first_name = name_parts[0] if name_parts else ''
                last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

                user, created = UserModel.objects.get_or_create(
                    email=obj.business_email,
                    defaults={
                        'first_name': first_name,
                        'last_name': last_name,
                        'is_active': True,
                        'email_verified': True,
                    },
                )

                if created:
                    user.set_unusable_password()
                    user.save()

                obj.user = user
                token = default_token_generator.make_token(user)
                uid = urlsafe_base64_encode(force_bytes(user.pk))

        super().save_model(request, obj, form, change)

        if not change:
            return

        from .emails import send_b2b_approval_email, send_b2b_rejection_email
        if obj.status == 'approved' and previous_status != 'approved':
            try:
                send_b2b_approval_email(obj, uid, token)
            except Exception as e:
                print(f'B2B approval email failed: {e}')
        elif obj.status == 'rejected' and previous_status != 'rejected':
            try:
                send_b2b_rejection_email(obj)
            except Exception:
                pass
