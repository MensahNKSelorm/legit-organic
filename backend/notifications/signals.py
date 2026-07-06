from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender='orders.Order')
def on_order_placed(sender, instance, created, **kwargs):
    if not created:
        return
    from .utils import notify_admins
    customer_name = 'Guest'
    if instance.user:
        customer_name = (
            f'{instance.user.first_name} {instance.user.last_name}'.strip()
            or instance.user.email
        )
    elif instance.guest_name:
        customer_name = instance.guest_name
    notify_admins(
        type='order_placed',
        title='New order placed',
        body=f'{customer_name} placed order {instance.reference}',
        link=f'/admin/orders/order/{instance.pk}/change/',
    )
