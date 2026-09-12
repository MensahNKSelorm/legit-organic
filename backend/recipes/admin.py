from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404, redirect
from django.template.response import TemplateResponse
from django.utils import timezone
from django.urls import path, reverse
from django.utils.html import format_html
from urllib.parse import urlencode
from unfold.admin import ModelAdmin, TabularInline
from .models import (
    IngredientAlias,
    IngredientMeasurementConversion,
    IngredientNutritionProfile,
    NutritionSourceDataset,
    NutritionSourceRecord,
    Recipe,
    RecipeIngredient,
    RecipeIngredientProductMatch,
    RecipeImport,
    RecipeNutrition,
    RecipeSource,
    RecipeStep,
    RecipePairing,
    RegionalNutritionCandidate,
    USDANutritionCandidate,
    UserRecipe,
    UserRecipeIngredient,
)
from .forms import RecipeStepForm
from .services import (
    NutritionConfigurationError,
    NutritionProviderError,
    calculate_nutrition,
    confirm_regional_candidate,
    confirm_usda_candidate,
    ensure_regional_candidates,
    match_products,
    normalize_unit,
    normalize_recipe,
    parse_quantity,
    review_warnings,
    search_regional_candidates,
    search_usda_candidates,
)


class RecipeIngredientInline(TabularInline):
    model = RecipeIngredient
    extra = 0
    fields = [
        'position',
        'name',
        'quantity',
        'unit',
        'preparation',
        'optional',
        'product',
        'nutrition_match_summary',
    ]
    readonly_fields = ['nutrition_match_summary']

    @admin.display(description='Nutrition')
    def nutrition_match_summary(self, obj):
        if not obj or not obj.pk:
            return 'Available after save'
        if obj.nutrition_profile_id:
            profile_url = reverse(
                'admin:recipes_ingredientnutritionprofile_change', args=[obj.nutrition_profile_id]
            )
            return format_html(
                '<a href="{}">Matched: {}</a>', profile_url, obj.nutrition_profile.ingredient_name
            )
        candidate_url = '{}?{}'.format(
            reverse('admin:recipes_regionalnutritioncandidate_changelist'),
            urlencode(
                {
                    'q': f'{obj.recipe.title} {obj.name}',
                    'status__exact': 'candidate',
                }
            ),
        )
        count = obj.regional_candidates.filter(status='candidate').count()
        label = f'Review {count} candidate(s)' if count else 'No WAFCT candidate'
        return format_html('<a href="{}">{}</a>', candidate_url, label)


class RecipeStepInline(TabularInline):
    model = RecipeStep
    form = RecipeStepForm
    extra = 0
    ordering = ['step_number']
    fields = ['step_number', 'section', 'source_instruction_text', 'instruction', 'image']


class RecipePairingInline(TabularInline):
    model = RecipePairing
    fk_name = 'base_recipe'
    extra = 2
    fields = ['suggested_recipe', 'label', 'order']


def _weight_issue(ingredient):
    if not ingredient.nutrition_profile_id:
        return 'Nutrition match required'
    quantity, quantity_max = parse_quantity(ingredient.quantity)
    if quantity is None:
        return 'Use a numeric quantity'
    if quantity_max is not None:
        return 'Replace the range or record a reviewed weight'
    unit = ingredient.normalized_unit or normalize_unit(ingredient.unit)
    if unit in {'gram', 'kilogram'}:
        return ''
    if any(
        conversion.unit == unit and conversion.verified
        for conversion in ingredient.nutrition_profile.conversions.all()
    ):
        return ''
    return f'Verified “{unit or "unit"}” weight required'


class NutritionReadinessFilter(admin.SimpleListFilter):
    title = 'nutrition readiness'
    parameter_name = 'nutrition_readiness'

    def lookups(self, request, model_admin):
        return [('attention', 'Needs attention'), ('ready', 'Ready to calculate')]

    def queryset(self, request, queryset):
        if self.value() not in {'attention', 'ready'}:
            return queryset
        ids = [
            ingredient.pk
            for ingredient in queryset.select_related('nutrition_profile')
            if bool(_weight_issue(ingredient)) == (self.value() == 'attention')
        ]
        return queryset.filter(pk__in=ids)


