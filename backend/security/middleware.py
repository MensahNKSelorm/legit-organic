from django.conf import settings
from django.contrib.auth import logout
from django.shortcuts import redirect
from django.urls import reverse
from django.utils import timezone
from django.utils.http import urlencode

from .audit import record_event
from .models import AuditEvent, StaffSecurityProfile


class StaffSecurityMiddleware:
    """Staff-only session expiry and optional second-factor enforcement."""

    EXEMPT_PREFIXES = (
        '/admin/login/',
        '/admin/logout/',
        '/staff/security/',
        '/staff/setup/',
        '/static/',
        '/media/',
    )

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, 'user', None)
        if user and user.is_authenticated and user.is_staff:
            response = self._check_staff_session(request)
            if response is not None:
                return response
        return self.get_response(request)

    def _check_staff_session(self, request):
        now = int(timezone.now().timestamp())
        started = request.session.setdefault('staff_session_started_at', now)
        last_seen = request.session.setdefault('staff_session_last_seen_at', now)
        idle = settings.STAFF_IDLE_TIMEOUT_SECONDS
        absolute = settings.STAFF_ABSOLUTE_SESSION_SECONDS
        if now - last_seen > idle or now - started > absolute:
            record_event(
                action='security.session_expired',
                request=request,
                severity=AuditEvent.Severity.SENSITIVE,
                target=request.user,
                metadata={'cause': 'idle' if now - last_seen > idle else 'absolute'},
            )
            logout(request)
            return redirect(f"{reverse('admin:login')}?{urlencode({'next': request.path})}")
        request.session['staff_session_last_seen_at'] = now

        if not request.path.startswith('/admin/') or request.path.startswith(self.EXEMPT_PREFIXES):
            return None
        profile, _ = StaffSecurityProfile.objects.get_or_create(user=request.user)
        has_device = request.user.totpdevice_set.filter(confirmed=True).exists()
        if settings.STAFF_2FA_MODE == 'enroll':
            if settings.STAFF_OWNER_2FA_REQUIRED and request.user.is_superuser and not has_device:
                return redirect('staff-security:setup')
            return None
        if not has_device:
            return redirect('staff-security:setup')
        verified = request.session.get('staff_2fa_verified')
        correct_version = request.session.get('staff_security_version') == profile.security_version
        if not (verified and correct_version):
            return redirect(
                f"{reverse('staff-security:verify')}?{urlencode({'next': request.get_full_path()})}"
            )
        return None
