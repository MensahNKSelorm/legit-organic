from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from users.tokens import VerifiedTokenObtainPairView, ThrottledTokenRefreshView, LogoutView
from users.staff_views import staff_setup
from legitorganic.writing_assistant import writing_assistant
from django.conf.urls.static import static
from django.conf import settings
from notifications.views import admin_push_service_worker


admin.site.site_header = "Legit Organic Admin"
admin.site.site_title = "Legit Organic"
admin.site.index_title = "Content Management"


def health(request):
    return JsonResponse({'status': 'ok', 'service': 'legitorganic-api'})


urlpatterns = [
    path('admin-push-sw.js', admin_push_service_worker, name='admin-push-service-worker'),
    path('staff/setup/<str:token>/', staff_setup, name='staff-setup'),
    path('staff/security/', include('security.urls')),
    path('admin/writing-assistant/', writing_assistant, name='writing-assistant'),
    path('admin/', admin.site.urls),

    # Health check
    path('api/health/', health, name='health'),

    # JWT auth
    path('api/auth/token/', VerifiedTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', ThrottledTokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),

    # Domain apps
    path('api/users/', include('users.urls')),
    path('api/products/', include('products.urls')),
    path('api/blog/', include('blog.urls')),
    path('api/recipes/', include('recipes.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/sales/', include('sales.urls')),
    path('api/notifications/', include('notifications.urls')),
    path('api/subscriptions/', include('subscriptions.urls')),
    path('ckeditor5/', include('django_ckeditor_5.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
