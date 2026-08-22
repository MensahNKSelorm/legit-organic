from django.contrib import admin
from django import forms
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib import messages
from django.utils import timezone
from django.utils.html import format_html
from django.urls import reverse
from unfold.admin import ModelAdmin, StackedInline
from .models import (
    User, Customer, Staff, B2BProfile, B2BReviewEvent, BusinessPrice, BusinessPriceList,
    StaffInvitation,
)
from .forms import (
    StaffAccessAdminForm, StaffInvitationAdminForm,
    UserChangeForm, UserCreationForm,
)
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
    actions = ['deactivate_customers', 'reactivate_customers']
    list_display = ['email', 'first_name', 'last_name',
                    'phone_number', 'city', 'delivery_region',
                    'email_verified', 'date_joined', 'is_active']
    # email_verified toggleable straight from the list — used to mark the known
    # legitimate customers verified before verification-gating is deployed.
    list_editable = ['email_verified']
    list_filter = ['email_verified', 'is_active', 'date_joined']
    search_fields = [
        'email', 'first_name', 'last_name', 'phone_number',
        'street_address', 'city', 'delivery_region',
    ]
    ordering = ['-date_joined']
    # Explicit fields so email_verified is editable on the detail page while the
    # raw password hash field is not exposed on this proxy admin.
    fields = [
        'email', 'first_name', 'last_name', 'phone_number',
        'email_verified', 'is_active',
        'house_number', 'street_address', 'city', 'delivery_region',
        'date_joined', 'last_login', 'anonymization_control',
    ]

    readonly_fields = ['date_joined', 'last_login', 'anonymization_control']

    def get_queryset(self, request):
        return super().get_queryset(request).filter(
            is_staff=False, is_superuser=False
        )

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.display(description='Privacy controls')
    def anonymization_control(self, obj):
        if not obj or not obj.pk:
            return 'Customer record unavailable.'
        url = reverse('staff-security:anonymize-customer', args=[obj.pk])
        return format_html('<a href="{}">Owner-only account anonymisation</a>', url)

    @admin.action(description='Deactivate selected customer accounts')
    def deactivate_customers(self, request, queryset):
        from security.audit import record_event
        from security.models import AuditEvent
        count = 0
        for customer in queryset.filter(is_active=True):
            customer.is_active = False
            customer.save(update_fields=['is_active'])
            record_event(
                action='customer.deactivated', request=request, target=customer,
                severity=AuditEvent.Severity.SENSITIVE,
                before={'is_active': True}, after={'is_active': False},
            )
            count += 1
        self.message_user(request, f'Deactivated {count} customer account(s).')

    @admin.action(description='Reactivate selected customer accounts')
    def reactivate_customers(self, request, queryset):
        from security.audit import record_event
        from security.models import AuditEvent
        count = 0
        for customer in queryset.filter(is_active=False):
            customer.is_active = True
            customer.save(update_fields=['is_active'])
            record_event(
                action='customer.reactivated', request=request, target=customer,
                severity=AuditEvent.Severity.SENSITIVE,
                before={'is_active': False}, after={'is_active': True},
            )
            count += 1
        self.message_user(request, f'Reactivated {count} customer account(s).')


