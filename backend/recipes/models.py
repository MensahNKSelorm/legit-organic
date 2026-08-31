import hashlib
import json

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils.text import slugify
from django.utils import timezone
from django_ckeditor_5.fields import CKEditor5Field


class Recipe(models.Model):
    STATUS_CHOICES = [
        ('imported', 'Imported'),
        ('needs_review', 'Needs review'),
        ('approved', 'Approved'),
        ('nutrition_pending', 'Nutrition pending'),
        ('ready', 'Ready'),
        ('published', 'Published'),
        ('rejected', 'Rejected'),
    ]
    NUTRITION_STATUS_CHOICES = [
        ('not_requested', 'Not requested'),
        ('pending', 'Pending'),
        ('ready', 'Ready'),
        ('partial', 'Partial'),
        ('stale', 'Stale'),
        ('failed', 'Failed'),
    ]
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    title = models.CharField(max_length=300)
    local_name = models.CharField(max_length=300, blank=True)
    slug = models.SlugField(unique=True, blank=True)
    description = CKEditor5Field(blank=True, config_name='default')
    cover_image = models.ImageField(upload_to='recipes/', blank=True, null=True)
    prep_time = models.PositiveIntegerField(default=0, help_text='In minutes')
    cook_time = models.PositiveIntegerField(default=0, help_text='In minutes')
    servings = models.PositiveIntegerField(default=1)
    cuisine = models.CharField(max_length=100, blank=True, default='Ghanaian')
    country = models.CharField(max_length=100, blank=True, default='Ghana')
    region = models.CharField(max_length=100, blank=True)
    recipe_category = models.CharField(max_length=100, blank=True)
    meal_type = models.CharField(max_length=100, blank=True)
    keywords = models.JSONField(default=list, blank=True)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='easy')
    nutritional_score = models.PositiveSmallIntegerField(
        default=0, help_text='Nutritional score out of 100'
    )
    video_url = models.URLField(
        blank=True, help_text='YouTube or video URL for recipe preparation video'
    )
    is_default = models.BooleanField(default=False, help_text='Curated by Legit Organic')
    is_published = models.BooleanField(
        default=False, help_text='Published recipes are visible on the public website.'
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='needs_review')
    review_warnings = models.JSONField(default=list, blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recipes_reviewed',
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)
    nutrition_status = models.CharField(
        max_length=30, choices=NUTRITION_STATUS_CHOICES, default='not_requested'
    )
    nutrition_calculated_at = models.DateTimeField(null=True, blank=True)
    ingredients_hash = models.CharField(max_length=64, blank=True, editable=False)
    # Phase 2 provenance fields exist now so imports will not require a domain rewrite.
    source_name = models.CharField(max_length=200, blank=True)
    source_url = models.URLField(blank=True)
    source_author = models.CharField(max_length=200, blank=True)
    source_license = models.CharField(max_length=200, blank=True)
    source_retrieved_at = models.DateTimeField(null=True, blank=True)
    source_content_hash = models.CharField(max_length=64, blank=True)
    extraction_method = models.CharField(max_length=30, blank=True)
    extraction_confidence = models.DecimalField(
        max_digits=4, decimal_places=3, null=True, blank=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recipes',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        from django.conf import settings

        return f"{settings.FRONTEND_URL}/recipes/{self.slug}"

    def save(self, *args, **kwargs):
        previous_servings = None
        if self.pk:
            previous_servings = (
                Recipe.objects.filter(pk=self.pk).values_list('servings', flat=True).first()
            )
        if not self.slug:
            self.slug = slugify(self.title)
        if self.is_published and self.status in {'approved', 'ready', 'published'}:
            self.status = 'published'
            if not self.published_at:
                self.published_at = timezone.now()
        elif self.is_published:
            self.is_published = False
        elif self.status == 'published':
            self.status = 'ready'
        super().save(*args, **kwargs)
        if previous_servings is not None and previous_servings != self.servings:
            Recipe.objects.filter(pk=self.pk, nutrition__isnull=False).update(
                nutrition_status='stale'
            )

    def current_ingredients_hash(self):
        payload = {
            'servings': self.servings,
            'ingredients': list(
                self.ingredients.order_by('position', 'id').values(
                    'quantity',
                    'quantity_max',
                    'normalized_unit',
                    'normalized_ingredient_name',
                    'nutrition_profile_id',
                    'grams_estimate',
                )
            ),
        }
        return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


class RecipeIngredient(models.Model):
    NUTRITION_MATCH_CHOICES = [
        ('exact', 'Exact'),
        ('normalized', 'Normalized'),
        ('wafct_verified', 'WAFCT verified'),
        ('usda_verified', 'USDA verified'),
        ('local_verified', 'Local verified'),
        ('estimated', 'Estimated'),
        ('unresolved', 'Unresolved'),
    ]
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL, null=True, blank=True
    )
    name = models.CharField(max_length=200)
    raw_text = models.CharField(max_length=500, blank=True)
    position = models.PositiveIntegerField(default=0)
    quantity = models.CharField(max_length=50)
    quantity_max = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    unit = models.CharField(max_length=50, blank=True)
    normalized_unit = models.CharField(max_length=50, blank=True)
    normalized_ingredient_name = models.CharField(max_length=200, blank=True)
    preparation = models.CharField(max_length=200, blank=True)
    optional = models.BooleanField(default=False)
    grams_estimate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    grams_source = models.CharField(max_length=200, blank=True)
    grams_confidence = models.DecimalField(max_digits=4, decimal_places=3, null=True, blank=True)
    nutrition_profile = models.ForeignKey(
        'IngredientNutritionProfile',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recipe_ingredients',
    )
    nutrition_match_status = models.CharField(
        max_length=30, choices=NUTRITION_MATCH_CHOICES, default='unresolved'
    )
    notes = models.CharField(max_length=200, blank=True)

    class Meta:
        ordering = ['position', 'id']

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.name}".strip()

    def save(self, *args, **kwargs):
        tracked = (
            'name',
            'quantity',
            'unit',
            'normalized_unit',
            'normalized_ingredient_name',
            'nutrition_profile_id',
            'grams_estimate',
        )
        previous = None
        if self.pk:
            previous = RecipeIngredient.objects.filter(pk=self.pk).values_list(*tracked).first()
        super().save(*args, **kwargs)
        current = tuple(getattr(self, field) for field in tracked)
        if previous is not None and previous != current:
            self._mark_nutrition_stale()

    def delete(self, *args, **kwargs):
        recipe = self.recipe
        result = super().delete(*args, **kwargs)
        if hasattr(recipe, 'nutrition'):
            Recipe.objects.filter(pk=recipe.pk).update(nutrition_status='stale')
        return result

    def _mark_nutrition_stale(self):
        recipe = self.recipe
        if hasattr(recipe, 'nutrition'):
            Recipe.objects.filter(pk=recipe.pk).update(nutrition_status='stale')


