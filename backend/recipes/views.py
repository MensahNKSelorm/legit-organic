from rest_framework import generics
from .models import Recipe
from .serializers import RecipeListSerializer, RecipeDetailSerializer


class RecipeListView(generics.ListAPIView):
    queryset = Recipe.objects.all()
    serializer_class = RecipeListSerializer
    permission_classes = []


class RecipeDetailView(generics.RetrieveAPIView):
    queryset = Recipe.objects.all()
    serializer_class = RecipeDetailSerializer
    permission_classes = []
    lookup_field = 'slug'


class DefaultRecipesView(generics.ListAPIView):
    queryset = Recipe.objects.filter(is_default=True)
    serializer_class = RecipeListSerializer
    permission_classes = []
