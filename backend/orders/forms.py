from django import forms

from .models import Order


class OrderAdminForm(forms.ModelForm):
    status_note = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 2}),
        help_text='Optional internal note explaining this fulfilment change.',
    )
    test_order_reason = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 2}),
        help_text='Required when marking an order as test data.',
    )
    payment_change_reason = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={'rows': 3}),
        help_text='Required whenever a manual WhatsApp payment status is corrected.',
    )
    current_password = forms.CharField(
        required=False,
        widget=forms.PasswordInput(attrs={'autocomplete': 'current-password'}),
        help_text='Required for a manual payment correction.',
    )
    otp_token = forms.CharField(
        required=False,
        label='Authenticator or recovery code',
        widget=forms.TextInput(attrs={'autocomplete': 'one-time-code'}),
        help_text='Required for a manual payment correction.',
    )

    class Meta:
        model = Order
        fields = '__all__'

    def __init__(self, *args, request=None, **kwargs):
        self.request = request
        super().__init__(*args, **kwargs)

    def clean(self):
        cleaned = super().clean()
        if not self.instance.pk:
            return cleaned
        old = Order.objects.get(pk=self.instance.pk)
        new_status = cleaned.get('status', old.status)
        driver = cleaned.get('driver')
        if new_status != old.status:
            if not old.can_transition_to(new_status):
                self.add_error(
                    'status',
                    f'Order cannot move from {old.get_status_display()} to '
                    f'{dict(Order.STATUS_CHOICES).get(new_status, new_status)}.',
                )
            if (
                new_status in {'processing', 'ready_for_dispatch', 'out_for_delivery', 'delivered'}
                and old.payment_status != 'success'
            ):
                self.add_error('status', 'Only a successfully paid order can enter fulfilment.')
            if new_status == 'delivered':
                self.add_error(
                    'status', 'Use the delivery PIN confirmation action to mark an order delivered.'
                )
            if new_status == 'out_for_delivery':
                if driver is None:
                    self.add_error('driver', 'Assign a driver before dispatching this order.')
                elif not driver.is_active:
                    self.add_error('driver', 'Choose an active driver for this delivery.')

        new_is_test = cleaned.get('is_test', old.is_test)
        if new_is_test != old.is_test:
            if self.request is None or not self.request.user.is_superuser:
                self.add_error('is_test', 'Only the Owner can classify test orders.')
            if new_is_test and not (cleaned.get('test_order_reason') or '').strip():
                self.add_error('test_order_reason', 'Explain why this is test data.')

        new_payment = cleaned.get('payment_status', old.payment_status)
        if new_payment != old.payment_status:
            if old.order_source in ('paystack', 'seevcash', 'subscription'):
                self.add_error(
                    'payment_status',
                    'Gateway payment state is controlled by verified provider responses.',
                )
            if not (cleaned.get('payment_change_reason') or '').strip():
                self.add_error(
                    'payment_change_reason', 'Explain why this payment correction is necessary.'
                )
            if self.request is None or not self.request.user.check_password(
                cleaned.get('current_password') or ''
            ):
                self.add_error('current_password', 'Enter your current password.')
            else:
                from security.auth import verify_staff_code

                verified, recovery_used = verify_staff_code(
                    self.request.user, cleaned.get('otp_token') or ''
                )
                if not verified:
                    self.add_error('otp_token', 'Enter a valid authenticator or recovery code.')
                self.payment_recovery_code_used = recovery_used
        return cleaned