class IngredientAlias(models.Model):
    alias = models.CharField(max_length=200, unique=True)
    canonical_name = models.CharField(max_length=200)
    lookup_name = models.CharField(
        max_length=200,
        blank=True,
        help_text='Optional scientific or common name used when searching nutrition sources.',
    )
    notes = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['alias']

    def __str__(self):
        return f'{self.alias} → {self.canonical_name}'


class IngredientNutritionProfile(models.Model):
    SOURCE_CHOICES = [
        ('wafct_2019', 'FAO/INFOODS WAFCT 2019'),
        ('usda', 'USDA FoodData Central'),
        ('fao_infoods', 'Other FAO/INFOODS data'),
        ('ghana_csir', 'Ghana CSIR food composition data'),
        ('ghanaian_food_composition', 'Ghanaian food composition data'),
        ('manufacturer', 'Manufacturer'),
        ('laboratory', 'Laboratory'),
        ('academic_source', 'Academic source'),
        ('manual_verified', 'Manual verified'),
        ('other', 'Other'),
    ]
    ingredient_name = models.CharField(max_length=200)
    normalized_name = models.CharField(max_length=200, db_index=True)
    source = models.CharField(max_length=40, choices=SOURCE_CHOICES)
    source_reference = models.TextField()
    source_metadata = models.JSONField(default=dict, blank=True)
    fdc_id = models.PositiveBigIntegerField(null=True, blank=True, unique=True)
    calories_per_100g = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    protein_g_per_100g = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    carbohydrate_g_per_100g = models.DecimalField(
        max_digits=10, decimal_places=3, null=True, blank=True
    )
    fat_g_per_100g = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    saturated_fat_g_per_100g = models.DecimalField(
        max_digits=10, decimal_places=3, null=True, blank=True
    )
    fibre_g_per_100g = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    sugar_g_per_100g = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    sodium_mg_per_100g = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    cholesterol_mg_per_100g = models.DecimalField(
        max_digits=10, decimal_places=3, null=True, blank=True
    )
    micronutrients_json = models.JSONField(default=dict, blank=True)
    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_nutrition_profiles',
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    version = models.PositiveIntegerField(default=1)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['normalized_name', '-verified', '-updated_at']

    def __str__(self):
        return f'{self.ingredient_name} ({self.get_source_display()})'

    def save(self, *args, **kwargs):
        changed = bool(self.pk)
        if changed:
            self.version += 1
            if kwargs.get('update_fields') is not None:
                kwargs['update_fields'] = set(kwargs['update_fields']) | {'version'}
        super().save(*args, **kwargs)
        if changed:
            Recipe.objects.filter(ingredients__nutrition_profile=self).distinct().update(
                nutrition_status='stale'
            )


