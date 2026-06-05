from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from .models import Recipe, RecipeIngredient, RecipeStep, RecipePairing, UserRecipe, UserRecipeIngredient


class MinimalProductSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()
    price = serializers.CharField()
    unit = serializers.CharField()


class RecipeIngredientSerializer(serializers.ModelSerializer):
    product = MinimalProductSerializer(read_only=True)

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


class RecipePairingSerializer(serializers.ModelSerializer):
    suggested_recipe = RecipeListSerializer(read_only=True)

    class Meta:
        model = RecipePairing
        fields = ['id', 'suggested_recipe', 'label', 'order']


class RecipeDetailWithPairingsSerializer(RecipeDetailSerializer):
    pairings = RecipePairingSerializer(many=True, read_only=True)

    class Meta(RecipeDetailSerializer.Meta):
        fields = RecipeDetailSerializer.Meta.fields + ['pairings']


class UserRecipeIngredientSerializer(serializers.ModelSerializer):
    product = MinimalProductSerializer(read_only=True)

    class Meta:
        model = UserRecipeIngredient
        fields = ['id', 'product', 'name', 'quantity', 'unit', 'notes', 'order']


class UserRecipeSerializer(serializers.ModelSerializer):
    base_recipes = RecipeListSerializer(many=True, read_only=True)
    ingredients = UserRecipeIngredientSerializer(many=True, read_only=True)

    class Meta:
        model = UserRecipe
        fields = ['id', 'name', 'description', 'base_recipes', 'ingredients',
                  'is_saved', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


# ---------------------------------------------------------------------------
# Input serializers for create / update
# ---------------------------------------------------------------------------

class CreateIngredientSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=200)
    product_id = serializers.IntegerField(required=False, allow_null=True, default=None)
    quantity = serializers.CharField(max_length=20)
    unit = serializers.CharField(max_length=50)
    notes = serializers.CharField(default='', allow_blank=True, required=False)
    order = serializers.IntegerField(default=0, required=False)

    def validate_quantity(self, value):
        try:
            Decimal(str(value))
        except InvalidOperation:
            raise serializers.ValidationError('Enter a valid numeric quantity.')
        return value


class CreateUserRecipeSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=300)
    description = serializers.CharField(default='', allow_blank=True, required=False)
    base_recipe_ids = serializers.ListField(
        child=serializers.IntegerField(), default=list, required=False
    )
    ingredients = CreateIngredientSerializer(many=True)

    def create(self, validated_data):
        from django.db import transaction
        user = self.context['request'].user
        base_recipe_ids = validated_data.pop('base_recipe_ids', [])
        ingredients_data = validated_data.pop('ingredients')

        with transaction.atomic():
            user_recipe = UserRecipe.objects.create(
                user=user,
                name=validated_data['name'],
                description=validated_data.get('description', ''),
            )
            if base_recipe_ids:
                user_recipe.base_recipes.set(
                    Recipe.objects.filter(id__in=base_recipe_ids)
                )
            for i_data in ingredients_data:
                product_id = i_data.get('product_id')
                UserRecipeIngredient.objects.create(
                    user_recipe=user_recipe,
                    product_id=product_id or None,
                    name=i_data['name'],
                    quantity=Decimal(str(i_data['quantity'])),
                    unit=i_data['unit'],
                    notes=i_data.get('notes', ''),
                    order=i_data.get('order', 0),
                )
        return user_recipe
