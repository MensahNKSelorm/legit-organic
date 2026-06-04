from rest_framework import viewsets, permissions
from .models import Recipe
from .serializers import RecipeSerializer, RecipeDetailSerializer


class RecipeViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecipeSerializer

    def get_queryset(self):
        qs = Recipe.objects.all()
        is_default = self.request.query_params.get('default')
        if is_default:
            qs = qs.filter(is_default=True)
        return qs

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RecipeDetailSerializer
        return RecipeSerializer
