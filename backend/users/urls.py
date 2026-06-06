from django.urls import path
from .views import RegisterView, ProfileView, VerifyEmailView, ResendVerificationView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('me/', ProfileView.as_view(), name='user-profile'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
]
