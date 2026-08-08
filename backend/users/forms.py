from django import forms
from django.contrib.auth.forms import (
    SetPasswordForm,
    UserCreationForm as BaseCreationForm,
    UserChangeForm as BaseChangeForm,
)
from django.utils.text import slugify

from .models import Staff, StaffInvitation, User


class UserCreationForm(BaseCreationForm):
    class Meta(BaseCreationForm.Meta):
        model = User
        fields = ('email', 'first_name', 'last_name')


class UserChangeForm(BaseChangeForm):
    class Meta(BaseChangeForm.Meta):
        model = User


class StaffInvitationAdminForm(forms.ModelForm):
    company_email = forms.EmailField(
        required=False,
        help_text='Leave blank to generate firstname.lastname@legitorganic.com.',
    )
    invitation_reason = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 3}),
        help_text='Required when inviting staff.',
    )
    owner_password = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'current-password'}),
    )
    owner_otp_token = forms.CharField(
        required=False,
        label='Owner authenticator or recovery code',
        widget=forms.TextInput(attrs={'autocomplete': 'one-time-code'}),
    )

    class Meta:
        model = StaffInvitation
        fields = ['first_name', 'last_name', 'company_email', 'delivery_email', 'role']

    def __init__(self, *args, request=None, **kwargs):
        self.request = request
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned = super().clean()
        if not cleaned.get('company_email'):
            first = slugify(cleaned.get('first_name', '')).replace('-', '.')
            last = slugify(cleaned.get('last_name', '')).replace('-', '.')
            if first and last:
                cleaned['company_email'] = f'{first}.{last}@legitorganic.com'
                self.instance.company_email = cleaned['company_email']
        if self.request is not None and not self.instance.pk:
            if not (cleaned.get('invitation_reason') or '').strip():
                self.add_error('invitation_reason', 'Explain why this staff access is needed.')
            if not self.request.user.check_password(cleaned.get('owner_password') or ''):
                self.add_error('owner_password', 'Enter your current password.')
            else:
                from security.auth import verify_staff_code
                verified, recovery_used = verify_staff_code(
                    self.request.user, cleaned.get('owner_otp_token') or ''
                )
                if not verified:
                    self.add_error(
                        'owner_otp_token', 'Enter a valid authenticator or recovery code.'
                    )
                self.invitation_recovery_code_used = recovery_used
        return cleaned


class StaffSetupPasswordForm(SetPasswordForm):
    new_password1 = forms.CharField(
        label='Create password',
        strip=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
    )
    new_password2 = forms.CharField(
        label='Confirm password',
        strip=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'new-password'}),
    )


class StaffAccessAdminForm(forms.ModelForm):
    access_change_reason = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 3}),
        help_text='Required when changing roles or activating/deactivating staff.',
    )
    owner_password = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'current-password'}),
    )
    owner_otp_token = forms.CharField(
        required=False,
        label='Owner authenticator or recovery code',
        widget=forms.TextInput(attrs={'autocomplete': 'one-time-code'}),
    )

    class Meta:
        model = Staff
        fields = '__all__'

    def __init__(self, *args, request=None, **kwargs):
        self.request = request
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned = super().clean()
        if not self.instance.pk:
            return cleaned
        old = User.objects.get(pk=self.instance.pk)
        old_groups = set(old.groups.values_list('pk', flat=True))
        new_groups = set(
            cleaned.get('groups', old.groups.none()).values_list('pk', flat=True)
        )
        access_changed = old.is_active != cleaned.get('is_active') or old_groups != new_groups
        if not access_changed:
            return cleaned

        if not (cleaned.get('access_change_reason') or '').strip():
            self.add_error('access_change_reason', 'Explain why this access change is necessary.')
        if self.request is None or not self.request.user.check_password(
            cleaned.get('owner_password') or ''
        ):
            self.add_error('owner_password', 'Enter your current password.')
        else:
            from security.auth import verify_staff_code
            verified, recovery_used = verify_staff_code(
                self.request.user, cleaned.get('owner_otp_token') or ''
            )
            if not verified:
                self.add_error('owner_otp_token', 'Enter a valid authenticator or recovery code.')
            self.access_recovery_code_used = recovery_used
        return cleaned
