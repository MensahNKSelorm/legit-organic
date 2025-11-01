from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FarmViewSet, CertificationViewSet, ProductViewSet, BlogPostViewSet, ContactMessageViewSet


router = DefaultRouter()
router.register(r'farms', FarmViewSet)
router.register(r'certifications', CertificationViewSet)
router.register(r'products', ProductViewSet)
router.register(r'blogs', BlogPostViewSet)
router.register(r'contacts', ContactMessageViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
