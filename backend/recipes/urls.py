from django.urls import path
from .views import RecipeListView, RecipeDetailView, DefaultRecipesView

urlpatterns = [
    path('default/', DefaultRecipesView.as_view(), name='recipe-default'),
    path('<slug:slug>/', RecipeDetailView.as_view(), name='recipe-detail'),
    path('', RecipeListView.as_view(), name='recipe-list'),
]
