from rest_framework import viewsets, permissions
from .models import BlogCategory, BlogPost
from .serializers import BlogCategorySerializer, BlogPostSerializer, BlogPostDetailSerializer


class BlogCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BlogCategory.objects.all()
    serializer_class = BlogCategorySerializer
    permission_classes = []


class BlogPostViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = BlogPostSerializer
    permission_classes = []

    def get_queryset(self):
        return BlogPost.objects.filter(is_published=True)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return BlogPostDetailSerializer
        return BlogPostSerializer
