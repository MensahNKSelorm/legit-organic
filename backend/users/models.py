from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.exceptions import ValidationError
from django.core.files.storage import FileSystemStorage
from django.db import models
from django.utils import timezone

import hashlib
import secrets
from datetime import timedelta


class PrivateB2BStorage(FileSystemStorage):
    def __init__(self, *args, **kwargs):
        kwargs.setdefault(
            'location',
            getattr(settings, 'PRIVATE_B2B_ROOT', settings.BASE_DIR / 'private_media' / 'b2b'),
        )
        kwargs.setdefault('base_url', None)
        super().__init__(*args, **kwargs)


private_b2b_storage = PrivateB2BStorage()


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email address is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        if not extra_fields.get('is_staff'):
            raise ValueError('Superuser must have is_staff=True.')
        if not extra_fields.get('is_superuser'):
            raise ValueError('Superuser must have is_superuser=True.')
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20, blank=True)
    street_address = models.CharField(max_length=255, blank=True)
    house_number = models.CharField(max_length=50, blank=True)
    city = models.CharField(max_length=100, blank=True)
    delivery_region = models.CharField(max_length=100, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=100, blank=True)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = UserManager()

    def __str__(self):
        return self.email


class Customer(User):
    class Meta:
        proxy = True
        verbose_name = 'Customer'
        verbose_name_plural = 'Customers'


class Staff(User):
    class Meta:
        proxy = True
        verbose_name = 'Staff account'
        verbose_name_plural = 'Staff accounts'


class StaffInvitation(models.Model):
    ROLE_CHOICES = [
        ('Executive Admin', 'Executive Admin'),
        ('Operations', 'Operations'),
        ('Finance', 'Finance'),
        ('Sales & Marketing', 'Sales & Marketing'),
        ('Product Manager', 'Product Manager'),
        ('Content Team', 'Content Team'),
    ]
    DELIVERY_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Delivery failed'),
    ]

    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    company_email = models.EmailField()
    delivery_email = models.EmailField(
        help_text='Personal address used only to deliver the setup link.'
    )
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    token_digest = models.CharField(max_length=64, unique=True, editable=False)
    expires_at = models.DateTimeField(editable=False)
    accepted_at = models.DateTimeField(null=True, blank=True, editable=False)
    revoked_at = models.DateTimeField(null=True, blank=True, editable=False)
    delivery_status = models.CharField(
        max_length=20, choices=DELIVERY_CHOICES, default='pending', editable=False
    )
    delivery_error = models.CharField(max_length=500, blank=True, editable=False)
    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='staff_invitations_sent',
        editable=False,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        permissions = [
            ('resend_staffinvitation', 'Can resend staff invitation'),
            ('revoke_staffinvitation', 'Can revoke staff invitation'),
        ]

    def __str__(self):
        return f'{self.company_email} — {self.role}'

    @property
    def status(self):
        if self.accepted_at:
            return 'accepted'
        if self.revoked_at:
            return 'revoked'
        if self.expires_at and self.expires_at <= timezone.now():
            return 'expired'
        if self.delivery_status == 'failed':
            return 'delivery_failed'
        return 'pending'

    def clean(self):
        super().clean()
        self.company_email = self.company_email.strip().lower()
        self.delivery_email = self.delivery_email.strip().lower()
        if not self.company_email.endswith('@legitorganic.com'):
            raise ValidationError({
                'company_email': 'Staff login addresses must end in @legitorganic.com.'
            })
        if User.objects.filter(email__iexact=self.company_email).exists():
            raise ValidationError({
                'company_email': 'An account already uses this company email.'
            })
        duplicate = StaffInvitation.objects.filter(
            company_email__iexact=self.company_email,
            accepted_at__isnull=True,
            revoked_at__isnull=True,
            expires_at__gt=timezone.now(),
        )
        if self.pk:
            duplicate = duplicate.exclude(pk=self.pk)
        if duplicate.exists():
            raise ValidationError({
                'company_email': 'A pending invitation already exists for this address.'
            })

    def issue_token(self):
        token = secrets.token_urlsafe(32)
        self.token_digest = self.digest_token(token)
        self.expires_at = timezone.now() + timedelta(hours=48)
        self.revoked_at = None
        self.delivery_status = 'pending'
        self.delivery_error = ''
        return token

    @staticmethod
    def digest_token(token):
        return hashlib.sha256(token.encode('utf-8')).hexdigest()


