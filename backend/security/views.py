import base64
import hashlib
from io import BytesIO
import secrets

import qrcode
from django.apps import apps
from django.contrib.auth.decorators import login_required
from django.http import HttpResponseForbidden
from django.contrib.auth import get_user_model
from django.shortcuts import redirect, render
from django.utils import timezone
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.cache import never_cache
from django.views.decorators.debug import sensitive_post_parameters
from django.views.decorators.http import require_http_methods
from django_otp import login as otp_login
from django_otp.plugins.otp_totp.models import TOTPDevice

from .audit import record_event, revoke_user_sessions
from .auth import verify_staff_code
from .models import AuditEvent, RecoveryCode, StaffSecurityProfile


PERMANENT_DELETE_ALLOWLIST = {
    ('blog', 'blogpost'),
    ('recipes', 'recipe'),
}


def _staff_only(request):
    if not request.user.is_staff:
        return HttpResponseForbidden('Staff access required.')
    return None


def _secure(response):
    response['Cache-Control'] = 'no-store, max-age=0'
    response['X-Robots-Tag'] = 'noindex, nofollow'
    response['Referrer-Policy'] = 'same-origin'
    return response


def _safe_next(request):
    candidate = request.GET.get('next') or request.POST.get('next') or '/admin/'
    if url_has_allowed_host_and_scheme(
        candidate,
        allowed_hosts={request.get_host()},
        require_https=request.is_secure(),
    ):
        return candidate
    return '/admin/'


def _qr_data_uri(device):
    image = qrcode.make(device.config_url)
    stream = BytesIO()
    image.save(stream, format='PNG')
    return 'data:image/png;base64,' + base64.b64encode(stream.getvalue()).decode('ascii')


def _new_recovery_codes(profile):
    codes = [f'{secrets.token_hex(3).upper()}-{secrets.token_hex(3).upper()}' for _ in range(10)]
    profile.recovery_codes.all().delete()
    rows = []
    for code in codes:
        row = RecoveryCode(profile=profile)
        row.set_code(code)
        rows.append(row)
    RecoveryCode.objects.bulk_create(rows)
    profile.recovery_codes_generated_at = timezone.now()
    profile.save(update_fields=['recovery_codes_generated_at', 'updated_at'])
    return codes


@never_cache
@sensitive_post_parameters('token', 'current_password')
@login_required
@require_http_methods(['GET', 'POST'])
def security_setup(request):
    denied = _staff_only(request)
    if denied:
        return denied

    profile, _ = StaffSecurityProfile.objects.get_or_create(user=request.user)
    confirmed = TOTPDevice.objects.filter(user=request.user, confirmed=True).first()
    if confirmed:
        error = ''
        if request.method == 'POST' and request.POST.get('action') == 'regenerate':
            password_ok = request.user.check_password(request.POST.get('current_password') or '')
            verified, recovery_used = verify_staff_code(
                request.user, request.POST.get('otp_token') or '', allow_recovery=False,
            )
            if password_ok and verified:
                codes = _new_recovery_codes(profile)
                profile.security_version += 1
                profile.save(update_fields=['security_version', 'updated_at'])
                revoked = revoke_user_sessions(
                    request.user, exclude_session_key=request.session.session_key,
                )
                request.session['staff_security_version'] = profile.security_version
                record_event(
                    action='security.recovery_codes_regenerated', request=request,
                    severity=AuditEvent.Severity.CRITICAL, target=request.user,
                    metadata={'sessions_revoked': revoked},
                )
                return _secure(render(request, 'security/setup.html', {
                    'state': 'recovery', 'profile': profile, 'recovery_codes': codes,
                }))
            error = 'Your password or authenticator code was not accepted.'
        return _secure(render(request, 'security/setup.html', {
            'state': 'active', 'profile': profile, 'error': error,
        }))

    device = TOTPDevice.objects.filter(user=request.user, confirmed=False).first()
    if device is None:
        device = TOTPDevice.objects.create(
            user=request.user, name='Legit Organic authenticator', confirmed=False,
        )

    error = ''
    if request.method == 'POST':
        token = ''.join((request.POST.get('token') or '').split())
        password_ok = request.user.check_password(
            request.POST.get('current_password') or ''
        )
        if password_ok and device.verify_token(token):
            device.confirmed = True
            device.save(update_fields=['confirmed'])
            profile.enrolled_at = timezone.now()
            profile.security_version += 1
            profile.save(update_fields=['enrolled_at', 'security_version', 'updated_at'])
            recovery_codes = _new_recovery_codes(profile)
            otp_login(request, device)
            request.session['staff_2fa_verified'] = True
            request.session['staff_security_version'] = profile.security_version
            request.session['staff_2fa_verified_at'] = int(timezone.now().timestamp())
            record_event(
                action='security.2fa_enrolled', request=request,
                severity=AuditEvent.Severity.SENSITIVE, target=request.user,
            )
            return _secure(render(request, 'security/setup.html', {
                'state': 'recovery', 'profile': profile, 'recovery_codes': recovery_codes,
            }))
        error = 'Your password or authenticator code was not accepted.'

    return _secure(render(request, 'security/setup.html', {
        'state': 'setup', 'profile': profile, 'device': device,
        'qr_data_uri': _qr_data_uri(device), 'error': error,
    }))