@admin.register(Staff)
class StaffAdmin(ModelAdmin):
    form = StaffAccessAdminForm
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
        'is_active', 'groups', 'access_change_reason',
        'owner_password', 'owner_otp_token',
        'security_controls', 'last_login', 'date_joined',
    ]
    readonly_fields = [
        'first_name', 'last_name', 'staff_role',
        'security_controls', 'last_login', 'date_joined',
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).filter(is_staff=True)

    @admin.display(description='Role')
    def staff_role(self, obj):
        if obj.is_superuser:
            return 'Owner'
        return ', '.join(obj.groups.values_list('name', flat=True)) or 'Staff'

    @admin.display(description='Account security')
    def security_controls(self, obj):
        if not obj or obj.is_superuser:
            return 'Owner security is managed from the signed-in account.'
        url = reverse('staff-security:reset-staff', args=[obj.pk])
        return format_html('<a href="{}">Reset 2FA and revoke sessions</a>', url)

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

    def get_form(self, request, obj=None, change=False, **kwargs):
        base_form = super().get_form(request, obj, change, **kwargs)

        class RequestAwareStaffForm(base_form):
            def __init__(self, *args, **form_kwargs):
                form_kwargs['request'] = request
                super().__init__(*args, **form_kwargs)

        return RequestAwareStaffForm

    def save_model(self, request, obj, form, change):
        if change:
            old = User.objects.get(pk=obj.pk)
            obj._security_old_email = old.email
            obj._security_old_active = old.is_active
            obj._security_old_groups = set(old.groups.values_list('name', flat=True))
        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        if not change:
            return
        obj = form.instance
        old_email = getattr(obj, '_security_old_email', obj.email)
        old_groups = getattr(obj, '_security_old_groups', set())
        new_groups = set(obj.groups.values_list('name', flat=True))
        email_changed = old_email.lower() != obj.email.lower()
        active_changed = getattr(obj, '_security_old_active', obj.is_active) != obj.is_active
        if old_groups != new_groups or active_changed or email_changed:
            from security.audit import record_event, revoke_user_sessions
            from security.models import AuditEvent, StaffSecurityProfile
            profile, _ = StaffSecurityProfile.objects.get_or_create(user=obj)
            profile.security_version += 1
            profile.save(update_fields=['security_version', 'updated_at'])
            revoked = revoke_user_sessions(obj)
            record_event(
                action='staff.access_changed', request=request, target=obj,
                severity=AuditEvent.Severity.CRITICAL,
                before={
                    'email': old_email,
                    'roles': sorted(old_groups),
                    'is_active': getattr(obj, '_security_old_active', obj.is_active),
                },
                after={
                    'email': obj.email,
                    'roles': sorted(new_groups),
                    'is_active': obj.is_active,
                },
                reason=form.cleaned_data.get('access_change_reason', ''),
                metadata={
                    'sessions_revoked': revoked,
                    'recovery_code_used': getattr(
                        form, 'access_recovery_code_used', False
                    ),
                },
            )


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
            return [
                'first_name', 'last_name', 'company_email', 'delivery_email', 'role',
                'invitation_reason', 'owner_password', 'owner_otp_token',
            ]
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

    def get_form(self, request, obj=None, change=False, **kwargs):
        base_form = super().get_form(request, obj, change, **kwargs)

        class RequestAwareInvitationForm(base_form):
            def __init__(self, *args, **form_kwargs):
                form_kwargs['request'] = request
                super().__init__(*args, **form_kwargs)

        return RequestAwareInvitationForm

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
        from security.audit import record_event
        from security.models import AuditEvent
        record_event(
            action='staff.invited', request=request, target=obj,
            severity=AuditEvent.Severity.CRITICAL,
            reason=form.cleaned_data.get('invitation_reason', ''),
            after={
                'company_email': obj.company_email,
                'delivery_email': obj.delivery_email,
                'role': obj.role,
            },
            metadata={
                'recovery_code_used': getattr(
                    form, 'invitation_recovery_code_used', False
                ),
            },
        )
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


class BusinessPriceInline(StackedInline):
    model = BusinessPrice
    extra = 0
    autocomplete_fields = ['product']


@admin.register(BusinessPriceList)
class BusinessPriceListAdmin(ModelAdmin):
    list_display = ['name', 'is_default', 'is_active', 'updated_at']
    list_filter = ['is_default', 'is_active']
    search_fields = ['name', 'description']
    inlines = [BusinessPriceInline]


class B2BReviewAdminForm(forms.ModelForm):
    review_decision_note = forms.CharField(
        label='Review decision note', required=False, widget=forms.Textarea(attrs={'rows': 3}),
        help_text='Required when the review status changes. This becomes part of the audit history.',
    )

    class Meta:
        model = B2BProfile
        fields = '__all__'

    def clean(self):
        cleaned = super().clean()
        if self.instance.pk:
            previous = B2BProfile.objects.filter(pk=self.instance.pk).values_list('status', flat=True).first()
            if previous != cleaned.get('status') and not cleaned.get('review_decision_note', '').strip():
                self.add_error('review_decision_note', 'Add a concise reason for this status change.')
        return cleaned


