from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify


class DeliveryZone(models.Model):
    WEEKDAYS = [
        (0, 'Monday'), (1, 'Tuesday'), (2, 'Wednesday'), (3, 'Thursday'),
        (4, 'Friday'), (5, 'Saturday'), (6, 'Sunday'),
    ]

    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(unique=True, blank=True)
    delivery_weekday = models.PositiveSmallIntegerField(choices=WEEKDAYS)
    cutoff_hours = models.PositiveSmallIntegerField(default=48)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} · {self.get_delivery_weekday_display()}'


class SubscriptionPlan(models.Model):
    AUDIENCES = [('household', 'Household'), ('business', 'Business')]
    PLAN_TYPES = [('curated', 'Curated'), ('custom', 'Build your week')]

    name = models.CharField(max_length=120)
    slug = models.SlugField(unique=True, blank=True)
    audience = models.CharField(max_length=20, choices=AUDIENCES, default='household')
    plan_type = models.CharField(max_length=20, choices=PLAN_TYPES, default='curated')
    short_description = models.CharField(max_length=180, blank=True)
    weekly_price = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    household_size = models.PositiveSmallIntegerField(null=True, blank=True)
    image = models.ImageField(upload_to='subscriptions/plans/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'weekly_price', 'name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class SubscriptionPlanItem(models.Model):
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.CASCADE, related_name='items'
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT, related_name='subscription_plan_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    can_swap = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'pk']
        constraints = [
            models.UniqueConstraint(
                fields=['plan', 'product'], name='unique_product_per_subscription_plan'
            )
        ]

    def __str__(self):
        return f'{self.plan}: {self.product} × {self.quantity}'


class Subscription(models.Model):
    STATUSES = [
        ('draft', 'Draft'), ('active', 'Active'),
        ('paused', 'Paused'), ('cancelled', 'Cancelled'),
    ]
    AUDIENCES = SubscriptionPlan.AUDIENCES
    PAYMENT_METHODS = [('card', 'Card'), ('mobile_money', 'Mobile Money')]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='subscriptions'
    )
    business_profile = models.ForeignKey(
        'users.B2BProfile', on_delete=models.PROTECT, null=True, blank=True,
        related_name='subscriptions',
    )
    plan = models.ForeignKey(
        SubscriptionPlan, on_delete=models.PROTECT, null=True, blank=True,
        related_name='subscriptions',
    )
    name = models.CharField(max_length=120, blank=True)
    audience = models.CharField(max_length=20, choices=AUDIENCES, default='household')
    status = models.CharField(max_length=30, choices=STATUSES, default='draft')
    delivery_zone = models.ForeignKey(
        DeliveryZone, on_delete=models.PROTECT, related_name='subscriptions'
    )
    delivery_address = models.TextField()
    contact_phone = models.CharField(max_length=20)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHODS)
    weekly_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    weekly_delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    next_delivery_date = models.DateField(null=True, blank=True)
    paystack_customer_code = models.CharField(max_length=100, blank=True, editable=False)
    paystack_authorization_code = models.CharField(max_length=150, blank=True, editable=False)
    payment_email = models.EmailField(blank=True, editable=False)
    card_brand = models.CharField(max_length=40, blank=True, editable=False)
    card_last4 = models.CharField(max_length=4, blank=True, editable=False)
    authorization_reusable = models.BooleanField(default=False, editable=False)
    started_at = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    @property
    def weekly_total(self):
        return self.weekly_subtotal + self.weekly_delivery_fee

    def __str__(self):
        return self.name or f'{self.user} · weekly delivery'


class SubscriptionItem(models.Model):
    subscription = models.ForeignKey(
        Subscription, on_delete=models.CASCADE, related_name='items'
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT, related_name='subscription_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    can_substitute = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'pk']
        constraints = [
            models.UniqueConstraint(
                fields=['subscription', 'product'],
                name='unique_product_per_subscription',
            )
        ]

    @property
    def subtotal(self):
        return self.unit_price * self.quantity


class SubscriptionWeek(models.Model):
    STATUSES = [
        ('scheduled', 'Scheduled'), ('renewal_order', 'Renewal order'),
        ('payment_due', 'Payment due'),
        ('paid', 'Paid'), ('skipped', 'Skipped'), ('packing', 'Packing'),
        ('out_for_delivery', 'Out for delivery'), ('delivered', 'Delivered'),
        ('payment_failed', 'Payment failed'), ('expired', 'Expired'),
        ('cancelled', 'Cancelled'),
    ]

    subscription = models.ForeignKey(
        Subscription, on_delete=models.PROTECT, related_name='weeks'
    )
    delivery_date = models.DateField()
    cutoff_at = models.DateTimeField()
    status = models.CharField(max_length=30, choices=STATUSES, default='scheduled')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment_reference = models.CharField(max_length=100, blank=True, unique=True, null=True)
    payment_attempts = models.PositiveSmallIntegerField(default=0)
    payment_error = models.CharField(max_length=500, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    order = models.OneToOneField(
        'orders.Order', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='subscription_week',
    )
    customer_note = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['delivery_date']
        constraints = [
            models.UniqueConstraint(
                fields=['subscription', 'delivery_date'],
                name='unique_subscription_delivery_week',
            )
        ]

    @property
    def total(self):
        return self.subtotal + self.delivery_fee

    def __str__(self):
        return f'{self.subscription} · {self.delivery_date}'


class WholesaleQuote(models.Model):
    STATUSES = [
        ('draft', 'Draft'), ('submitted', 'Submitted'), ('reviewing', 'Reviewing'),
        ('quoted', 'Quoted'), ('accepted', 'Accepted'), ('declined', 'Declined'),
        ('expired', 'Expired'), ('converted', 'Converted to order'),
    ]

    business = models.ForeignKey(
        'users.B2BProfile', on_delete=models.PROTECT, related_name='quotes'
    )
    status = models.CharField(max_length=20, choices=STATUSES, default='draft')
    requested_delivery_date = models.DateField(null=True, blank=True)
    is_recurring = models.BooleanField(default=False)
    customer_note = models.TextField(blank=True)
    staff_note = models.TextField(blank=True)
    quoted_subtotal = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    converted_order = models.OneToOneField(
        'orders.Order', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='source_quote',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Quote {self.pk} · {self.business.company_name}'


class WholesaleQuoteItem(models.Model):
    quote = models.ForeignKey(
        WholesaleQuote, on_delete=models.CASCADE, related_name='items'
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT, related_name='quote_items'
    )
    quantity = models.PositiveIntegerField()
    requested_unit = models.CharField(max_length=80, blank=True)
    quoted_unit_price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    note = models.CharField(max_length=200, blank=True)

    @property
    def quoted_subtotal(self):
        if self.quoted_unit_price is None:
            return None
        return self.quoted_unit_price * self.quantity
