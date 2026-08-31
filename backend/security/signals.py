from axes.signals import user_locked_out
from django.contrib.auth import get_user_model
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver

from .audit import record_event
from .models import AuditEvent


def _staff_target(credentials):
    identity = (
        credentials.get('email')
        or credentials.get('username')
        or credentials.get(get_user_model().USERNAME_FIELD)
        or ''
    )
    if not identity:
        return None
    return get_user_model().objects.filter(email__iexact=identity, is_staff=True).first()


@receiver(user_logged_in)
def audit_staff_login(sender, request, user, **kwargs):
    if user.is_staff:
        record_event(
            action='security.login_succeeded',
            request=request,
            actor=user,
            target=user,
            severity=AuditEvent.Severity.SENSITIVE,
        )


@receiver(user_logged_out)
def audit_staff_logout(sender, request, user, **kwargs):
    if user and user.is_staff:
        record_event(
            action='security.logout',
            request=request,
            actor=user,
            target=user,
            severity=AuditEvent.Severity.INFO,
        )


@receiver(user_login_failed)
def audit_staff_login_failure(sender, credentials, request, **kwargs):
    target = _staff_target(credentials)
    if target:
        record_event(
            action='security.login_failed',
            request=request,
            target=target,
            severity=AuditEvent.Severity.WARNING,
        )


@receiver(user_locked_out)
def audit_staff_lockout(sender, request, username=None, **kwargs):
    identity = username or (getattr(request, 'POST', {}).get('username') if request else '')
    target = (
        get_user_model()
        .objects.filter(
            email__iexact=identity or '',
            is_staff=True,
        )
        .first()
    )
    if target:
        record_event(
            action='security.login_locked',
            request=request,
            target=target,
            severity=AuditEvent.Severity.CRITICAL,
        )
