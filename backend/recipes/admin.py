from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from .models import Recipe, RecipeIngredient, RecipeStep, RecipePairing, UserRecipe, UserRecipeIngredient
from .forms import RecipeStepForm


class RecipeIngredientInline(TabularInline):
    model = RecipeIngredient
    extra = 1
    fields = ['name', 'product', 'quantity', 'unit', 'notes']


class RecipeStepInline(TabularInline):
    model = RecipeStep
    form = RecipeStepForm
    extra = 1
    ordering = ['step_number']
    fields = ['step_number', 'instruction', 'image']


class RecipePairingInline(TabularInline):
    model = RecipePairing
    fk_name = 'base_recipe'
    extra = 2
    fields = ['suggested_recipe', 'label', 'order']


@admin.register(Recipe)
class RecipeAdmin(ModelAdmin):
    change_form_before_template = 'admin/includes/writing_assistant.html'
    view_on_site = True
    list_display = [
        'title', 'is_published', 'is_default', 'created_by', 'difficulty',
        'prep_time', 'cook_time', 'created_at',
    ]
    list_filter = ['is_published', 'is_default', 'difficulty']
    search_fields = ['title', 'description']
    list_editable = ['is_published', 'is_default']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at', 'permanent_delete_control']
    inlines = [RecipeIngredientInline, RecipeStepInline, RecipePairingInline]
    fieldsets = (
        ('The dish', {
            'fields': ('title', 'slug', 'description'),
        }),
        ('Photography & film', {
            'fields': ('cover_image', 'video_url'),
        }),
        ('Time at the stove', {
            'fields': ('prep_time', 'cook_time', 'servings', 'difficulty'),
        }),
        ('Nutrition note', {
            'fields': ('nutritional_score',),
            'classes': ('collapse',),
        }),
        ('Ownership', {
            'fields': ('is_published', 'is_default', 'created_by'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'permanent_delete_control'),
            'classes': ('collapse',),
        }),
    )

    def has_delete_permission(self, request, obj=None):
        return False

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
        super().save_model(request, obj, form, change)
        if change:
            from security.audit import record_boolean_state_change
            record_boolean_state_change(
                request=request, target=obj, field='is_published',
                old_value=old_published, new_value=obj.is_published,
                action='recipe.publication_changed',
            )


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
