from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Notification, WebPushSubscription
from .serializers import NotificationSerializer


class NotificationListView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {'error': 'Staff access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        queryset = Notification.objects.filter(
            recipient=request.user,
        ).order_by('-created_at')
        unread_count = queryset.filter(is_read=False).count()

        return Response(
            {
                'unread_count': unread_count,
                'results': NotificationSerializer(queryset[:50], many=True).data,
            }
        )


class NotificationMarkReadView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        if not request.user.is_staff:
            return Response(
                {'error': 'Staff access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        notification = get_object_or_404(
            Notification,
            pk=pk,
            recipient=request.user,
        )
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data)


class NotificationMarkAllReadView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            return Response(
                {'error': 'Staff access required'},
                status=status.HTTP_403_FORBIDDEN,
            )

        marked = Notification.objects.filter(
            recipient=request.user,
            is_read=False,
        ).update(is_read=True)
        return Response({'marked': marked})


class PushConfigView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Staff access required'}, status=403)
        return Response(
            {
                'enabled': bool(
                    settings.WEB_PUSH_VAPID_PUBLIC_KEY and settings.WEB_PUSH_VAPID_PRIVATE_KEY
                ),
                'public_key': settings.WEB_PUSH_VAPID_PUBLIC_KEY,
            }
        )


class PushSubscriptionView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Staff access required'}, status=403)
        endpoint = request.data.get('endpoint', '')
        keys = request.data.get('keys') or {}
        if not endpoint or not keys.get('p256dh') or not keys.get('auth'):
            return Response({'error': 'Invalid push subscription'}, status=400)
        subscription, _ = WebPushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                'recipient': request.user,
                'p256dh': keys['p256dh'],
                'auth': keys['auth'],
                'user_agent': request.headers.get('User-Agent', '')[:500],
                'is_active': True,
            },
        )
        return Response({'subscribed': True, 'id': subscription.pk})

    def delete(self, request):
        if not request.user.is_staff:
            return Response({'error': 'Staff access required'}, status=403)
        endpoint = request.data.get('endpoint', '')
        updated = WebPushSubscription.objects.filter(
            endpoint=endpoint,
            recipient=request.user,
        ).update(is_active=False)
        return Response({'unsubscribed': bool(updated)})


def admin_push_service_worker(request):
    script = """
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || 'Legit Organic', {
    body: data.body || 'A new order update is ready.',
    icon: 'https://legitorganic.com/icons/icon-192.png',
    badge: 'https://legitorganic.com/icons/icon-192.png',
    tag: data.tag || 'legitorganic-order',
    data: { url: data.url || '/admin/' }
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/admin/'));
});
"""
    response = HttpResponse(script, content_type='application/javascript')
    response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response
