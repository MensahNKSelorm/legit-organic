import logging
import secrets
import uuid
from datetime import timedelta

from django.db import models
from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from .promo_models import PromoCode  # noqa: F401 — registers with orders app

logger = logging.getLogger(__name__)


def _send_owner_report(order_id, event):
    from .reporting import send_owner_report_once

    send_owner_report_once(order_id, event)


def _send_payment_failed_email(order_id):
    try:
        from users.emails import send_order_payment_failed_email

        send_order_payment_failed_email(Order.objects.get(pk=order_id))
    except Exception:
        logger.exception('Payment failure email failed for order %s', order_id)


class Cart(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Cart — {self.user}"


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.product.name} × {self.quantity}"


class Driver(models.Model):
    VEHICLE_CHOICES = [
        ('motorbike', 'Motorbike'),
        ('car', 'Car'),
        ('van', 'Van'),
        ('truck', 'Truck'),
        ('other', 'Other'),
    ]

    name = models.CharField(max_length=160)
    phone_number = models.CharField(max_length=20)
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES, default='motorbike')
    vehicle_registration = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    internal_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f'{self.name} — {self.phone_number}'


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('whatsapp_pending', 'WhatsApp Pending - Awaiting Payment'),
        ('paid', 'Paid'),
        ('processing', 'Processing'),
        ('ready_for_dispatch', 'Ready for dispatch'),
        ('out_for_delivery', 'Out for delivery'),
        ('shipped', 'Shipped (legacy)'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
        ('expired', 'Expired'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
    )
    reference = models.CharField(max_length=100, unique=True)
    paystack_id = models.CharField(max_length=100, blank=True)
    payment_provider = models.CharField(max_length=30, blank=True)
    provider_transaction_id = models.CharField(max_length=120, blank=True)
    checkout_reference = models.CharField(max_length=120, blank=True, db_index=True)
    checkout_url = models.URLField(max_length=500, blank=True)
    checkout_expires_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    promo_code = models.ForeignKey(
        PromoCode,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='orders',
    )
    delivery_address = models.TextField()
    guest_name = models.CharField(max_length=200, blank=True)
    guest_phone = models.CharField(max_length=20, blank=True)
    guest_email = models.CharField(max_length=255, blank=True)
    submission_report_sent_at = models.DateTimeField(null=True, blank=True, editable=False)
    payment_report_sent_at = models.DateTimeField(null=True, blank=True, editable=False)
    delivery_report_sent_at = models.DateTimeField(null=True, blank=True, editable=False)
    submission_report_attempts = models.PositiveSmallIntegerField(default=0, editable=False)
    payment_report_attempts = models.PositiveSmallIntegerField(default=0, editable=False)
    delivery_report_attempts = models.PositiveSmallIntegerField(default=0, editable=False)
    submission_report_error = models.CharField(max_length=500, blank=True, editable=False)
    payment_report_error = models.CharField(max_length=500, blank=True, editable=False)
    delivery_report_error = models.CharField(max_length=500, blank=True, editable=False)
    is_test = models.BooleanField(
        default=False,
        help_text='Test orders are excluded from commercial reporting and may be deleted by the Owner.',
    )
    delivery_pin_hash = models.CharField(max_length=128, blank=True, editable=False)
    delivery_pin_expires_at = models.DateTimeField(null=True, blank=True, editable=False)
    delivery_pin_attempts = models.PositiveSmallIntegerField(default=0, editable=False)
    delivery_confirmed_at = models.DateTimeField(null=True, blank=True, editable=False)
    driver = models.ForeignKey(
        Driver,
        null=True,
        blank=True,
        on_delete=models.PROTECT,
        related_name='orders',
        limit_choices_to={'is_active': True},
    )
    dispatched_at = models.DateTimeField(null=True, blank=True, editable=False)
    driver_name_snapshot = models.CharField(max_length=160, blank=True, editable=False)
    driver_phone_snapshot = models.CharField(max_length=20, blank=True, editable=False)
    driver_vehicle_snapshot = models.CharField(max_length=80, blank=True, editable=False)
    tracking_nonce = models.UUIDField(default=uuid.uuid4, editable=False)
    order_source = models.CharField(
        max_length=20,
        choices=[
            ('seevcash', 'SeevCash'),
            ('subscription', 'Subscription renewal'),
            ('business_supply', 'Business supply renewal'),
            ('paystack', 'Paystack (legacy)'),
            ('whatsapp', 'WhatsApp'),
        ],
        default='whatsapp',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def final_amount(self):
        return self.total_amount - self.discount_amount

    ALLOWED_TRANSITIONS = {
        'pending': {'processing', 'cancelled'},
        'whatsapp_pending': {'paid', 'processing', 'cancelled'},
        'paid': {'processing', 'cancelled'},
        'processing': {'ready_for_dispatch', 'cancelled'},
        'ready_for_dispatch': {'out_for_delivery', 'processing', 'cancelled'},
        'out_for_delivery': {'delivered', 'ready_for_dispatch'},
        # Existing orders may still carry this pre-workflow state.
        'shipped': {'delivered', 'out_for_delivery'},
        'delivered': set(),
        'cancelled': set(),
    }

    def can_transition_to(self, status):
        return status == self.status or status in self.ALLOWED_TRANSITIONS.get(self.status, set())

    def issue_delivery_pin(self):
        pin = f'{secrets.randbelow(1_000_000):06d}'
        self.delivery_pin_hash = make_password(pin)
        self.delivery_pin_expires_at = timezone.now() + timedelta(hours=24)
        self.delivery_pin_attempts = 0
        self._delivery_pin_plaintext = pin
        return pin

    def prepare_dispatch(self):
        if not self.driver_id:
            raise ValueError('Assign an active driver before dispatching this order.')
        self.dispatched_at = timezone.now()
        self.driver_name_snapshot = self.driver.name
        self.driver_phone_snapshot = self.driver.phone_number
        vehicle = self.driver.get_vehicle_type_display()
        if self.driver.vehicle_registration:
            vehicle = f'{vehicle} · {self.driver.vehicle_registration}'
        self.driver_vehicle_snapshot = vehicle
        self.tracking_nonce = uuid.uuid4()

    @property
    def tracking_is_expired(self):
        if self.status == 'delivered' and self.delivery_confirmed_at:
            return timezone.now() > self.delivery_confirmed_at + timedelta(hours=24)
        if self.status == 'cancelled':
            return timezone.now() > self.updated_at + timedelta(hours=24)
        return False

    def check_delivery_pin(self, pin):
        if not self.delivery_pin_hash or not self.delivery_pin_expires_at:
            return False
        if timezone.now() > self.delivery_pin_expires_at or self.delivery_pin_attempts >= 5:
            return False
        return check_password(str(pin).strip(), self.delivery_pin_hash)

    @property
    def may_be_deleted(self):
        return self.is_test or self.payment_status in {'pending', 'failed', 'expired'}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_status = self.status
        self.__original_payment_status = self.payment_status

    def save(self, *args, **kwargs):
        is_update = self.pk is not None
        old_status = self.__original_status
        status_changed = self.status != old_status
        payment_became_successful = (
            self.payment_status == 'success' and self.__original_payment_status != 'success'
        )
        payment_became_failed = (
            self.payment_status == 'failed' and self.__original_payment_status != 'failed'
        )
        super().save(*args, **kwargs)

        if is_update and payment_became_failed:
            from django.db import transaction

            transaction.on_commit(lambda: _send_payment_failed_email(self.pk))

        if is_update and status_changed:
            try:
                cycle = self.business_supply_cycle
            except Exception:
                cycle = None
            if cycle is not None:
                cycle_status = {
                    'ready_for_dispatch': 'packing',
                    'out_for_delivery': 'out_for_delivery',
                    'shipped': 'out_for_delivery',
                    'delivered': 'delivered',
                    'cancelled': 'cancelled',
                }.get(self.status)
                if cycle_status and cycle.status != cycle_status:
                    cycle.status = cycle_status
                    cycle.save(update_fields=['status', 'updated_at'])

        report_events = []
        if is_update and payment_became_successful and not self.is_test:
            report_events.append('payment_success')
        if is_update and status_changed and self.status == 'delivered':
            report_events.append('delivered')
        for event in report_events:
            order_id = self.pk
            from django.db import transaction

            transaction.on_commit(lambda event=event: _send_owner_report(order_id, event))

        if (
            status_changed
            and not getattr(self, '_suppress_customer_notifications', False)
            and self.status
            in [
                'paid',
                'processing',
                'ready_for_dispatch',
                'out_for_delivery',
                'shipped',
                'delivered',
                'cancelled',
            ]
        ):
            from .notifications import deliver_order_status_notifications

            deliver_order_status_notifications(self)

        if (
            is_update
            and status_changed
            and old_status != 'processing'
            and self.status == 'processing'
            and self.payment_status == 'success'
            and not self.is_test
        ):
            try:
                from sales.models import Commission, ReferredCustomer

                referred = None
                if self.user is not None:
                    try:
                        referred = self.user.referral_record
                    except ReferredCustomer.DoesNotExist:
                        pass

                if referred is not None:
                    rep = referred.sales_rep
                    completed_orders = (
                        Order.objects.filter(
                            user=self.user,
                            status='processing',
                            payment_status='success',
                        )
                        .exclude(pk=self.pk)
                        .count()
                    )

                    if completed_orders == 0:
                        commission_type = 'first_purchase'
                        amount = self.final_amount * (rep.commission_rate_first_purchase / 100)
                        referred.status = 'converted'
                        referred.save(update_fields=['status'])
                        Commission.objects.create(
                            sales_rep=rep,
                            referred_customer=referred,
                            order=self,
                            type=commission_type,
                            amount=amount,
                            status='pending',
                        )
                    else:
                        from django.utils import timezone

                        if timezone.now() <= referred.commission_expires_at:
                            commission_type = 'repeat_purchase'
                            amount = self.final_amount * (rep.commission_rate_repeat_purchase / 100)
                            Commission.objects.create(
                                sales_rep=rep,
                                referred_customer=referred,
                                order=self,
                                type=commission_type,
                                amount=amount,
                                status='pending',
                            )
            except Exception as e:
                logger.error(
                    f'Commission trigger failed for order {self.reference} '
                    f'(user={self.user_id}): {e}',
                    exc_info=True,
                )

            try:
                from notifications.utils import notify_admins

                customer_name = 'Guest'
                if self.user:
                    customer_name = (
                        f'{self.user.first_name} {self.user.last_name}'.strip() or self.user.email
                    )
                elif self.guest_name:
                    customer_name = self.guest_name
                notify_admins(
                    type='order_paid',
                    title='Order paid',
                    body=f'{customer_name} completed order {self.reference} — GHS {self.final_amount}',
                    link=f'/admin/orders/order/{self.pk}/change/',
                )
            except Exception as e:
                logger.error(
                    f'order_paid notification failed for order {self.pk}: {e}',
                    exc_info=True,
                )

        self.__original_status = self.status
        self.__original_payment_status = self.payment_status

    def __str__(self):
        customer = str(self.user) if self.user else self.guest_name or 'Guest'
        return f"Order {self.reference} — {customer} ({self.status})"


class SeevCashWebhookEvent(models.Model):
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('processed', 'Processed'),
        ('ignored', 'Ignored'),
        ('failed', 'Failed'),
    ]

    event_id = models.CharField(max_length=160, unique=True)
    event_type = models.CharField(max_length=80)
    payload_hash = models.CharField(max_length=64)
    order = models.ForeignKey(
        Order,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='seevcash_webhook_events',
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    error = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f'{self.event_type} — {self.event_id}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    @property
    def subtotal(self):
        return self.unit_price * self.quantity

    def __str__(self):
        return f"{self.product.name} × {self.quantity}"


class OrderStatusEvent(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_events')
    from_status = models.CharField(max_length=20, blank=True)
    to_status = models.CharField(max_length=20)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='order_status_events',
    )
    source = models.CharField(max_length=30, default='admin')
    note = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order.reference}: {self.from_status} → {self.to_status}'


class OrderNotificationDelivery(models.Model):
    CHANNEL_CHOICES = [('email', 'Email'), ('sms', 'SMS')]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('failed', 'Failed'),
        ('skipped', 'Skipped'),
        ('superseded', 'Superseded'),
        ('exhausted', 'Retry limit reached'),
    ]

    order = models.ForeignKey(
        Order, on_delete=models.CASCADE, related_name='notification_deliveries'
    )
    event = models.CharField(max_length=30)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    attempts = models.PositiveSmallIntegerField(default=0)
    error = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [models.Index(fields=['status', 'channel', '-created_at'])]

    def __str__(self):
        return f'{self.order.reference} · {self.event} · {self.channel}: {self.status}'
