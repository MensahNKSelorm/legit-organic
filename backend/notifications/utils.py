from django.contrib.auth import get_user_model

User = get_user_model()


def notify_admins(type, title, body, link=''):
    from .models import Notification
    admins = User.objects.filter(is_staff=True)
    Notification.objects.bulk_create([
        Notification(
            recipient=admin,
            type=type,
            title=title,
            body=body,
            link=link,
        )
        for admin in admins
    ])
