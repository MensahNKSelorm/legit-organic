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


class RecipeListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = ['id', 'title', 'slug', 'description', 'cover_image',
                  'prep_time', 'cook_time', 'servings', 'difficulty',
                  'is_default', 'created_at']
        read_only_fields = ['id', 'slug', 'created_at']


class RecipeDetailSerializer(RecipeListSerializer):
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    steps = RecipeStepSerializer(many=True, read_only=True)

    class Meta(RecipeListSerializer.Meta):
        fields = RecipeListSerializer.Meta.fields + ['ingredients', 'steps', 'updated_at']