@admin.register(Recipe)
class RecipeAdmin(ModelAdmin):
    change_form_before_template = 'admin/includes/writing_assistant.html'
    view_on_site = True
    list_display = [
        'title',
        'status',
        'nutrition_status',
        'is_published',
        'is_default',
        'cuisine',
        'region',
        'reviewed_by',
        'updated_at',
    ]
    list_filter = ['status', 'nutrition_status', 'is_published', 'is_default', 'cuisine', 'region']
    search_fields = ['title', 'local_name', 'description', 'ingredients__name']
    list_editable = ['is_default']
    actions = [
        'prepare_for_review',
        'approve_recipes',
        'find_regional_candidates',
        'find_usda_candidates',
        'calculate_nutrition',
        'match_store_products',
        'publish_recipes',
        'unpublish_recipes',
        'reject_recipes',
    ]
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = [
        'created_at',
        'updated_at',
        'reviewed_at',
        'published_at',
        'nutrition_calculated_at',
        'ingredients_hash',
        'permanent_delete_control',
        'nutrition_summary',
        'nutrition_status',
    ]
    inlines = [RecipeIngredientInline, RecipeStepInline, RecipePairingInline]
    fieldsets = (
        (
            'The dish',
            {
                'fields': ('title', 'local_name', 'slug', 'description'),
            },
        ),
        (
            'Recipe identity',
            {
                'fields': (
                    'cuisine',
                    'country',
                    'region',
                    'recipe_category',
                    'meal_type',
                    'keywords',
                ),
            },
        ),
        (
            'Photography & film',
            {
                'fields': ('cover_image', 'video_url'),
            },
        ),
        (
            'Time at the stove',
            {
                'fields': ('prep_time', 'cook_time', 'servings', 'difficulty'),
            },
        ),
        (
            'Nutrition review',
            {
                'fields': (
                    'nutrition_status',
                    'nutrition_summary',
                    'nutrition_calculated_at',
                    'ingredients_hash',
                    'nutritional_score',
                ),
            },
        ),
        (
            'Review & publication',
            {
                'fields': (
                    'status',
                    'review_warnings',
                    'reviewed_by',
                    'reviewed_at',
                    'is_published',
                    'published_at',
                    'is_default',
                    'created_by',
                ),
            },
        ),
        (
            'Source & provenance',
            {
                'fields': (
                    'source_name',
                    'source_url',
                    'source_author',
                    'source_license',
                    'source_retrieved_at',
                    'source_content_hash',
                    'extraction_method',
                    'extraction_confidence',
                ),
                'classes': ('collapse',),
            },
        ),
        (
            'Timestamps',
            {
                'fields': ('created_at', 'updated_at', 'permanent_delete_control'),
                'classes': ('collapse',),
            },
        ),
    )

    def has_delete_permission(self, request, obj=None):
        return False

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name in {'created_by', 'reviewed_by'}:
            kwargs['queryset'] = get_user_model().objects.filter(is_staff=True).order_by(
                'first_name', 'last_name', 'email'
            )
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    @admin.display(description='Calculated nutrition')
    def nutrition_summary(self, obj):
        if not obj or not obj.pk:
            return 'Save the recipe first. Nutrition is calculated from verified ingredient profiles.'
        try:
            nutrition = obj.nutrition
        except RecipeNutrition.DoesNotExist:
            unresolved = obj.ingredients.filter(nutrition_profile__isnull=True).count()
            if unresolved:
                return f'{unresolved} ingredient(s) still need a verified nutrition match.'
            return 'Nutrition will calculate after the recipe is saved.'
        completeness = 'Complete' if nutrition.is_complete else 'Partial'
        calories = nutrition.calories
        return f'{completeness}. {calories} kcal per serving.' if calories is not None else completeness

    @admin.display(description='Exceptional deletion')
    def permanent_delete_control(self, obj):
        if not obj or not obj.pk:
            return 'Save the recipe before managing deletion.'
        url = reverse(
            'staff-security:exceptional-delete',
            args=['recipes', 'recipe', obj.pk],
        )
        return format_html('<a href="{}">Owner-only permanent deletion</a>', url)

    def save_model(self, request, obj, form, change):
        old_published = Recipe.objects.get(pk=obj.pk).is_published if change else None
        import_record = None
        import_id = request.POST.get('recipe_import_id')
        if import_id:
            import_record = RecipeImport.objects.filter(
                pk=import_id,
                created_by=request.user,
                status='ready',
            ).select_related('source').first()
        if import_record:
            obj.source_name = import_record.source.name if import_record.source else 'Reviewed web research'
            obj.source_url = import_record.requested_url
            obj.source_author = import_record.source_author
            obj.source_license = import_record.source_license
            obj.source_retrieved_at = import_record.completed_at or timezone.now()
            obj.source_content_hash = import_record.content_hash
            obj.extraction_method = import_record.extraction_method
            obj.status = 'needs_review'
            obj.is_published = False
            if not obj.created_by_id:
                obj.created_by = request.user
        if obj.is_published and obj.status not in {'approved', 'ready', 'published'}:
            obj.is_published = False
            self.message_user(
                request, 'This recipe remains private until it passes review.', level='warning'
            )
        super().save_model(request, obj, form, change)
        if import_record:
            import_record.recipe = obj
            import_record.status = 'applied'
            import_record.completed_at = timezone.now()
            import_record.save(update_fields=['recipe', 'status', 'completed_at'])
        if change:
            from security.audit import record_boolean_state_change

            record_boolean_state_change(
                request=request,
                target=obj,
                field='is_published',
                old_value=old_published,
                new_value=obj.is_published,
                action='recipe.publication_changed',
            )

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        normalize_recipe(form.instance)
        ensure_regional_candidates(form.instance)
        review_warnings(form.instance)
        ingredients = form.instance.ingredients.all()
        if ingredients.exists() and not ingredients.filter(nutrition_profile__isnull=True).exists():
            try:
                calculate_nutrition(form.instance, force=True)
            except (NutritionConfigurationError, NutritionProviderError):
                form.instance.nutrition_status = 'failed'
                form.instance.save(update_fields=['nutrition_status', 'updated_at'])
        elif ingredients.exists():
            form.instance.nutrition_status = 'pending'
            form.instance.save(update_fields=['nutrition_status', 'updated_at'])
        import_id = request.POST.get('recipe_import_id')
        if not import_id:
            return
        import_record = RecipeImport.objects.filter(
            pk=import_id,
            recipe=form.instance,
            created_by=request.user,
        ).first()
        if not import_record:
            return
        suggestions = {
            str(item.get('name', '')).casefold(): item.get('product_id')
            for item in import_record.draft_payload.get('ingredients', [])
            if item.get('product_id')
        }
        for ingredient in form.instance.ingredients.all():
            product_id = suggestions.get(ingredient.name.casefold())
            if product_id:
                RecipeIngredientProductMatch.objects.update_or_create(
                    recipe_ingredient=ingredient,
                    product_id=product_id,
                    defaults={
                        'match_type': 'exact',
                        'confidence': 1,
                        'manually_verified': False,
                    },
                )

    @admin.action(description='Normalise and prepare for review')
    def prepare_for_review(self, request, queryset):
        for recipe in queryset:
            normalize_recipe(recipe)
            review_warnings(recipe)
            recipe.status = 'needs_review'
            recipe.is_published = False
            recipe.save(update_fields=['status', 'is_published', 'updated_at'])
        self.message_user(request, f'{queryset.count()} recipe(s) prepared for review.')

    @admin.action(description='Approve selected recipes')
    def approve_recipes(self, request, queryset):
        from security.audit import record_event

        approved = 0
        for recipe in queryset:
            previous_status = recipe.status
            normalize_recipe(recipe)
            warnings = review_warnings(recipe)
            blocking = {
                'No ingredients',
                'No instructions',
                'Published instruction missing',
                'Missing servings',
                'Ingredient quantity missing',
            }
            if blocking.intersection(warnings):
                continue
            recipe.status = 'approved'
            recipe.reviewed_by = request.user
            recipe.reviewed_at = timezone.now()
            recipe.is_published = False
            recipe.save(
                update_fields=['status', 'reviewed_by', 'reviewed_at', 'is_published', 'updated_at']
            )
            record_event(
                action='recipe.approved',
                request=request,
                target=recipe,
                before={'status': previous_status},
                after={'status': 'approved'},
            )
            approved += 1
        self.message_user(
            request, f'{approved} recipe(s) approved; incomplete recipes were left for review.'
        )

    @admin.action(description='Search USDA candidates for unresolved ingredients')
    def find_usda_candidates(self, request, queryset):
        searched = 0
        for recipe in queryset:
            normalize_recipe(recipe)
            for ingredient in recipe.ingredients.filter(nutrition_profile__isnull=True):
                try:
                    search_usda_candidates(ingredient)
                    searched += 1
                except (NutritionConfigurationError, NutritionProviderError) as exc:
                    self.message_user(request, f'{ingredient.name}: {exc}', level='warning')
        self.message_user(request, f'USDA candidates refreshed for {searched} ingredient(s).')

    @admin.action(description='Search WAFCT candidates for unresolved ingredients')
    def find_regional_candidates(self, request, queryset):
        searched = 0
        for recipe in queryset:
            normalize_recipe(recipe)
            for ingredient in recipe.ingredients.filter(nutrition_profile__isnull=True):
                search_regional_candidates(ingredient)
                searched += 1
        self.message_user(request, f'Regional candidates refreshed for {searched} ingredient(s).')

    @admin.action(description='Recalculate estimated nutrition')
    def calculate_nutrition(self, request, queryset):
        completed = 0
        for recipe in queryset:
            try:
                calculate_nutrition(recipe, force=True)
                completed += 1
            except (NutritionConfigurationError, NutritionProviderError) as exc:
                self.message_user(request, f'{recipe.title}: {exc}', level='warning')
        self.message_user(request, f'Nutrition completed for {completed} recipe(s).')

    @admin.action(description='Match ingredients to available Market products')
    def match_store_products(self, request, queryset):
        for recipe in queryset:
            normalize_recipe(recipe)
            match_products(recipe)
        self.message_user(request, f'Product matching refreshed for {queryset.count()} recipe(s).')

    @admin.action(description='Publish approved recipes')
    def publish_recipes(self, request, queryset):
        from security.audit import record_boolean_state_change

        eligible = queryset.filter(status__in=['approved', 'ready', 'published'])
        updated = 0
        for recipe in eligible:
            warnings = review_warnings(recipe)
            if {'No instructions', 'Published instruction missing'}.intersection(warnings):
                continue
            old_published = recipe.is_published
            recipe.is_published = True
            recipe.published_at = recipe.published_at or timezone.now()
            recipe.save()
            record_boolean_state_change(
                request=request,
                target=recipe,
                field='is_published',
                old_value=old_published,
                new_value=True,
                action='recipe.publication_changed',
            )
            updated += 1
        self.message_user(request, f'{updated} approved recipe(s) published.')

    @admin.action(description='Unpublish selected recipes')
    def unpublish_recipes(self, request, queryset):
        from security.audit import record_boolean_state_change

        updated = 0
        for recipe in queryset:
            old_published = recipe.is_published
            recipe.is_published = False
            recipe.status = 'ready'
            recipe.save()
            record_boolean_state_change(
                request=request,
                target=recipe,
                field='is_published',
                old_value=old_published,
                new_value=False,
                action='recipe.publication_changed',
            )
            updated += 1
        self.message_user(request, f'{updated} recipe(s) removed from the public site.')

    @admin.action(description='Reject selected recipes')
    def reject_recipes(self, request, queryset):
        from security.audit import record_event

        updated = 0
        for recipe in queryset:
            before = recipe.status
            recipe.status = 'rejected'
            recipe.is_published = False
            recipe.save()
            record_event(
                action='recipe.rejected',
                request=request,
                target=recipe,
                before={'status': before},
                after={'status': 'rejected'},
            )
            updated += 1
        self.message_user(request, f'{updated} recipe(s) rejected.')


