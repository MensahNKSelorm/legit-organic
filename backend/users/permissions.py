from rest_framework import permissions


def is_approved_business(user):
    if not user or not user.is_authenticated:
        return False
    try:
        return user.b2b_profile.status == 'approved'
    except Exception:
        return False


class NotApprovedBusiness(permissions.BasePermission):
    message = 'Use your business supply workspace for orders and deliveries.'

    def has_permission(self, request, view):
        return not is_approved_business(request.user)