class BusinessPriceList(models.Model):
    name = models.CharField(max_length=120, unique=True)
    description = models.CharField(max_length=200, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_default', 'name']

    def __str__(self):
        return self.name


class BusinessPrice(models.Model):
    price_list = models.ForeignKey(
        BusinessPriceList, on_delete=models.CASCADE, related_name='prices'
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.PROTECT, related_name='business_prices'
    )
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    minimum_quantity = models.PositiveIntegerField(default=1)
    is_available = models.BooleanField(default=True)

    class Meta:
        ordering = ['product__name']
        constraints = [
            models.UniqueConstraint(
                fields=['price_list', 'product'], name='unique_business_product_price'
            )
        ]

    def __str__(self):
        return f'{self.price_list} · {self.product}'


class B2BProfile(models.Model):
    REGISTRATION_STATUS_CHOICES = [
        ('registered', 'Registered business or organisation'),
        ('informal', 'Informal / owner-operated business'),
    ]
    BUSINESS_TYPE_CHOICES = [
        ('restaurant', 'Restaurant'),
        ('school', 'School / University'),
        ('hotel', 'Hotel / Hospitality'),
        ('catering', 'Catering Company'),
        ('supermarket', 'Supermarket / Retail'),
        ('market_trader', 'Market trader / produce retailer'),
        ('food_vendor', 'Food vendor / chop bar'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Submitted'),
        ('under_review', 'Under review'),
        ('changes_requested', 'More information required'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('suspended', 'Suspended'),
    ]
    LEGAL_STRUCTURE_CHOICES = [
        ('business_name', 'Business name / sole proprietor'),
        ('partnership', 'Partnership'),
        ('limited_shares', 'Company limited by shares'),
        ('limited_guarantee', 'Company limited by guarantee / NGO'),
        ('public_institution', 'Public institution / MDA / MMDA'),
        ('cooperative', 'Cooperative'),
        ('foreign_mission', 'Foreign mission / external organisation'),
        ('other', 'Other'),
        ('informal_operator', 'Informal / owner-operated business'),
    ]
    DOCUMENT_TYPE_CHOICES = [
        ('orc_certificate', 'ORC registration or incorporation certificate'),
        ('introductory_letter', 'Official introductory or authorisation letter'),
        ('ghana_card', 'Ghana Card'),
        ('drivers_licence', 'Ghanaian driver’s licence'),
        ('passport', 'Passport'),
        ('trade_association_letter', 'Trade or market association letter'),
        ('operating_site_evidence', 'Evidence of operating location'),
    ]
    ORDER_FREQUENCY_CHOICES = [
        ('weekly', 'Weekly'), ('fortnightly', 'Every two weeks'),
        ('monthly', 'Monthly'), ('ad_hoc', 'As needed'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='b2b_profile',
        null=True,
        blank=True,
    )
    company_name = models.CharField(max_length=200)
    registration_status = models.CharField(
        max_length=20, choices=REGISTRATION_STATUS_CHOICES, default='registered'
    )
    trading_name = models.CharField(max_length=200, blank=True)
    legal_structure = models.CharField(max_length=40, choices=LEGAL_STRUCTURE_CHOICES, default='business_name')
    business_type = models.CharField(max_length=50, choices=BUSINESS_TYPE_CHOICES)
    sector = models.CharField(max_length=120, blank=True)
    year_started = models.PositiveSmallIntegerField(null=True, blank=True)
    website = models.URLField(blank=True)
    contact_person = models.CharField(max_length=150)
    business_phone = models.CharField(max_length=20)
    business_email = models.EmailField()
    business_address = models.TextField()
    business_registration = models.CharField(max_length=100, blank=True)
    organization_tin = models.CharField(max_length=50, blank=True)
    verification_document_type = models.CharField(max_length=30, choices=DOCUMENT_TYPE_CHOICES, blank=True)
    verification_document = models.FileField(storage=private_b2b_storage, upload_to='%Y/%m/', blank=True)
    registration_exemption_reason = models.TextField(blank=True)
    contact_job_title = models.CharField(max_length=120, blank=True)
    alternative_phone = models.CharField(max_length=20, blank=True)
    delivery_region = models.CharField(max_length=100, blank=True)
    delivery_city = models.CharField(max_length=100, blank=True)
    delivery_district = models.CharField(max_length=120, blank=True)
    delivery_locality = models.CharField(max_length=150, blank=True)
    delivery_street = models.CharField(max_length=200, blank=True)
    ghana_post_gps = models.CharField(max_length=20, blank=True)
    delivery_landmark = models.CharField(max_length=200, blank=True)
    delivery_directions = models.TextField(blank=True)
    receiving_contact_name = models.CharField(max_length=150, blank=True)
    receiving_contact_phone = models.CharField(max_length=20, blank=True)
    receiving_hours = models.CharField(max_length=200, blank=True)
    delivery_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    delivery_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    access_restrictions = models.TextField(blank=True)
    produce_categories = models.JSONField(default=list, blank=True)
    order_frequency = models.CharField(max_length=20, choices=ORDER_FREQUENCY_CHOICES, blank=True)
    preferred_start_date = models.DateField(null=True, blank=True)
    purchase_order_required = models.BooleanField(default=False)
    invoice_requirements = models.CharField(max_length=250, blank=True)
    procurement_notes = models.TextField(blank=True)
    applicant_authorized = models.BooleanField(default=False)
    information_confirmed = models.BooleanField(default=False)
    privacy_acknowledged = models.BooleanField(default=False)
    estimated_monthly_order = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    price_list = models.ForeignKey(
        BusinessPriceList,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='businesses',
    )
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_b2b_reviews', limit_choices_to={'is_staff': True},
    )
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'B2B Profile'
        verbose_name_plural = 'B2B Profiles'

    def __str__(self):
        identifier = self.user.email if self.user else self.business_email
        return f'{self.company_name} ({identifier})'


class B2BReviewEvent(models.Model):
    profile = models.ForeignKey(B2BProfile, on_delete=models.PROTECT, related_name='review_events')
    from_status = models.CharField(max_length=30, blank=True)
    to_status = models.CharField(max_length=30)
    note = models.TextField()
    reviewer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='b2b_review_events'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.profile.company_name} · {self.to_status}'


class WishlistItem(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='wishlist',
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='wishlisted_by',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'product']
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.email} — {self.product.name}'