@never_cache
@sensitive_post_parameters('token')
@login_required
@require_http_methods(['GET', 'POST'])
def security_verify(request):
    denied = _staff_only(request)
    if denied:
        return denied
    profile, _ = StaffSecurityProfile.objects.get_or_create(user=request.user)
    error = ''
    if request.method == 'POST':
        supplied = ''.join((request.POST.get('token') or '').split()).upper()
        verified, recovery_used = verify_staff_code(request.user, supplied)
        if verified:
            now = int(timezone.now().timestamp())
            request.session['staff_2fa_verified'] = True
            request.session['staff_security_version'] = profile.security_version
            request.session['staff_2fa_verified_at'] = now
            record_event(
                action='security.2fa_verified', request=request,
                severity=AuditEvent.Severity.SENSITIVE, target=request.user,
                metadata={'recovery_code': recovery_used},
            )
            return redirect(_safe_next(request))
        error = 'The authenticator or recovery code was not accepted.'
        record_event(
            action='security.2fa_failed', request=request,
            severity=AuditEvent.Severity.WARNING, target=request.user,
        )
    return _secure(render(request, 'security/verify.html', {
        'error': error, 'next': _safe_next(request),
    }))


@never_cache
@sensitive_post_parameters('current_password', 'otp_token')
@login_required
@require_http_methods(['GET', 'POST'])
def security_reset_staff(request, user_id):
    if not request.user.is_superuser:
        return HttpResponseForbidden('Owner access required.')
    target = get_user_model().objects.filter(pk=user_id, is_staff=True).first()
    if target is None:
        return HttpResponseForbidden('Staff account not found.')
    error = ''
    if request.method == 'POST':
        reason = (request.POST.get('reason') or '').strip()
        password_ok = request.user.check_password(request.POST.get('current_password') or '')
        verified, recovery_used = verify_staff_code(
            request.user, request.POST.get('otp_token') or '', allow_recovery=False,
        )
        if not reason:
            error = 'A reason is required.'
        elif not (password_ok and verified):
            error = 'Your password or authenticator code was not accepted.'
        else:
            TOTPDevice.objects.filter(user=target).delete()
            profile, _ = StaffSecurityProfile.objects.get_or_create(user=target)
            profile.recovery_codes.all().delete()
            profile.enrolled_at = None
            profile.recovery_codes_generated_at = None
            profile.security_version += 1
            profile.save(update_fields=[
                'enrolled_at', 'recovery_codes_generated_at',
                'security_version', 'updated_at',
            ])
            revoked = revoke_user_sessions(target)
            record_event(
                action='security.2fa_reset', request=request,
                severity=AuditEvent.Severity.CRITICAL, target=target,
                reason=reason, metadata={
                    'sessions_revoked': revoked, 'recovery_code_used': recovery_used,
                },
            )
            return _secure(render(request, 'security/reset.html', {
                'target': target, 'complete': True,
            }))
    return _secure(render(request, 'security/reset.html', {
        'target': target, 'error': error, 'complete': False,
    }))


def _owner_reauthenticated(request):
    password_ok = request.user.check_password(request.POST.get('current_password') or '')
    verified, recovery_used = verify_staff_code(
        request.user, request.POST.get('otp_token') or ''
    )
    return password_ok and verified, recovery_used


