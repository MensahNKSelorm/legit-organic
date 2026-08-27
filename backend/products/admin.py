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
    change_form_before_template = 'admin/includes/writing_assistant.html'
    show_full_result_count = True
    inlines = [ProductImageInline]
    list_display = [
        'name', 'category', 'price', 'unit', 'region',
        'business_supply_category', 'is_featured', 'is_available', 'created_at',
    ]
    list_filter = ['category', 'business_supply_category', 'is_featured', 'is_available', 'region']
    search_fields = ['name', 'description']
    list_editable = ['is_featured', 'is_available']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at', 'image']
    fieldsets = (
        ('Product identity', {
            'fields': ('name', 'slug', 'description', 'category'),
        }),
        ('Price & pack', {
            'fields': ('price', 'unit'),
        }),
        ('Farm & provenance', {
            'fields': ('region', 'badge'),
        }),
        ('Storefront state', {
            'fields': ('is_featured', 'is_available', 'business_supply_category'),
        }),
        ('Nutrition, care & storage', {
            'fields': ('nutritional_score', 'nutritional_info', 'storage_tips'),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        old_available = Product.objects.get(pk=obj.pk).is_available if change else None
        super().save_model(request, obj, form, change)
        if change:
            from security.audit import record_boolean_state_change
            record_boolean_state_change(
                request=request, target=obj, field='is_available',
                old_value=old_available, new_value=obj.is_available,
                action='product.availability_changed',
            )
