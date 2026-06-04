from rest_framework import serializers
from .models import BlogCategory, BlogPost


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug']


class BlogPostSerializer(serializers.ModelSerializer):
    author_email = serializers.CharField(source='author.email', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = BlogPost
        fields = ['id', 'title', 'slug', 'excerpt', 'cover_image',
                  'author', 'author_email', 'category', 'category_name',
                  'tags', 'is_published', 'published_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class BlogPostDetailSerializer(BlogPostSerializer):
    class Meta(BlogPostSerializer.Meta):
        fields = BlogPostSerializer.Meta.fields + ['content']
