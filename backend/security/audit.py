from .models import AuditEvent
from django.utils import timezone


def revoke_user_sessions(user, exclude_session_key=None):
    from django.contrib.sessions.models import Session
    session_keys = []
    for session in Session.objects.filter(expire_date__gt=timezone.now()):
        try:
            if str(session.get_decoded().get('_auth_user_id')) == str(user.pk):
                if session.session_key != exclude_session_key:
                    session_keys.append(session.session_key)
        except Exception:
            continue
    if session_keys:
        Session.objects.filter(session_key__in=session_keys).delete()
    return len(session_keys)


SENSITIVE_KEYS = {
    'password', 'password1', 'password2', 'new_password1', 'new_password2',
    'token', 'access', 'refresh', 'secret', 'otp', 'otp_token', 'api_key',
}


def _safe_mapping(value):
    if not isinstance(value, dict):
        return {}
    return {
        str(key): ('[REDACTED]' if str(key).lower() in SENSITIVE_KEYS else item)
        for key, item in value.items()
    }


def client_ip(request):
    if request is None:
        return None
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    return (forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR')) or None


def record_event(
    *, action, request=None, actor=None, severity=AuditEvent.Severity.INFO,
    target=None, reason='', before=None, after=None, metadata=None,
):
    actor = actor or (getattr(request, 'user', None) if request is not None else None)
    if actor is not None and not getattr(actor, 'is_authenticated', False):
        actor = None
    target_type = target_id = target_label = ''
    if target is not None:
        target_type = f'{target._meta.app_label}.{target._meta.model_name}'
        target_id = str(target.pk or '')
        target_label = str(target)[:255]
    return AuditEvent.objects.create(
        actor=actor,
        actor_email=(getattr(actor, 'email', '') or '') if actor else '',
        action=action,
        severity=severity,
        target_type=target_type,
        target_id=target_id,
        target_label=target_label,
        reason=(reason or '')[:5000],
        before=_safe_mapping(before),
        after=_safe_mapping(after),
        ip_address=client_ip(request),
        user_agent=(request.META.get('HTTP_USER_AGENT', '')[:500] if request else ''),
        metadata=_safe_mapping(metadata),
    )


def record_boolean_state_change(*, request, target, field, old_value, new_value, action):
    if old_value == new_value:
        return None
    return record_event(
        action=action, request=request, target=target,
        severity=AuditEvent.Severity.SENSITIVE,
        before={field: old_value}, after={field: new_value},
    )
