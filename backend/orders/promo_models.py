from django.db import models


class PromoCode(models.Model):
    DISCOUNT_PERCENTAGE = 'percentage'
    DISCOUNT_FIXED = 'fixed'
    DISCOUNT_TYPES = [
        (DISCOUNT_PERCENTAGE, 'Percentage'),
        (DISCOUNT_FIXED, 'Fixed Amount'),
    ]

    code = models.CharField(max_length=50, unique=True,
                            help_text='The promo code e.g. KWAME20')
    description = models.TextField(blank=True,
                            help_text='Internal note about this code')
    ambassador_name = models.CharField(max_length=100, blank=True,
                            help_text='Brand ambassador this code belongs to')
    ambassador_email = models.CharField(max_length=255, blank=True)

    discount_type = models.CharField(max_length=20,
                                     choices=DISCOUNT_TYPES,
                                     default=DISCOUNT_PERCENTAGE)
    discount_value = models.DecimalField(max_digits=10, decimal_places=2,
                            help_text='e.g. 20 for 20% or 10 for GH₵10 off')
    minimum_order_amount = models.DecimalField(max_digits=10,
                                               decimal_places=2,
                                               default=0,
                            help_text='Minimum order value to use this code')

    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True,
                            help_text='Leave blank for no expiry')

    times_used = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.code} ({self.get_discount_type_display()}: {self.discount_value})'

    def is_valid(self, order_amount=0):
        from django.utils import timezone
        if not self.is_active:
            return False, 'This promo code is no longer active.'
        if self.expires_at and timezone.now() > self.expires_at:
            return False, 'This promo code has expired.'
        if order_amount < self.minimum_order_amount:
            return False, f'Minimum order amount of GH₵{self.minimum_order_amount} required.'
        return True, 'Valid'

    def calculate_discount(self, order_amount):
        if self.discount_type == self.DISCOUNT_PERCENTAGE:
            return round(float(order_amount) * float(self.discount_value) / 100, 2)
        return min(float(self.discount_value), float(order_amount))