@admin.register(IngredientAlias)
class IngredientAliasAdmin(ModelAdmin):
    list_display = ['alias', 'canonical_name', 'lookup_name', 'updated_at']
    search_fields = ['alias', 'canonical_name', 'lookup_name']


@admin.register(RecipeSource)
class RecipeSourceAdmin(ModelAdmin):
    list_display = [
        'name',
        'source_type',
        'enabled',
        'allows_recipe_reuse',
        'allows_images',
        'robots_checked_at',
    ]
    list_filter = ['enabled', 'allows_recipe_reuse', 'allows_images', 'source_type']
    search_fields = ['name', 'base_url', 'notes']
    fieldsets = (
        ('Source', {'fields': ('name', 'base_url', 'source_type', 'enabled')}),
        (
            'Reviewed permissions',
            {
                'fields': (
                    'terms_url',
                    'license_name',
                    'attribution_required',
                    'allows_recipe_reuse',
                    'allows_images',
                    'notes',
                    'reuse_reviewed_by',
                    'reuse_reviewed_at',
                )
            },
        ),
        ('Checks', {'fields': ('robots_checked_at', 'created_at', 'updated_at')}),
    )
    readonly_fields = [
        'reuse_reviewed_by',
        'reuse_reviewed_at',
        'robots_checked_at',
        'created_at',
        'updated_at',
    ]

    def save_model(self, request, obj, form, change):
        reuse_changed = 'allows_recipe_reuse' in form.changed_data
        if obj.allows_recipe_reuse and (reuse_changed or not obj.reuse_reviewed_at):
            obj.reuse_reviewed_by = request.user
            obj.reuse_reviewed_at = timezone.now()
        elif not obj.allows_recipe_reuse:
            obj.reuse_reviewed_by = None
            obj.reuse_reviewed_at = None
        super().save_model(request, obj, form, change)