@never_cache
@sensitive_post_parameters('current_password', 'otp_token')
@login_required
@require_http_methods(['GET', 'POST'])
def exceptional_delete(request, app_label, model_name, object_id):
    if not request.user.is_superuser:
        return HttpResponseForbidden('Owner access required.')
    model_key = (app_label.lower(), model_name.lower())
    if model_key not in PERMANENT_DELETE_ALLOWLIST:
        return HttpResponseForbidden('This record type cannot be permanently deleted.')
    model = apps.get_model(*model_key)
    target = model.objects.filter(pk=object_id).first()
    if target is None:
        return HttpResponseForbidden('Record not found.')

    error = ''
    if request.method == 'POST':
        reason = (request.POST.get('reason') or '').strip()
        authenticated, recovery_used = _owner_reauthenticated(request)
        if not reason:
            error = 'A reason is required.'
        elif not authenticated:
            error = 'Your password or authenticator code was not accepted.'
        else:
            snapshot = {
                'target_type': f'{app_label}.{model_name}',
                'target_id': str(target.pk),
                'target_label': str(target)[:255],
            }
            target.delete()
            record_event(
                action='content.permanently_deleted', request=request,
                severity=AuditEvent.Severity.CRITICAL, reason=reason,
                before=snapshot, after={'deleted': True},
                metadata={'recovery_code_used': recovery_used},
            )
            return _secure(render(request, 'security/destructive_action.html', {
                'complete': True, 'action_name': 'Permanent deletion',
                'target_label': snapshot['target_label'],
            }))
    return _secure(render(request, 'security/destructive_action.html', {
        'complete': False, 'action_name': 'Permanently delete',
        'target_label': str(target), 'error': error,
        'warning': 'This cannot be undone. Publishing controls should normally be used instead.',
    }))


@never_cache
@sensitive_post_parameters('current_password', 'otp_token')
@login_required
@require_http_methods(['GET', 'POST'])
def anonymize_customer(request, user_id):
    if not request.user.is_superuser:
        return HttpResponseForbidden('Owner access required.')
    customer = get_user_model().objects.filter(
        pk=user_id, is_staff=False, is_superuser=False,
    ).first()
    if customer is None:
        return HttpResponseForbidden('Customer account not found.')

    error = ''
    if request.method == 'POST':
        reason = (request.POST.get('reason') or '').strip()
        authenticated, recovery_used = _owner_reauthenticated(request)
        if not reason:
            error = 'A reason is required.'
        elif not authenticated:
            error = 'Your password or authenticator code was not accepted.'
        else:
            original_email = customer.email
            before = {
                'email_fingerprint': hashlib.sha256(
                    original_email.strip().lower().encode('utf-8')
                ).hexdigest()[:16],
                'had_name': bool(customer.first_name or customer.last_name),
                'had_phone_number': bool(customer.phone_number),
                'had_delivery_address': bool(
                    customer.street_address or customer.house_number
                    or customer.city or customer.delivery_region
                ),
            }
            if customer.avatar:
                customer.avatar.delete(save=False)
            customer.email = f'deleted-{customer.pk}-{secrets.token_hex(4)}@anonymized.invalid'
            customer.first_name = 'Deleted'
            customer.last_name = 'Customer'
            customer.phone_number = ''
            customer.street_address = ''
            customer.house_number = ''
            customer.city = ''
            customer.delivery_region = ''
            customer.avatar = None
            customer.email_verified = False
            customer.email_verification_token = ''
            customer.email_verification_sent_at = None
            customer.is_active = False
            customer.set_unusable_password()
            customer.save()
            anonymized_orders = customer.orders.update(
                delivery_address='[Anonymized]', guest_name='',
                guest_phone='', guest_email='',
            )
            revoke_user_sessions(customer)
            record_event(
                action='customer.anonymized', request=request, target=customer,
                severity=AuditEvent.Severity.CRITICAL, reason=reason,
                before=before,
                after={'email': customer.email, 'is_active': False},
                metadata={
                    'recovery_code_used': recovery_used,
                    'orders_anonymized': anonymized_orders,
                },
            )
            return _secure(render(request, 'security/destructive_action.html', {
                'complete': True, 'action_name': 'Customer anonymisation',
                'target_label': original_email,
            }))
    return _secure(render(request, 'security/destructive_action.html', {
        'complete': False, 'action_name': 'Anonymise customer',
        'target_label': customer.email, 'error': error,
        'warning': 'Personal account details will be erased. Historical orders remain for business records.',
    }))
