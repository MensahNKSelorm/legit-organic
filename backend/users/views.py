import secrets
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from .models import User
from .serializers import RegisterSerializer, UserSerializer
from .emails import send_welcome_email, send_verification_email


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = []

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token = secrets.token_urlsafe(32)
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save()

        try:
            send_welcome_email(user)
            send_verification_email(user, token)
        except Exception:
            pass

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class VerifyEmailView(APIView):
    permission_classes = []

    def get(self, request):
        token = request.query_params.get('token', '')
        if not token:
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email_verification_token=token)
        except User.DoesNotExist:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        user.email_verified = True
        user.email_verification_token = ''
        user.save()

        return Response({'message': 'Email verified successfully.'}, status=status.HTTP_200_OK)


class ResendVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.email_verified:
            return Response({'message': 'Email is already verified.'}, status=status.HTTP_200_OK)

        token = secrets.token_urlsafe(32)
        user.email_verification_token = token
        user.email_verification_sent_at = timezone.now()
        user.save()

        try:
            send_verification_email(user, token)
        except Exception:
            return Response(
                {'error': 'Failed to send verification email. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response({'message': 'Verification email sent.'}, status=status.HTTP_200_OK)