class NutritionSourceDataset(models.Model):
    PERMISSION_CHOICES = [
        ('not_required', 'Not required'),
        ('pending', 'Commercial permission pending'),
        ('granted', 'Commercial permission granted'),
        ('denied', 'Commercial permission denied'),
    ]
    code = models.SlugField(unique=True)
    name = models.CharField(max_length=300)
    version = models.CharField(max_length=80)
    publisher = models.CharField(max_length=200)
    source_url = models.URLField()
    citation = models.TextField()
    reuse_terms = models.TextField()
    commercial_permission_status = models.CharField(
        max_length=20, choices=PERMISSION_CHOICES, default='pending'
    )
    commercial_permission_reference = models.TextField(blank=True)
    workbook_sha256 = models.CharField(max_length=64)
    imported_at = models.DateTimeField(null=True, blank=True)
    imported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='nutrition_datasets_imported',
    )

    def __str__(self):
        return f'{self.name} ({self.version})'

    def clean(self):
        if (
            self.commercial_permission_status == 'granted'
            and not self.commercial_permission_reference.strip()
        ):
            raise ValidationError(
                {
                    'commercial_permission_reference': 'Record the FAO permission reference before marking permission granted.'
                }
            )


class NutritionSourceRecord(models.Model):
    STATUS_CHOICES = [
        ('unverified', 'Unverified'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    ]
    dataset = models.ForeignKey(
        NutritionSourceDataset, on_delete=models.PROTECT, related_name='records'
    )
    food_code = models.CharField(max_length=80)
    original_food_name = models.CharField(max_length=700)
    food_name_french = models.CharField(max_length=700, blank=True)
    scientific_name = models.CharField(max_length=300, blank=True)
    canonical_name = models.CharField(max_length=300, blank=True)
    preparation_state = models.CharField(max_length=300, blank=True)
    source_identifiers = models.JSONField(default=dict, blank=True)
    nutrient_values = models.JSONField(default=dict)
    quality_indicators = models.JSONField(default=dict, blank=True)
    source_sheet = models.CharField(max_length=120)
    source_row = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='unverified')
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_nutrition_source_records',
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    nutrition_profile = models.OneToOneField(
        IngredientNutritionProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='source_record',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['original_food_name', 'food_code']
        constraints = [
            models.UniqueConstraint(
                fields=['dataset', 'food_code'], name='unique_dataset_food_code'
            )
        ]

    def __str__(self):
        return f'{self.food_code} — {self.original_food_name}'


class RegionalNutritionCandidate(models.Model):
    recipe_ingredient = models.ForeignKey(
        RecipeIngredient, on_delete=models.CASCADE, related_name='regional_candidates'
    )
    source_record = models.ForeignKey(
        NutritionSourceRecord, on_delete=models.CASCADE, related_name='ingredient_candidates'
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('candidate', 'Candidate'),
            ('accepted', 'Accepted'),
            ('rejected', 'Rejected'),
        ],
        default='candidate',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['recipe_ingredient', 'source_record'],
                name='unique_ingredient_regional_candidate',
            )
        ]


class IngredientMeasurementConversion(models.Model):
    profile = models.ForeignKey(
        IngredientNutritionProfile, on_delete=models.CASCADE, related_name='conversions'
    )
    unit = models.CharField(max_length=50)
    quantity = models.DecimalField(max_digits=10, decimal_places=3, default=1)
    grams = models.DecimalField(max_digits=10, decimal_places=3)
    source_reference = models.TextField()
    confidence = models.DecimalField(max_digits=4, decimal_places=3)
    verified = models.BooleanField(default=False)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verified_measurement_conversions',
    )
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['profile', 'unit', 'quantity'], name='unique_profile_measurement_conversion'
            )
        ]

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        Recipe.objects.filter(ingredients__nutrition_profile=self.profile).distinct().update(
            nutrition_status='stale'
        )


