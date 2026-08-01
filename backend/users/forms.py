from django import forms
from django.contrib.auth.forms import (
    SetPasswordForm,
    UserCreationForm as BaseCreationForm,
    UserChangeForm as BaseChangeForm,
)
from django.utils.text import slugify

from .models import StaffInvitation, User


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

    class Meta:
        model = StaffInvitation
        fields = ['first_name', 'last_name', 'company_email', 'delivery_email', 'role']

    def clean(self):
        cleaned = super().clean()
        if not cleaned.get('company_email'):
            first = slugify(cleaned.get('first_name', '')).replace('-', '.')
            last = slugify(cleaned.get('last_name', '')).replace('-', '.')
            if first and last:
                cleaned['company_email'] = f'{first}.{last}@legitorganic.com'
                self.instance.company_email = cleaned['company_email']
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
