from rest_framework import serializers
from .models import Recipe, RecipeIngredient, RecipeStep


class RecipeIngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeIngredient
        fields = ['id', 'product', 'name', 'quantity', 'unit', 'notes']


class RecipeStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeStep
        fields = ['id', 'step_number', 'instruction', 'image']


class RecipeSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = Recipe
        fields = ['id', 'title', 'slug', 'description', 'cover_image',
                  'prep_time', 'cook_time', 'servings', 'difficulty',
                  'is_default', 'created_by', 'created_by_email',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class RecipeDetailSerializer(RecipeSerializer):
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    steps = RecipeStepSerializer(many=True, read_only=True)

    class Meta(RecipeSerializer.Meta):
        fields = RecipeSerializer.Meta.fields + ['ingredients', 'steps']