@admin.register(RecipeImport)
class RecipeImportAdmin(ModelAdmin):
    list_display = [
        'requested_idea',
        'requested_country',
        'status',
        'extraction_method',
        'source',
        'duplicate_recipe',
        'created_by',
        'created_at',
    ]
    list_filter = ['status', 'extraction_method', 'requested_country', 'source']
    search_fields = ['requested_idea', 'requested_url', 'source_title', 'error_code']
    readonly_fields = [
        'requested_idea',
        'requested_country',
        'requested_region',
        'requested_url',
        'source',
        'recipe',
        'status',
        'extraction_method',
        'content_hash',
        'source_title',
        'source_author',
        'source_license',
        'sources',
        'draft_payload',
        'warnings',
        'duplicate_recipe',
        'error_code',
        'created_by',
        'created_at',
        'completed_at',
    ]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.user.has_perm('recipes.view_recipeimport')

    def has_delete_permission(self, request, obj=None):
        return False


class IngredientMeasurementConversionInline(TabularInline):
    model = IngredientMeasurementConversion
    extra = 1
    fields = [
        'unit',
        'quantity',
        'grams',
        'source_reference',
        'confidence',
        'verified',
        'verified_by',
        'verified_at',
    ]


@admin.register(IngredientNutritionProfile)
class IngredientNutritionProfileAdmin(ModelAdmin):
    list_display = [
        'ingredient_name',
        'normalized_name',
        'source',
        'fdc_id',
        'verified',
        'updated_at',
    ]
    list_filter = ['source', 'verified']
    search_fields = ['ingredient_name', 'normalized_name', 'fdc_id', 'source_reference']
    inlines = [IngredientMeasurementConversionInline]
    readonly_fields = ['created_at', 'updated_at']

    def save_model(self, request, obj, form, change):
        if obj.verified and not obj.verified_by_id:
            obj.verified_by = request.user
            obj.verified_at = timezone.now()
        super().save_model(request, obj, form, change)

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for instance in instances:
            if isinstance(instance, IngredientMeasurementConversion):
                instance.unit = instance.unit.strip().lower()
                if instance.verified and not instance.verified_by_id:
                    instance.verified_by = request.user
                    instance.verified_at = timezone.now()
            instance.save()
        for deleted in formset.deleted_objects:
            deleted.delete()
        formset.save_m2m()


