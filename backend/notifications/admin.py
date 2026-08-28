from django.contrib import admin
from .models import Notification, WebPushSubscription


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        'recipient', 'type', 'title', 'is_read', 'created_at'
    ]
    list_filter = ['type', 'is_read', 'recipient']
    search_fields = ['title', 'body', 'recipient__email']
    readonly_fields = ['created_at']
    actions = ['mark_as_read']

    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)
    mark_as_read.short_description = 'Mark selected as read'


@admin.register(WebPushSubscription)
class WebPushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'is_active', 'updated_at']
    list_filter = ['is_active']
    search_fields = ['recipient__email', 'endpoint']
    readonly_fields = ['endpoint', 'p256dh', 'auth', 'user_agent', 'created_at', 'updated_at']
