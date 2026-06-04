from rest_framework import viewsets, generics, permissions
from .models import Product, CartItem, WatchlistItem
from .serializers.serializers import ProductSerializer
from rest_framework.permissions import IsAdminUser
from django.contrib.auth.models import User
from .serializers.user_serializers import RegisterSerializer
from .serializers.cart_serializers import CartItemSerializer, WatchlistItemSerializer

# Create your views here.

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return []
        return [IsAdminUser()]


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = []


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WatchlistItemViewSet(viewsets.ModelViewSet):
    serializer_class = WatchlistItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return WatchlistItem.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)