@admin.register(RecipeIngredient)
class RecipeIngredientAdmin(ModelAdmin):
    list_display = [
        'recipe',
        'name',
        'recipe_amount',
        'nutrition_match_status',
        'weight_readiness',
        'review_action',
    ]
    list_filter = [NutritionReadinessFilter, 'nutrition_match_status', 'recipe']
    search_fields = ['name', 'normalized_ingredient_name', 'recipe__title']
    list_select_related = ['recipe', 'nutrition_profile']
    ordering = ['recipe__title', 'position', 'id']
    readonly_fields = [
        'recipe',
        'name',
        'quantity',
        'unit',
        'normalized_unit',
        'normalized_ingredient_name',
        'nutrition_profile',
        'nutrition_match_status',
        'grams_estimate',
        'grams_source',
        'grams_confidence',
    ]

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related('nutrition_profile__conversions')

    @admin.display(description='Amount')
    def recipe_amount(self, obj):
        return f'{obj.quantity} {obj.unit}'.strip()

    @admin.display(description='Weight readiness')
    def weight_readiness(self, obj):
        return _weight_issue(obj) or 'Ready'

    @admin.display(description='Next action')
    def review_action(self, obj):
        if not obj.nutrition_profile_id:
            url = '{}?{}'.format(
                reverse('admin:recipes_regionalnutritioncandidate_changelist'),
                urlencode({'q': f'{obj.recipe.title} {obj.name}', 'status__exact': 'candidate'}),
            )
            return format_html('<a href="{}">Review matches</a>', url)
        issue = _weight_issue(obj)
        if issue:
            if issue.startswith(('Use a numeric', 'Replace the range')) or not obj.unit.strip():
                url = reverse('admin:recipes_recipe_change', args=[obj.recipe_id])
                return format_html('<a href="{}">Edit recipe amount</a>', url)
            url = reverse(
                'admin:recipes_ingredientnutritionprofile_change', args=[obj.nutrition_profile_id]
            )
            return format_html('<a href="{}">Add verified weight</a>', url)
        return '—'

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(NutritionSourceDataset)
class NutritionSourceDatasetAdmin(ModelAdmin):
    list_display = [
        'code',
        'version',
        'publisher',
        'commercial_permission_status',
        'imported_at',
    ]
    list_filter = ['commercial_permission_status', 'publisher']
    search_fields = ['code', 'name', 'version', 'citation']
    readonly_fields = ['workbook_sha256', 'imported_at', 'imported_by']


