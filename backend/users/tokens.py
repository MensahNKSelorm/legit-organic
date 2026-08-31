"""Login token issuance with an email-verification gate.

Only verified customer accounts can obtain a JWT. Staff use the separate,
MFA-protected Django session in the staff portal.
"""

from rest_framework import serializers
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView


def _request_origin_allowed(request):
    """Protect cookie-backed auth actions from cross-origin request forgery."""
    from django.conf import settings

    origin = request.headers.get('Origin')
    if not origin:
        return True
    allowed = set(settings.CORS_ALLOWED_ORIGINS) | set(settings.CSRF_TRUSTED_ORIGINS)
    return origin.rstrip('/') in {value.rstrip('/') for value in allowed}


class VerifiedTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # super().validate authenticates the credentials and sets self.user.
        data = super().validate(attrs)
        user = self.user
        if user.is_staff:
            raise serializers.ValidationError(
                {
                    'detail': 'Staff accounts must sign in through the secure staff portal.',
                    'code': 'staff_portal_required',
                }
            )
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

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        refresh = response.data.pop('refresh', None) if response.status_code == 200 else None
        if refresh:
            set_refresh_cookie(response, refresh)
        return response


class ThrottledTokenRefreshView(TokenRefreshView):
    throttle_scope = 'token_refresh'

    def post(self, request, *args, **kwargs):
        if not _request_origin_allowed(request):
            return Response({'detail': 'Origin is not allowed.'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        if not data.get('refresh'):
            data['refresh'] = request.COOKIES.get('refresh_token', '')
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        refresh = response.data.pop('refresh', None)
        if refresh:
            set_refresh_cookie(response, refresh)
        return response


def set_refresh_cookie(response, token):
    from django.conf import settings

    response.set_cookie(
        'refresh_token',
        token,
        max_age=24 * 60 * 60,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        path='/api/auth/',
    )


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'token_refresh'

    def post(self, request):
        if not _request_origin_allowed(request):
            return Response({'detail': 'Origin is not allowed.'}, status=status.HTTP_403_FORBIDDEN)
        token = request.COOKIES.get('refresh_token')
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass
        response = Response(status=status.HTTP_204_NO_CONTENT)
        response.delete_cookie('refresh_token', path='/api/auth/', samesite='Lax')
        return response
