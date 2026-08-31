from decimal import Decimal, InvalidOperation
from rest_framework import serializers
from security.html import SafeHTMLRepresentationMixin
from .models import (
    Recipe,
    RecipeIngredient,
    RecipeNutrition,
    RecipeStep,
    RecipePairing,
    UserRecipe,
    UserRecipeIngredient,
)


class MinimalProductSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    slug = serializers.CharField()
    price = serializers.CharField()
    unit = serializers.CharField()
    image = serializers.ImageField(allow_null=True)
    is_available = serializers.BooleanField()


class RecipeIngredientSerializer(serializers.ModelSerializer):
    product = MinimalProductSerializer(read_only=True)
    matched_products = serializers.SerializerMethodField()

    class Meta:
        model = RecipeIngredient
        fields = [
            'id',
            'product',
            'matched_products',
            'name',
            'raw_text',
            'quantity',
            'quantity_max',
            'unit',
            'normalized_unit',
            'preparation',
            'optional',
            'notes',
        ]

    def get_matched_products(self, obj):
        matches = obj.product_matches.filter(
            product__is_available=True,
            manually_verified=True,
        ).select_related('product')[:3]
        return MinimalProductSerializer(
            [match.product for match in matches], many=True, context=self.context
        ).data


class RecipeStepSerializer(SafeHTMLRepresentationMixin, serializers.ModelSerializer):
    html_fields = ('instruction',)

    class Meta:
        model = RecipeStep
        fields = ['id', 'step_number', 'section', 'instruction', 'image']


class RecipeListSerializer(SafeHTMLRepresentationMixin, serializers.ModelSerializer):
    html_fields = ('description',)
    total_time = serializers.SerializerMethodField()

    def get_total_time(self, obj):
        return obj.prep_time + obj.cook_time

    class Meta:
        model = Recipe
        fields = [
            'id',
            'title',
            'local_name',
            'slug',
            'description',
            'cover_image',
            'prep_time',
            'cook_time',
            'servings',
            'difficulty',
            'total_time',
            'cuisine',
            'country',
            'region',
            'recipe_category',
            'meal_type',
            'keywords',
            'is_default',
            'nutritional_score',
            'video_url',
            'published_at',
            'created_at',
        ]
        read_only_fields = ['id', 'slug', 'created_at']


class RecipeDetailSerializer(RecipeListSerializer):
    ingredients = RecipeIngredientSerializer(many=True, read_only=True)
    steps = RecipeStepSerializer(many=True, read_only=True)
    nutrition = serializers.SerializerMethodField()
    nutrition_attribution = serializers.SerializerMethodField()
    source_attribution = serializers.SerializerMethodField()

    def get_nutrition(self, obj):
        try:
            nutrition = obj.nutrition
        except RecipeNutrition.DoesNotExist:
            return None
        return RecipeNutritionSerializer(nutrition).data

    def get_nutrition_attribution(self, obj):
        if not hasattr(obj, 'nutrition'):
            return None
        return {
            'name': 'Estimated by LegitOrganic from verified food-composition data',
            'url': 'https://fdc.nal.usda.gov/',
        }

    def get_source_attribution(self, obj):
        if not obj.source_name and not obj.source_url:
            return None
        return {
            'name': obj.source_name,
            'url': obj.source_url,
            'author': obj.source_author,
            'license': obj.source_license,
        }

    class Meta(RecipeListSerializer.Meta):
        fields = RecipeListSerializer.Meta.fields + [
            'ingredients',
            'steps',
            'nutrition',
            'nutrition_attribution',
            'source_attribution',
            'updated_at',
        ]


class RecipeNutritionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecipeNutrition
        fields = [
            'source',
            'is_complete',
            'calculation_warnings',
            'calories',
            'protein_g',
            'carbohydrate_g',
            'fat_g',
            'saturated_fat_g',
            'fibre_g',
            'sugar_g',
            'sodium_mg',
            'cholesterol_mg',
            'calculated_at',
        ]


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
        fields = [
            'id',
            'name',
            'description',
            'base_recipes',
            'ingredients',
            'is_saved',
            'created_at',
            'updated_at',
        ]
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
                user_recipe.base_recipes.set(Recipe.objects.filter(id__in=base_recipe_ids))
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
