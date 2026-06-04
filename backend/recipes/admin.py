from django.contrib import admin
from .models import Recipe, RecipeIngredient, RecipeStep


class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 1


class RecipeStepInline(admin.TabularInline):
    model = RecipeStep
    extra = 1


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ['title', 'difficulty', 'is_default', 'created_by', 'servings', 'created_at']
    list_filter = ['is_default', 'difficulty']
    search_fields = ['title', 'description']
    prepopulated_fields = {'slug': ('title',)}
    inlines = [RecipeIngredientInline, RecipeStepInline]
