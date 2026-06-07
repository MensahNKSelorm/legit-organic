from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import BlogCategory, BlogPost


@admin.register(BlogCategory)
class BlogCategoryAdmin(ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(BlogPost)
class BlogPostAdmin(ModelAdmin):
    view_on_site = True
    list_display = [
        'title', 'author', 'category', 'is_published', 'published_at', 'created_at',
    ]
    list_filter = ['is_published', 'category', 'author']
    search_fields = ['title', 'content', 'excerpt']
    list_editable = ['is_published']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'published_at'
    fieldsets = (
        ('Content', {
            'fields': ('title', 'slug', 'excerpt', 'content'),
        }),
        ('Media', {
            'fields': ('cover_image',),
        }),
        ('Meta', {
            'fields': ('author', 'category', 'tags'),
        }),
        ('Publishing', {
            'fields': ('is_published', 'published_at'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