@admin.register(NutritionSourceRecord)
class NutritionSourceRecordAdmin(ModelAdmin):
    list_display = [
        'food_code',
        'original_food_name',
        'preparation_state',
        'dataset',
        'status',
    ]
    list_filter = ['dataset', 'status']
    search_fields = [
        'food_code',
        'original_food_name',
        'food_name_french',
        'scientific_name',
        'canonical_name',
    ]
    readonly_fields = [
        'dataset',
        'food_code',
        'original_food_name',
        'food_name_french',
        'scientific_name',
        'preparation_state',
        'source_identifiers',
        'nutrient_values',
        'quality_indicators',
        'source_sheet',
        'source_row',
        'status',
        'verified_by',
        'verified_at',
        'nutrition_profile',
        'created_at',
        'updated_at',
    ]


@admin.register(RegionalNutritionCandidate)
class RegionalNutritionCandidateAdmin(ModelAdmin):
    list_display = [
        'recipe_name',
        'ingredient_name',
        'recipe_amount',
        'source_food',
        'preparation_state',
        'nutrient_summary',
        'status',
        'review_actions',
    ]
    list_filter = ['status', 'recipe_ingredient__recipe', 'source_record__dataset']
    search_fields = [
        'source_record__original_food_name',
        'source_record__food_code',
        'recipe_ingredient__name',
        'recipe_ingredient__recipe__title',
    ]
    actions = ['confirm_selected', 'reject_selected']
    list_select_related = ['source_record__dataset', 'recipe_ingredient__recipe']
    ordering = ['recipe_ingredient__recipe__title', 'recipe_ingredient__position', 'id']
    list_per_page = 50
    readonly_fields = ['recipe_ingredient', 'source_record', 'status', 'created_at']

    def get_urls(self):
        custom_urls = [
            path(
                '<int:candidate_id>/review/<str:decision>/',
                self.admin_site.admin_view(self.review_candidate_view),
                name='recipes_regionalnutritioncandidate_review',
            )
        ]
        return custom_urls + super().get_urls()

    @admin.display(description='Recipe', ordering='recipe_ingredient__recipe__title')
    def recipe_name(self, obj):
        return obj.recipe_ingredient.recipe.title

    @admin.display(description='Ingredient', ordering='recipe_ingredient__name')
    def ingredient_name(self, obj):
        return obj.recipe_ingredient.name

    @admin.display(description='Amount')
    def recipe_amount(self, obj):
        return f'{obj.recipe_ingredient.quantity} {obj.recipe_ingredient.unit}'.strip()

    @admin.display(description='WAFCT food', ordering='source_record__original_food_name')
    def source_food(self, obj):
        return f'{obj.source_record.food_code} — {obj.source_record.original_food_name}'

    @admin.display(description='Dataset')
    def dataset_name(self, obj):
        return obj.source_record.dataset.code

    @admin.display(description='Preparation')
    def preparation_state(self, obj):
        return obj.source_record.preparation_state or '—'

    @admin.display(description='Per 100 g')
    def nutrient_summary(self, obj):
        values = obj.source_record.nutrient_values
        calories = values.get('ENERC:kcal', {}).get('value')
        protein = values.get('PROTCNT:g', {}).get('value')
        parts = []
        if calories is not None:
            parts.append(f'{calories} kcal')
        if protein is not None:
            parts.append(f'{protein} g protein')
        return ' · '.join(parts) or 'See source record'

    @admin.display(description='Actions')
    def review_actions(self, obj):
        if obj.status != 'candidate':
            return 'Reviewed'
        base = reverse('admin:recipes_regionalnutritioncandidate_review', args=[obj.pk, 'approve'])
        reject = reverse('admin:recipes_regionalnutritioncandidate_review', args=[obj.pk, 'reject'])
        return format_html(
            '<a class="button" href="{}">Approve</a> <a href="{}">Reject</a>', base, reject
        )

    def review_candidate_view(self, request, candidate_id, decision):
        if not self.has_change_permission(request):
            raise PermissionDenied
        if decision not in {'approve', 'reject'}:
            raise PermissionDenied
        candidate = get_object_or_404(
            RegionalNutritionCandidate.objects.select_related(
                'source_record__dataset', 'recipe_ingredient__recipe'
            ),
            pk=candidate_id,
        )
        if request.method == 'POST':
            if candidate.status != 'candidate':
                self.message_user(request, 'This candidate has already been reviewed.', level='warning')
            elif decision == 'approve':
                try:
                    confirm_regional_candidate(candidate, request.user)
                    self.message_user(request, 'Nutrition mapping approved and made reusable.')
                except NutritionConfigurationError as exc:
                    self.message_user(request, str(exc), level='warning')
            else:
                candidate.status = 'rejected'
                candidate.save(update_fields=['status'])
                self.message_user(request, 'Nutrition candidate rejected.')
            return redirect('admin:recipes_regionalnutritioncandidate_changelist')
        context = {
            **self.admin_site.each_context(request),
            'opts': self.model._meta,
            'candidate': candidate,
            'decision': decision,
            'title': f'{decision.title()} nutrition match',
        }
        return TemplateResponse(
            request,
            'admin/recipes/regionalnutritioncandidate/review.html',
            context,
        )

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return request.user.has_perm('recipes.change_recipeingredient')

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(description='Confirm selected regional mappings')
    def confirm_selected(self, request, queryset):
        ingredient_ids = list(queryset.values_list('recipe_ingredient_id', flat=True))
        if len(ingredient_ids) != len(set(ingredient_ids)):
            self.message_user(
                request,
                'Select only one candidate for each ingredient.',
                level='warning',
            )
            return
        confirmed = 0
        for candidate in queryset.select_related('source_record__dataset', 'recipe_ingredient'):
            try:
                confirm_regional_candidate(candidate, request.user)
                confirmed += 1
            except NutritionConfigurationError as exc:
                self.message_user(request, str(exc), level='warning')
        self.message_user(request, f'{confirmed} regional mapping(s) verified.')

    @admin.action(description='Reject selected regional mappings')
    def reject_selected(self, request, queryset):
        self.message_user(request, f'{queryset.update(status="rejected")} candidate(s) rejected.')


