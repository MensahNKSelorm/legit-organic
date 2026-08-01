from django.test import TestCase
from rest_framework.test import APIClient
from unittest.mock import patch

from .models import Recipe, RecipeCombinationNote, RecipeIngredient


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


class RecipeCombinationNoteTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        Recipe.objects.create(title='Fufu', is_default=True)
        Recipe.objects.create(title='Light Soup', is_default=True)
        Recipe.objects.create(title='Secret Draft', is_default=False)

    @patch('recipes.views._groq_note', return_value=('Peppery light soup lifts the mellow, springy fufu for a balanced spoonful.', 'test-model'))
    def test_generates_and_caches_note_for_known_dishes(self, generate):
        payload = {'titles': ['Fufu', 'Light Soup']}
        first = self.client.post('/api/recipes/combination-note/', payload, format='json')
        second = self.client.post('/api/recipes/combination-note/', {'titles': ['Light Soup', 'Fufu']}, format='json')

        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.json()['source'], 'generated')
        self.assertEqual(second.json()['source'], 'cache')
        self.assertEqual(RecipeCombinationNote.objects.count(), 1)
        generate.assert_called_once()

    @patch('recipes.views._groq_note', return_value=(None, 'test-model'))
    def test_returns_fallback_without_caching_when_provider_fails(self, _generate):
        response = self.client.post(
            '/api/recipes/combination-note/',
            {'titles': ['Fufu', 'Light Soup']},
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['source'], 'fallback')
        self.assertEqual(RecipeCombinationNote.objects.count(), 0)

    def test_rejects_unknown_private_and_duplicate_dishes(self):
        for titles in (
            ['Fufu', 'Made-up soup'],
            ['Fufu', 'Secret Draft'],
            ['Fufu', 'fufu'],
        ):
            response = self.client.post('/api/recipes/combination-note/', {'titles': titles}, format='json')
            self.assertEqual(response.status_code, 400)

    def test_requires_between_two_and_four_dishes(self):
        for titles in (['Fufu'], ['Fufu', 'Light Soup', 'Groundnut soup', 'Plain rice', 'Kontomire stew']):
            response = self.client.post('/api/recipes/combination-note/', {'titles': titles}, format='json')
            self.assertEqual(response.status_code, 400)
