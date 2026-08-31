from django.contrib.auth.models import Group
from django.db import transaction
from django.http import Http404
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.cache import never_cache
from django.views.decorators.debug import sensitive_post_parameters
from django.views.decorators.http import require_http_methods

from .forms import StaffSetupPasswordForm
from .models import StaffInvitation, User


def _secure_response(response):
    # Keep the token-bearing URL away from third parties while allowing the
    # same-origin Referer Django requires to validate HTTPS form submissions.
    response['Referrer-Policy'] = 'same-origin'
    response['X-Robots-Tag'] = 'noindex, nofollow'
    response['Cache-Control'] = 'no-store, max-age=0'
    return response


def _render_setup(request, invitation=None, form=None, state='ready', status=200):
    response = render(
        request,
        'staff/setup.html',
        {
            'invitation': invitation,
            'form': form,
            'state': state,
        },
        status=status,
    )
    return _secure_response(response)


def _current_state(invitation):
    if invitation.accepted_at:
        return 'accepted'
    if invitation.revoked_at:
        return 'revoked'
    if invitation.expires_at <= timezone.now():
        return 'expired'
    return 'ready'


@never_cache
@sensitive_post_parameters('new_password1', 'new_password2')
@require_http_methods(['GET', 'POST'])
def staff_setup(request, token):
    if len(token) < 32 or len(token) > 128:
        raise Http404

    digest = StaffInvitation.digest_token(token)
    try:
        invitation = StaffInvitation.objects.get(token_digest=digest)
    except StaffInvitation.DoesNotExist:
        return _render_setup(request, state='invalid', status=404)

    state = _current_state(invitation)
    if state != 'ready':
        return _render_setup(request, invitation=invitation, state=state, status=410)

    candidate = User(
        email=invitation.company_email,
        first_name=invitation.first_name,
        last_name=invitation.last_name,
    )
    form = StaffSetupPasswordForm(candidate, request.POST or None)
    if request.method == 'GET' or not form.is_valid():
        return _render_setup(request, invitation=invitation, form=form)

    with transaction.atomic():
        locked = StaffInvitation.objects.select_for_update().get(pk=invitation.pk)
        state = _current_state(locked)
        if state != 'ready':
            return _render_setup(request, invitation=locked, state=state, status=410)
        if User.objects.filter(email__iexact=locked.company_email).exists():
            return _render_setup(request, invitation=locked, state='account_exists', status=409)

        try:
            role = Group.objects.get(name=locked.role)
        except Group.DoesNotExist:
            return _render_setup(request, invitation=locked, state='role_unavailable', status=503)

        user = User.objects.create_user(
            email=locked.company_email,
            password=form.cleaned_data['new_password1'],
            first_name=locked.first_name,
            last_name=locked.last_name,
            is_staff=True,
            is_active=True,
            email_verified=True,
        )
        user.groups.set([role])
        locked.accepted_at = timezone.now()
        locked.save(update_fields=['accepted_at', 'updated_at'])

    return _render_setup(request, invitation=locked, state='complete')
