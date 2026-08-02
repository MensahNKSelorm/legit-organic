from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django_ckeditor_5.fields import CKEditor5Field


class BlogCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, blank=True)

    class Meta:
        verbose_name_plural = 'blog categories'

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    title = models.CharField(max_length=300)
    slug = models.SlugField(max_length=220, unique=True, blank=True)
    content = CKEditor5Field(config_name='extends')
    excerpt = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='blog/', blank=True, null=True)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='blog_posts'
    )
    category = models.ForeignKey(
        BlogCategory, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='posts'
    )
    tags = models.CharField(max_length=300, blank=True, help_text='Comma-separated tags')
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        from django.conf import settings
        return f"{settings.FRONTEND_URL}/blog/{self.slug}"

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class BlogTopic(models.Model):
    """Editable pool of subjects for the weekly auto-blog. Manage entirely in the
    Django admin — add, edit, or deactivate topics at any time, no code change."""
    topic = models.CharField(
        max_length=200,
        help_text='Subject + web-search query, e.g. "Soil health for smallholder farms in Ghana"',
    )
    category = models.CharField(max_length=100, default='Agriculture')
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['topic']

    def __str__(self):
        return self.topic
