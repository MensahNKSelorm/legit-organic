from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from .models import Badge, Category, Product, ProductImage, Region


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Region)
class RegionAdmin(ModelAdmin):
    list_display = ['name', 'country', 'is_active']
    list_filter = ['country', 'is_active']
    list_editable = ['is_active']
    search_fields = ['name', 'country']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Badge)
class BadgeAdmin(ModelAdmin):
    list_display = ['name', 'color', 'is_active']
    list_editable = ['is_active']
    prepopulated_fields = {'slug': ('name',)}


class ProductImageInline(TabularInline):
    model = ProductImage
    extra = 3
    fields = ['image', 'alt_text', 'order', 'is_primary']


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    show_full_result_count = True
    inlines = [ProductImageInline]
    list_display = [
        'name', 'category', 'price', 'unit', 'region',
        'is_featured', 'is_available', 'created_at',
    ]
    list_filter = ['category', 'is_featured', 'is_available', 'region']
    search_fields = ['name', 'description']
    list_editable = ['is_featured', 'is_available']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at', 'image']
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'slug', 'description', 'category'),
        }),
        ('Pricing', {
            'fields': ('price', 'unit'),
        }),
        ('Origin', {
            'fields': ('region', 'badge'),
        }),
        ('Status', {
            'fields': ('is_featured', 'is_available'),
        }),
        ('Nutrition & Storage', {
            'fields': ('nutritional_score', 'nutritional_info', 'storage_tips'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
