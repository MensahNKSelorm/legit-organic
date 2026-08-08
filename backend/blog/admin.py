from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from .models import BlogCategory, BlogPost, BlogTopic


@admin.register(BlogCategory)
class BlogCategoryAdmin(ModelAdmin):
    list_display = ['name', 'slug']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(BlogTopic)
class BlogTopicAdmin(ModelAdmin):
    list_display = ['topic', 'category', 'is_active', 'last_used_at']
    list_editable = ['is_active']
    list_filter = ['is_active', 'category']
    search_fields = ['topic']


@admin.register(BlogPost)
class BlogPostAdmin(ModelAdmin):
    change_form_before_template = 'admin/includes/writing_assistant.html'
    view_on_site = True
    list_display = [
        'title', 'author', 'category', 'is_published', 'published_at', 'created_at',
    ]
    list_filter = ['is_published', 'category', 'author']
    search_fields = ['title', 'content', 'excerpt']
    list_editable = ['is_published']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at', 'permanent_delete_control']
    date_hierarchy = 'published_at'
    fieldsets = (
        ('The story', {
            'fields': ('title', 'slug', 'excerpt', 'content'),
        }),
        ('Lead image', {
            'fields': ('cover_image',),
        }),
        ('Byline & filing', {
            'fields': ('author', 'category', 'tags'),
        }),
        ('Publication', {
            'fields': ('is_published', 'published_at'),
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
            return 'Save the post before managing deletion.'
        url = reverse(
            'staff-security:exceptional-delete',
            args=['blog', 'blogpost', obj.pk],
        )
        return format_html('<a href="{}">Owner-only permanent deletion</a>', url)

    def save_model(self, request, obj, form, change):
        old_published = BlogPost.objects.get(pk=obj.pk).is_published if change else None
        super().save_model(request, obj, form, change)
        if change:
            from security.audit import record_boolean_state_change
            record_boolean_state_change(
                request=request, target=obj, field='is_published',
                old_value=old_published, new_value=obj.is_published,
                action='blog.publication_changed',
            )
