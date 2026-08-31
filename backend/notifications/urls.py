from django.urls import path
from . import views

urlpatterns = [
    path('', views.NotificationListView.as_view(), name='notification-list'),
    path('<int:pk>/read/', views.NotificationMarkReadView.as_view(), name='notification-mark-read'),
    path(
        'mark-all-read/',
        views.NotificationMarkAllReadView.as_view(),
        name='notification-mark-all-read',
    ),
    path('push/config/', views.PushConfigView.as_view(), name='push-config'),
    path('push/subscription/', views.PushSubscriptionView.as_view(), name='push-subscription'),
]