@admin.register(B2BProfile)
class B2BProfileAdmin(ModelAdmin):
    form = B2BReviewAdminForm
    list_display = [
        'company_name', 'get_email', 'business_type', 'status',
        'assigned_to', 'price_list', 'created_at',
    ]
    list_filter = ['status', 'business_type', 'assigned_to', 'price_list']
    search_fields = ['company_name', 'business_email', 'contact_person', 'business_phone']
    ordering = ['-created_at']
    readonly_fields = ['user', 'verification_document_download', 'created_at', 'updated_at', 'approved_at']

    fieldsets = (
        ('Organisation', {
            'fields': (
                'user', 'company_name', 'trading_name', 'legal_structure',
                'business_type', 'sector', 'year_started', 'website',
            ),
        }),
        ('Verification', {'fields': (
            'organization_tin', 'business_registration',
            'verification_document_type', 'verification_document_download',
            'registration_exemption_reason',
        )}),
        ('Authorised Contact', {'fields': (
            'contact_person', 'contact_job_title', 'business_phone',
            'alternative_phone', 'business_email',
        )}),
        ('Delivery', {'fields': (
            'business_address', 'delivery_region', 'delivery_city',
            'delivery_district', 'delivery_locality', 'delivery_street',
            'ghana_post_gps', 'delivery_landmark', 'delivery_directions',
            'receiving_contact_name', 'receiving_contact_phone',
            'receiving_hours', 'access_restrictions',
        )}),
        ('Supply Requirements', {'fields': (
            'produce_categories', 'order_frequency', 'estimated_monthly_order',
            'preferred_start_date', 'purchase_order_required',
            'invoice_requirements', 'procurement_notes',
        )}),
        ('Declarations', {'fields': (
            'applicant_authorized', 'information_confirmed', 'privacy_acknowledged',
        )}),
        ('Review', {
            'fields': (
                'assigned_to', 'status', 'price_list', 'review_decision_note',
                'rejection_reason', 'notes',
            ),
        }),
        ('Timestamps', {
            'fields': ('approved_at', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Email')
    def get_email(self, obj):
        return obj.user.email if obj.user else obj.business_email

    @admin.display(description='Supporting document')
    def verification_document_download(self, obj):
        if not obj.pk or not obj.verification_document:
            return 'Not supplied'
        url = reverse('b2b-document', args=[obj.pk])
        return format_html('<a href="{}">Download private document</a>', url)

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
            if not obj.price_list:
                obj.price_list = BusinessPriceList.objects.filter(
                    is_default=True, is_active=True
                ).first()

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

        if previous_status != obj.status:
            decision_note = form.cleaned_data.get('review_decision_note', '').strip()
            B2BReviewEvent.objects.create(
                profile=obj, from_status=previous_status or '', to_status=obj.status,
                note=decision_note, reviewer=request.user,
            )
            from security.audit import record_event
            record_event(
                action='b2b.review_status_changed', request=request, target=obj,
                before={'status': previous_status}, after={'status': obj.status},
                reason=decision_note,
            )

        from .emails import (
            send_b2b_approval_email, send_b2b_rejection_email,
            send_b2b_review_update_email,
        )
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
        elif obj.status in {'changes_requested', 'suspended'} and previous_status != obj.status:
            try:
                send_b2b_review_update_email(
                    obj, obj.status, form.cleaned_data.get('review_decision_note', '')
                )
            except Exception:
                pass


@admin.register(B2BReviewEvent)
class B2BReviewEventAdmin(ModelAdmin):
    list_display = ['profile', 'from_status', 'to_status', 'reviewer', 'created_at']
    list_filter = ['to_status', 'reviewer', 'created_at']
    search_fields = ['profile__company_name', 'profile__business_email', 'note']
    readonly_fields = ['profile', 'from_status', 'to_status', 'note', 'reviewer', 'created_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
