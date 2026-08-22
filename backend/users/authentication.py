from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.authentication import JWTAuthentication


class CustomerJWTAuthentication(JWTAuthentication):
    """JWTs are a customer channel; staff use the MFA-protected staff session."""

    def get_user(self, validated_token):
        user = super().get_user(validated_token)
        if user.is_staff:
            raise AuthenticationFailed(
                'Staff accounts must use the secure staff portal.',
                code='staff_portal_required',
            )
        return user