@admin.register(USDANutritionCandidate)
class USDANutritionCandidateAdmin(ModelAdmin):
    list_display = ['description', 'recipe_ingredient', 'fdc_id', 'data_type', 'score', 'status']
    list_filter = ['status', 'data_type']
    search_fields = ['description', 'recipe_ingredient__name']
    actions = ['confirm_selected', 'reject_selected']

    @admin.action(description='Confirm selected USDA mappings')
    def confirm_selected(self, request, queryset):
        confirmed = 0
        for candidate in queryset:
            try:
                confirm_usda_candidate(candidate, request.user)
                confirmed += 1
            except (NutritionConfigurationError, NutritionProviderError) as exc:
                self.message_user(request, f'{candidate.description}: {exc}', level='warning')
        self.message_user(request, f'{confirmed} USDA mapping(s) confirmed and made reusable.')

    @admin.action(description='Reject selected USDA mappings')
    def reject_selected(self, request, queryset):
        self.message_user(request, f'{queryset.update(status="rejected")} candidate(s) rejected.')


@admin.register(RecipeNutrition)
class RecipeNutritionAdmin(ModelAdmin):
    list_display = ['recipe', 'source', 'is_complete', 'calories', 'protein_g', 'calculated_at']
    search_fields = ['recipe__title']
    readonly_fields = [
        'recipe',
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
        'micronutrients_json',
        'total_recipe_values_json',
        'per_serving_values_json',
        'ingredients_hash',
        'provider_payload_hash',
        'provider_response_metadata',
        'calculated_at',
    ]


@admin.register(RecipeIngredientProductMatch)
class RecipeIngredientProductMatchAdmin(ModelAdmin):
    list_display = ['recipe_ingredient', 'product', 'match_type', 'confidence', 'manually_verified']
    list_filter = ['match_type', 'manually_verified']
    search_fields = ['recipe_ingredient__name', 'product__name']


class UserRecipeIngredientInline(TabularInline):
    model = UserRecipeIngredient
    extra = 3
    fields = ['name', 'product', 'quantity', 'unit', 'notes', 'order']


@admin.register(UserRecipe)
class UserRecipeAdmin(ModelAdmin):
    list_display = ['name', 'user', 'is_saved', 'created_at']
    list_filter = ['is_saved']
    search_fields = ['name', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [UserRecipeIngredientInline]

    def has_delete_permission(self, request, obj=None):
        return False
