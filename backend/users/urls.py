from django.urls import path
from .views import (
    RegisterView, ProfileView, VerifyEmailView,
    ResendVerificationView, GoogleAuthView,
    WishlistView, WishlistItemDeleteView,
    B2BApplyView, B2BStatusView, B2BPriceListView,
    B2BSetupPasswordView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('me/', ProfileView.as_view(), name='user-profile'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend-verification'),
    path('google/', GoogleAuthView.as_view(), name='google-auth'),
    path('wishlist/', WishlistView.as_view(), name='wishlist'),
    path('wishlist/<int:pk>/', WishlistItemDeleteView.as_view(), name='wishlist-delete'),
    path('b2b/apply/', B2BApplyView.as_view(), name='b2b-apply'),
    path('b2b/status/', B2BStatusView.as_view(), name='b2b-status'),
    path('b2b/prices/', B2BPriceListView.as_view(), name='b2b-prices'),
    path('b2b/setup-password/', B2BSetupPasswordView.as_view(), name='b2b-setup-password'),
]
