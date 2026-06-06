from django.urls import path
from .views import RegisterView, ProfileView, VerifyEmailView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('me/', ProfileView.as_view(), name='user-profile'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
]
