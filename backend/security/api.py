from rest_framework import permissions

from .models import StaffSecurityProfile


class StaffSessionMFARequired(permissions.BasePermission):
    """Require a Django staff session that completed the current MFA challenge."""

    message = 'Verified staff session required.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated and user.is_staff):
            return False
        if request.auth is not None:
            return False
        try:
            version = user.staff_security.security_version
        except StaffSecurityProfile.DoesNotExist:
            return False
        return bool(
            request.session.get('staff_2fa_verified')
            and request.session.get('staff_security_version') == version
        )
