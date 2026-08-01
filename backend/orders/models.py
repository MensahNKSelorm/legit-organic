import logging

from django.db import models
from django.conf import settings
from .promo_models import PromoCode  # noqa: F401 — registers with orders app

logger = logging.getLogger(__name__)


def _send_owner_report(order_id, event):
    from .reporting import send_owner_report_once
    send_owner_report_once(order_id, event)


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


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('whatsapp_pending', 'WhatsApp Pending - Awaiting Payment'),
        ('paid', 'Paid'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders'
    )
    reference = models.CharField(max_length=100, unique=True)
    paystack_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    payment_status = models.CharField(
        max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending'
    )
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    promo_code = models.ForeignKey(
        PromoCode, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='orders',
    )
    delivery_address = models.TextField()
    guest_name = models.CharField(max_length=200, blank=True)
    guest_phone = models.CharField(max_length=20, blank=True)
    guest_email = models.CharField(max_length=255, blank=True)
    payment_report_sent_at = models.DateTimeField(null=True, blank=True, editable=False)
    delivery_report_sent_at = models.DateTimeField(null=True, blank=True, editable=False)
    payment_report_attempts = models.PositiveSmallIntegerField(default=0, editable=False)
    delivery_report_attempts = models.PositiveSmallIntegerField(default=0, editable=False)
    payment_report_error = models.CharField(max_length=500, blank=True, editable=False)
    delivery_report_error = models.CharField(max_length=500, blank=True, editable=False)
    order_source = models.CharField(
        max_length=20,
        choices=[('paystack', 'Paystack'), ('whatsapp', 'WhatsApp')],
        default='whatsapp',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def final_amount(self):
        return self.total_amount - self.discount_amount

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_status = self.status
        self.__original_payment_status = self.payment_status

    def save(self, *args, **kwargs):
        is_update = self.pk is not None
        old_status = self.__original_status
        status_changed = self.status != old_status
        payment_became_successful = (
            self.payment_status == 'success'
            and self.__original_payment_status != 'success'
        )
        super().save(*args, **kwargs)

        report_events = []
        if is_update and payment_became_successful:
            report_events.append('payment_success')
        if is_update and status_changed and self.status == 'delivered':
            report_events.append('delivered')
        for event in report_events:
            order_id = self.pk
            from django.db import transaction
            transaction.on_commit(
                lambda event=event: _send_owner_report(order_id, event)
            )

        if status_changed and self.status in [
            'paid', 'processing', 'shipped', 'delivered', 'cancelled'
        ]:
            try:
                from users.emails import send_order_status_email
                send_order_status_email(self)
            except Exception:
                pass

            try:
                from users.sms import send_order_status_sms
                send_order_status_sms(self)
            except Exception:
                pass

        if (
            is_update
            and status_changed
            and old_status != 'processing'
            and self.status == 'processing'
            and self.payment_status == 'success'
            and self.user is not None
        ):
            try:
                from sales.models import Commission, ReferredCustomer

                try:
                    referred = self.user.referral_record
                except ReferredCustomer.DoesNotExist:
                    referred = None

                if referred is not None:
                    rep = referred.sales_rep
                    completed_orders = Order.objects.filter(
                        user=self.user,
                        status='processing',
                        payment_status='success',
                    ).exclude(pk=self.pk).count()

                    if completed_orders == 0:
                        commission_type = 'first_purchase'
                        amount = self.final_amount * (
                            rep.commission_rate_first_purchase / 100
                        )
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
                            amount = self.final_amount * (
                                rep.commission_rate_repeat_purchase / 100
                            )
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
                        f'{self.user.first_name} {self.user.last_name}'.strip()
                        or self.user.email
                    )
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
