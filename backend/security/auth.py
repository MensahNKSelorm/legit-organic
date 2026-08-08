from django.utils import timezone
from django_otp.plugins.otp_totp.models import TOTPDevice

from .models import StaffSecurityProfile


def verify_staff_code(user, supplied, allow_recovery=True):
    code = ''.join((supplied or '').split()).upper()
    if not code:
        return False, False
    for device in TOTPDevice.objects.filter(user=user, confirmed=True):
        if device.verify_token(code):
            return True, False
    if allow_recovery:
        profile, _ = StaffSecurityProfile.objects.get_or_create(user=user)
        for recovery in profile.recovery_codes.filter(used_at__isnull=True):
            if recovery.matches(code):
                recovery.used_at = timezone.now()
                recovery.save(update_fields=['used_at'])
                return True, True
    return False, False
