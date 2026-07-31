"""Login token issuance with an email-verification gate.

Non-staff accounts must have a verified email before they can obtain a JWT.
Staff accounts are never gated, so admins can always sign in.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class VerifiedTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # super().validate authenticates the credentials and sets self.user.
        data = super().validate(attrs)
        user = self.user
        if not user.is_staff and not getattr(user, 'email_verified', False):
            raise serializers.ValidationError(
                {
                    'detail': (
                        'Please verify your email address before logging in. '
                        'Check your inbox for the verification link.'
                    ),
                    'code': 'email_not_verified',
                }
            )
        return data


class VerifiedTokenObtainPairView(TokenObtainPairView):
    serializer_class = VerifiedTokenObtainPairSerializer
    throttle_scope = 'login'
