from django.test import TestCase
from rest_framework.test import APIClient

from .models import Recipe, RecipeIngredient


class DefaultRecipeSearchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.fufu = Recipe.objects.create(title='Fufu', is_default=True)
        self.light_soup = Recipe.objects.create(title='Light Soup', is_default=True)
        self.groundnut = Recipe.objects.create(
            title='Groundnut Soup', description='A rich peanut-based soup', is_default=True
        )
        self.private_recipe = Recipe.objects.create(title='Test Kitchen Draft', is_default=False)
        RecipeIngredient.objects.create(
            recipe=self.light_soup, name='Garden eggs', quantity='4', unit='whole'
        )

    def search(self, query):
        return self.client.get('/api/recipes/default/', {'search': query})

    def test_without_search_returns_only_curated_recipes(self):
        response = self.search('')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 3)

    def test_search_matches_recipe_title(self):
        response = self.search('fufu')
        self.assertEqual([item['title'] for item in response.json()], ['Fufu'])

    def test_plus_search_returns_candidates_for_combined_meal(self):
        response = self.search('fufu + light soup')
        self.assertEqual(
            [item['title'] for item in response.json()],
            ['Fufu', 'Light Soup'],
        )

    def test_search_matches_ingredient_name(self):
        response = self.search('garden eggs')
        self.assertEqual([item['title'] for item in response.json()], ['Light Soup'])

    def test_search_never_exposes_non_curated_recipes(self):
        response = self.search('draft')
        self.assertEqual(response.json(), [])
