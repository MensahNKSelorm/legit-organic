from django.urls import path
from .views import BlogCategoryListView, BlogPostListView, BlogPostDetailView

urlpatterns = [
    path('categories/', BlogCategoryListView.as_view(), name='blog-category-list'),
    path('<slug:slug>/', BlogPostDetailView.as_view(), name='blog-post-detail'),
    path('', BlogPostListView.as_view(), name='blog-post-list'),
]
