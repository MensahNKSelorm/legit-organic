from django.urls import path
from .views import (
    RecipeListView,
    RecipeDetailView,
    DefaultRecipesView,
    UserRecipeListView,
    UserRecipeCreateView,
    UserRecipeDetailView,
)

urlpatterns = [
    path('default/', DefaultRecipesView.as_view(), name='recipe-default'),
    path('my-recipes/', UserRecipeListView.as_view(), name='user-recipe-list'),
    path('my-recipes/create/', UserRecipeCreateView.as_view(), name='user-recipe-create'),
    path('my-recipes/<int:pk>/', UserRecipeDetailView.as_view(), name='user-recipe-detail'),
    path('<slug:slug>/', RecipeDetailView.as_view(), name='recipe-detail'),
    path('', RecipeListView.as_view(), name='recipe-list'),
]
