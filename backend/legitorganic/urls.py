from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf.urls.static import static
from django.conf import settings


admin.site.site_header = "Legit Organic Admin"
admin.site.site_title = "Legit Organic"
admin.site.index_title = "Content Management"


def health(request):
    return JsonResponse({'status': 'ok', 'service': 'legitorganic-api'})


urlpatterns = [
    path('admin/', admin.site.urls),

    # Health check
    path('api/health/', health, name='health'),

    # JWT auth
    path('api/auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Domain apps
    path('api/users/', include('users.urls')),
    path('api/products/', include('products.urls')),
    path('api/blog/', include('blog.urls')),
    path('api/recipes/', include('recipes.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/sales/', include('sales.urls')),
    path('ckeditor5/', include('django_ckeditor_5.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
