from django.contrib import admin
from .models import Recipe, RecipeIngredient, RecipeStep, RecipePairing, UserRecipe, UserRecipeIngredient


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 3
    fields = ['name', 'product', 'quantity', 'unit', 'notes']


class RecipeStepInline(admin.TabularInline):
    model = RecipeStep
    extra = 3
    ordering = ['step_number']
    fields = ['step_number', 'instruction', 'image']


class RecipePairingInline(admin.TabularInline):
    model = RecipePairing
    fk_name = 'base_recipe'
    extra = 2
    fields = ['suggested_recipe', 'label', 'order']


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'is_default', 'created_by', 'difficulty',
        'prep_time', 'cook_time', 'created_at',
    ]
    list_filter = ['is_default', 'difficulty']
    search_fields = ['title', 'description']
    list_editable = ['is_default']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at']
    inlines = [RecipeIngredientInline, RecipeStepInline, RecipePairingInline]
    fieldsets = (
        ('Basic Info', {
            'fields': ('title', 'slug', 'description', 'cover_image'),
        }),
        ('Details', {
            'fields': ('prep_time', 'cook_time', 'servings', 'difficulty'),
        }),
        ('Attribution', {
            'fields': ('is_default', 'created_by'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


class UserRecipeIngredientInline(admin.TabularInline):
    model = UserRecipeIngredient
    extra = 3
    fields = ['name', 'product', 'quantity', 'unit', 'notes', 'order']


@admin.register(UserRecipe)
class UserRecipeAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'is_saved', 'created_at']
    list_filter = ['is_saved']
    search_fields = ['name', 'user__email']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [UserRecipeIngredientInline]
