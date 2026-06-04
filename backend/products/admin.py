from django.contrib import admin
from .models import Category, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'unit', 'is_featured', 'is_available', 'created_at']
    list_filter = ['is_featured', 'is_available', 'category']
    search_fields = ['name', 'description', 'region']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_featured', 'is_available']