class USDANutritionCandidate(models.Model):
    recipe_ingredient = models.ForeignKey(
        RecipeIngredient, on_delete=models.CASCADE, related_name='usda_candidates'
    )
    fdc_id = models.PositiveBigIntegerField()
    description = models.CharField(max_length=500)
    data_type = models.CharField(max_length=80, blank=True)
    score = models.DecimalField(max_digits=7, decimal_places=3, null=True, blank=True)
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('candidate', 'Candidate'),
            ('accepted', 'Accepted'),
            ('rejected', 'Rejected'),
        ],
        default='candidate',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['recipe_ingredient', 'fdc_id'], name='unique_ingredient_usda_candidate'
            )
        ]


class RecipeNutrition(models.Model):
    recipe = models.OneToOneField(Recipe, on_delete=models.CASCADE, related_name='nutrition')
    source = models.CharField(max_length=30, default='legitorganic')
    is_complete = models.BooleanField(default=False)
    calculation_warnings = models.JSONField(default=list, blank=True)
    calories = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    protein_g = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    carbohydrate_g = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fat_g = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    saturated_fat_g = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    fibre_g = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sugar_g = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sodium_mg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    cholesterol_mg = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    micronutrients_json = models.JSONField(default=dict, blank=True)
    total_recipe_values_json = models.JSONField(default=dict, blank=True)
    per_serving_values_json = models.JSONField(default=dict, blank=True)
    ingredients_hash = models.CharField(max_length=64)
    provider_payload_hash = models.CharField(max_length=64, blank=True)
    provider_response_metadata = models.JSONField(default=dict, blank=True)
    calculated_at = models.DateTimeField(auto_now=True)


class RecipeIngredientProductMatch(models.Model):
    MATCH_TYPE_CHOICES = [
        ('exact', 'Exact'),
        ('alias', 'Alias'),
        ('category', 'Category'),
        ('manual', 'Manual'),
        ('none', 'No match'),
    ]
    recipe_ingredient = models.ForeignKey(
        RecipeIngredient, on_delete=models.CASCADE, related_name='product_matches'
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.CASCADE, related_name='recipe_matches'
    )
    match_type = models.CharField(max_length=20, choices=MATCH_TYPE_CHOICES)
    confidence = models.DecimalField(max_digits=4, decimal_places=3, default=0)
    manually_verified = models.BooleanField(default=False)

    class Meta:
        ordering = ['-manually_verified', '-confidence', 'id']
        constraints = [
            models.UniqueConstraint(
                fields=['recipe_ingredient', 'product'],
                name='unique_recipe_ingredient_product_match',
            )
        ]


class RecipeStep(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='steps')
    step_number = models.PositiveIntegerField()
    section = models.CharField(max_length=200, blank=True)
    source_instruction_text = models.TextField(blank=True)
    instruction = CKEditor5Field(config_name='default')
    image = models.ImageField(upload_to='recipe_steps/', blank=True, null=True)

    class Meta:
        ordering = ['step_number']

    def __str__(self):
        return f"Step {self.step_number} — {self.recipe.title}"


class RecipePairing(models.Model):
    base_recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='pairings')
    suggested_recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name='pairing_suggestions'
    )
    label = models.CharField(max_length=100, default='Usually served with')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = [['base_recipe', 'suggested_recipe']]

    def __str__(self):
        return f"{self.base_recipe} → {self.suggested_recipe}"


class RecipeCombinationNote(models.Model):
    """A reusable editorial note for one canonical set of dishes."""

    combination_key = models.CharField(max_length=500, unique=True)
    titles = models.JSONField(default=list)
    note = models.TextField()
    model_name = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return " + ".join(self.titles)


class UserRecipe(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_recipes'
    )
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    base_recipes = models.ManyToManyField(Recipe, blank=True)
    is_saved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.user})"


class UserRecipeIngredient(models.Model):
    user_recipe = models.ForeignKey(
        UserRecipe, on_delete=models.CASCADE, related_name='ingredients'
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL, null=True, blank=True
    )
    name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=50)
    notes = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.name}".strip()
