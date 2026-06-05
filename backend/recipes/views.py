from decimal import Decimal, InvalidOperation
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Recipe, UserRecipe, UserRecipeIngredient
from .serializers import (
    RecipeListSerializer,
    RecipeDetailWithPairingsSerializer,
    UserRecipeSerializer,
    CreateUserRecipeSerializer,
)


class RecipeListView(generics.ListAPIView):
    queryset = Recipe.objects.all()
    serializer_class = RecipeListSerializer
    permission_classes = []


class RecipeDetailView(generics.RetrieveAPIView):
    queryset = Recipe.objects.prefetch_related('ingredients__product', 'steps', 'pairings__suggested_recipe')
    serializer_class = RecipeDetailWithPairingsSerializer
    permission_classes = []
    lookup_field = 'slug'


class DefaultRecipesView(generics.ListAPIView):
    queryset = Recipe.objects.filter(is_default=True)
    serializer_class = RecipeListSerializer
    permission_classes = []


class UserRecipeListView(generics.ListAPIView):
    serializer_class = UserRecipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            UserRecipe.objects
            .filter(user=self.request.user)
            .prefetch_related('base_recipes', 'ingredients__product')
            .order_by('-created_at')
        )


class UserRecipeCreateView(generics.CreateAPIView):
    serializer_class = CreateUserRecipeSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_recipe = serializer.save()
        return Response(
            UserRecipeSerializer(user_recipe, context=self.get_serializer_context()).data,
            status=status.HTTP_201_CREATED,
        )


class UserRecipeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserRecipeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            UserRecipe.objects
            .filter(user=self.request.user)
            .prefetch_related('base_recipes', 'ingredients__product')
        )

    def update(self, request, *args, **kwargs):
        user_recipe = self.get_object()

        user_recipe.name = request.data.get('name', user_recipe.name)
        user_recipe.description = request.data.get('description', user_recipe.description)
        user_recipe.save()

        base_recipe_ids = request.data.get('base_recipe_ids')
        if base_recipe_ids is not None:
            user_recipe.base_recipes.set(Recipe.objects.filter(id__in=base_recipe_ids))

        ingredients_data = request.data.get('ingredients')
        if ingredients_data is not None:
            user_recipe.ingredients.all().delete()
            for i_data in ingredients_data:
                product_id = i_data.get('product_id')
                if not product_id:
                    product_obj = i_data.get('product')
                    if isinstance(product_obj, dict):
                        product_id = product_obj.get('id')
                try:
                    qty = Decimal(str(i_data.get('quantity', 0)))
                except InvalidOperation:
                    qty = Decimal('0')
                UserRecipeIngredient.objects.create(
                    user_recipe=user_recipe,
                    product_id=product_id or None,
                    name=i_data.get('name', ''),
                    quantity=qty,
                    unit=i_data.get('unit', ''),
                    notes=i_data.get('notes', ''),
                    order=i_data.get('order', 0),
                )

        user_recipe.refresh_from_db()
        return Response(
            UserRecipeSerializer(user_recipe, context=self.get_serializer_context()).data
        )
