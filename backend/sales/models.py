from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import random
import string


def generate_referral_code():
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choices(chars, k=10))


class SalesRep(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sales_rep_profile'
    )
    referral_code = models.CharField(
        max_length=10, unique=True, default=generate_referral_code
    )
    phone = models.CharField(max_length=20)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='active'
    )
    commission_rate_registration = models.DecimalField(
        max_digits=8, decimal_places=2, default=5.00,
        help_text='Flat amount in GHS paid when a referred customer registers'
    )
    commission_rate_first_purchase = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.00,
        help_text='Percentage of order total on customer first purchase'
    )
    commission_rate_repeat_purchase = models.DecimalField(
        max_digits=5, decimal_places=2, default=3.00,
        help_text='Percentage of order total on repeat purchases'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.email} ({self.referral_code})'


class ReferredCustomer(models.Model):
    SOURCE_CHOICES = [
        ('rep_form', 'Rep Form'),
        ('referral_link', 'Referral Link'),
    ]
    STATUS_CHOICES = [
        ('registered', 'Registered'),
        ('converted', 'Converted'),
    ]

    sales_rep = models.ForeignKey(
        SalesRep, on_delete=models.CASCADE, related_name='referred_customers'
    )
    customer = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='referral_record'
    )
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='registered'
    )
    commission_expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.commission_expires_at:
            self.commission_expires_at = timezone.now() + timedelta(days=365)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.customer.email} → {self.sales_rep.user.email}'


class Commission(models.Model):
    TYPE_CHOICES = [
        ('registration', 'Registration'),
        ('first_purchase', 'First Purchase'),
        ('repeat_purchase', 'Repeat Purchase'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('paid', 'Paid'),
    ]

    sales_rep = models.ForeignKey(
        SalesRep, on_delete=models.CASCADE, related_name='commissions'
    )
    referred_customer = models.ForeignKey(
        ReferredCustomer, on_delete=models.CASCADE, related_name='commissions'
    )
    order = models.ForeignKey(
        'orders.Order', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='commissions'
    )
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.sales_rep.user.email} — {self.type} — GHS {self.amount}'
