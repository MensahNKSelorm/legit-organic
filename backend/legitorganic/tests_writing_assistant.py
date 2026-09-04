from unittest.mock import patch
from pathlib import Path

from django.core.cache import cache
from django.test import Client, TestCase, override_settings
from django.urls import reverse

from products.models import Product
from recipes.models import Recipe, RecipeImport
from users.models import User
from .writing_assistant import SYSTEM_PROMPT, _prompt, _response_schema


@override_settings(STAFF_2FA_MODE='enroll', STAFF_OWNER_2FA_REQUIRED=False)
class WritingAssistantTests(TestCase):
    def setUp(self):
        cache.clear()
        self.owner = User.objects.create_superuser(
            email='owner@legitorganic.com',
            password='OwnerPass!2026',
            first_name='Owner',
            last_name='Account',
        )
        self.staff = User.objects.create_user(
            email='viewer@legitorganic.com',
            password='ViewerPass!2026',
            first_name='View',
            last_name='Only',
            is_staff=True,
        )
        self.url = reverse('writing-assistant')

    def payload(self, **overrides):
        data = {
            'kind': 'product',
            'task': 'description',
            'instruction': 'Describe the flavour and everyday kitchen uses.',
            'context': {'name': 'Garden eggs', 'category': 'Vegetables'},
        }
        data.update(overrides)
        return data

    def test_editorial_prompt_forbids_plausible_sounding_inventions(self):
        self.assertIn('Only state facts and uses explicitly supplied', SYSTEM_PROMPT)
        self.assertIn('Never invent dish names, traditional uses', SYSTEM_PROMPT)
        self.assertIn('Avoid puffery', SYSTEM_PROMPT)
        product_prompt = _prompt(
            'product',
            'description',
            'Describe garden eggs.',
            {'name': 'Garden eggs'},
            ['Tomatoes', 'Onions'],
        )
        self.assertNotIn('Tomatoes', product_prompt)
        self.assertNotIn('Onions', product_prompt)
        self.assertIn('restrained rewrite of those anchors', product_prompt)
        self.assertIn('when the anchors are sparse, make the answer shorter', product_prompt)

    def test_complete_blog_draft_is_long_form_without_padding(self):
        prompt = _prompt(
            'blog',
            'draft',
            'Explain how harvest timing affects freshness for customers in Accra.',
            {'title': 'From harvest to kitchen'},
            [],
        )
        self.assertIn('900-1400 word first draft', prompt)
        self.assertIn('clear editorial through-line', prompt)
        self.assertIn('Never pad the article or invent facts', prompt)
        self.assertIn('return a shorter complete draft', prompt)
        self.assertIn('brief is the complete factual boundary', prompt)
        self.assertIn('may not fill gaps with general culinary knowledge', prompt)
        self.assertIn('do not create headings named Introduction', prompt)
        self.assertNotIn('blockquote only', prompt)

    def test_requires_staff_authentication_and_model_permission(self):
        response = self.client.post(self.url, self.payload(), content_type='application/json')
        self.assertEqual(response.status_code, 302)

        self.client.force_login(self.staff)
        response = self.client.post(self.url, self.payload(), content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_requires_csrf_for_browser_requests(self):
        client = Client(enforce_csrf_checks=True)
        client.force_login(self.owner)
        response = client.post(self.url, self.payload(), content_type='application/json')
        self.assertEqual(response.status_code, 403)

    @patch('legitorganic.writing_assistant._call_groq')
    def test_returns_validated_product_copy(self, groq):
        groq.return_value = {'text': '  Crisp, gently bitter garden eggs for stews and sauces.  '}
        self.client.force_login(self.owner)
        response = self.client.post(self.url, self.payload(), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json()['draft']['text'],
            'Crisp, gently bitter garden eggs for stews and sauces.',
        )

    @patch('legitorganic.writing_assistant._call_groq')
    def test_sanitises_blog_html(self, groq):
        groq.return_value = {
            'html': '<h2>Storage</h2><script>alert(1)</script><p onclick="x">Keep leaves cool.</p>'
        }
        self.client.force_login(self.owner)
        response = self.client.post(
            self.url,
            self.payload(
                kind='blog',
                task='draft',
                instruction='Write a practical guide to storing leafy vegetables.',
            ),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        html = response.json()['draft']['html']
        self.assertNotIn('<script', html)
        self.assertNotIn('alert(1)', html)
        self.assertNotIn('onclick', html)

    @patch('legitorganic.writing_assistant._call_groq')
    def test_recipe_ingredients_match_available_products(self, groq):
        product = Product.objects.create(name='Kontomire', price='12.00', is_available=True)
        groq.return_value = {
            'ingredients': [
                {'name': 'Kontomire', 'quantity': '2', 'unit': 'bunches', 'notes': 'washed'},
                {'name': 'Salt', 'quantity': '1', 'unit': 'pinch', 'notes': ''},
                {
                    'name': 'Onion',
                    'quantity': '1',
                    'unit': 'whole',
                    'preparation': 'sliced',
                    'optional': False,
                    'notes': '',
                },
            ],
            'steps': [
                {'instruction': 'Wash and slice the leaves.'},
                {'instruction': 'Cook them using the supplied method.'},
            ],
        }
        self.client.force_login(self.owner)
        response = self.client.post(
            self.url,
            self.payload(
                kind='recipe',
                task='method',
                instruction='Draft a simple kontomire method for four people.',
            ),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        ingredients = response.json()['draft']['ingredients']
        self.assertEqual(ingredients[0]['product_id'], product.pk)
        self.assertEqual(ingredients[1]['product_id'], '')
        self.assertEqual(ingredients[2]['preparation'], 'sliced')

    @patch('legitorganic.writing_assistant._call_groq')
    def test_recipe_method_rejects_sparse_or_duplicate_output(self, groq):
        groq.return_value = {
            'ingredients': [
                {'name': 'Tomato', 'quantity': '2'},
                {'name': 'tomato', 'quantity': '1'},
                {'name': 'Onion', 'quantity': '1'},
            ],
            'steps': [
                {'instruction': 'Prepare the vegetables.'},
                {'instruction': 'Cook them.'},
            ],
        }
        self.client.force_login(self.owner)
        response = self.client.post(
            self.url,
            self.payload(
                kind='recipe',
                task='method',
                instruction='Use two tomatoes and one onion. Prepare and cook the vegetables.',
            ),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 502)
        self.assertNotIn('draft', response.json())

    def test_recipe_method_prompt_is_grounded_and_excludes_nutrition(self):
        prompt = _prompt(
            'recipe',
            'method',
            'Use tomatoes, onions and pepper. Chop them, then simmer them.',
            {'source_name': 'Staff kitchen notes'},
            ['Tomatoes', 'Onions'],
        )
        self.assertIn('complete factual boundary', prompt)
        self.assertIn('Do not complete a familiar recipe from memory', prompt)
        self.assertIn('Do not invent substitutions', prompt)
        self.assertIn('Never invent', SYSTEM_PROMPT)

    def test_recipe_method_uses_strict_structured_output(self):
        response_format = _response_schema('recipe', 'method')
        self.assertEqual(response_format['type'], 'json_schema')
        definition = response_format['json_schema']
        self.assertTrue(definition['strict'])
        schema = definition['schema']
        self.assertFalse(schema['additionalProperties'])
        self.assertIn('ready', schema['required'])
        self.assertEqual(schema['properties']['ingredients']['maxItems'], 15)
        self.assertEqual(schema['properties']['steps']['maxItems'], 12)
        develop_schema = _response_schema('recipe', 'develop')['json_schema']['schema']
        self.assertIn('pairings', develop_schema['required'])
        self.assertEqual(develop_schema['properties']['pairings']['maxItems'], 4)

    @patch('legitorganic.writing_assistant.research_recipe')
    @patch('legitorganic.writing_assistant._call_groq')
    def test_researches_country_specific_recipe_as_private_review_draft(self, groq, research):
        pairing = Recipe.objects.create(
            title='Boiled Yam', status='published', is_published=True
        )
        research.return_value = [
            {'title': 'Ghana tomato stew', 'url': 'https://example.com/a', 'snippet': 'Facts A'},
            {'title': 'Tomato stew method', 'url': 'https://example.org/b', 'snippet': 'Facts B'},
        ]
        groq.return_value = {
            'ready': True,
            'detail': '',
            'title': 'Ghanaian Tomato Stew',
            'local_name': '',
            'description': 'A tomato and onion stew.',
            'country': 'Nigeria',
            'region': '',
            'cuisine': 'Ghanaian',
            'recipe_category': 'Stew',
            'meal_type': 'Main',
            'keywords': ['tomato', 'stew'],
            'servings': 4,
            'prep_time': 15,
            'cook_time': 40,
            'difficulty': 'easy',
            'ingredients': [
                {'name': 'Tomato', 'raw_text': '6 tomatoes', 'quantity': '6', 'unit': 'whole', 'preparation': 'chopped', 'optional': False, 'notes': ''},
                {'name': 'Onion', 'raw_text': '2 onions', 'quantity': '2', 'unit': 'whole', 'preparation': 'sliced', 'optional': False, 'notes': ''},
                {'name': 'Oil', 'raw_text': '2 tbsp oil', 'quantity': '2', 'unit': 'tbsp', 'preparation': '', 'optional': False, 'notes': ''},
            ],
            'steps': [
                {'instruction': 'Prepare the vegetables.', 'source_instruction_text': 'Prepare vegetables', 'section': ''},
                {'instruction': 'Cook until the supplied endpoint.', 'source_instruction_text': 'Cook', 'section': ''},
            ],
            'pairings': [
                {'recipe_title': 'Boiled Yam', 'label': 'Serve with'},
                {'recipe_title': 'Invented Dish', 'label': 'Serve with'},
            ],
        }
        self.client.force_login(self.owner)
        response = self.client.post(
            self.url,
            self.payload(
                kind='recipe',
                task='develop',
                instruction='Tomato stew',
                country='Ghana',
                region='',
                source_url='',
            ),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['draft']['country'], 'Ghana')
        self.assertEqual(
            response.json()['draft']['pairings'],
            [{'recipe_id': pairing.pk, 'recipe_title': 'Boiled Yam', 'label': 'Serve with'}],
        )
        self.assertIn('research_sources', response.json()['draft']['provenance'])
        self.assertEqual(list(Recipe.objects.values_list('title', flat=True)), ['Boiled Yam'])
        record = RecipeImport.objects.get()
        self.assertEqual(record.status, 'ready')
        self.assertEqual(record.extraction_method, 'research_ai')
        research.assert_called_once_with('Tomato stew', 'Ghana', '')

    @patch('legitorganic.writing_assistant.research_recipe')
    def test_recipe_research_failure_is_recorded_without_creating_recipe(self, research):
        from recipes.importing import RecipeImportError

        research.side_effect = RecipeImportError('Not enough evidence.', 'thin_research')
        self.client.force_login(self.owner)
        response = self.client.post(
            self.url,
            self.payload(kind='recipe', task='develop', instruction='Tomato stew', country='Ghana'),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(Recipe.objects.count(), 0)
        self.assertEqual(RecipeImport.objects.get().status, 'blocked')

    @patch('legitorganic.writing_assistant._call_groq')
    def test_incomplete_recipe_brief_returns_actionable_message(self, groq):
        groq.return_value = {
            'ready': False,
            'detail': 'Add exact quantities and at least two preparation steps.',
            'ingredients': [],
            'steps': [],
        }
        self.client.force_login(self.owner)
        response = self.client.post(
            self.url,
            self.payload(
                kind='recipe',
                task='method',
                instruction='I would like a tomato recipe but have no method yet.',
            ),
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn('exact quantities', response.json()['detail'])

    @patch('legitorganic.writing_assistant._call_groq')
    def test_provider_failure_does_not_return_partial_copy(self, groq):
        groq.side_effect = ValueError('bad output')
        self.client.force_login(self.owner)
        response = self.client.post(self.url, self.payload(), content_type='application/json')
        self.assertEqual(response.status_code, 502)
        self.assertNotIn('draft', response.json())

    @patch('legitorganic.writing_assistant._call_groq')
    def test_per_user_hourly_limit(self, groq):
        groq.return_value = {'text': 'Draft text'}
        cache.set(f'writing-assistant:{self.owner.pk}', 20, timeout=3600)
        self.client.force_login(self.owner)
        response = self.client.post(self.url, self.payload(), content_type='application/json')
        self.assertEqual(response.status_code, 429)
        groq.assert_not_called()

    def test_assistant_panel_appears_on_all_three_editor_forms(self):
        self.client.force_login(self.owner)
        for url_name in [
            'admin:products_product_add',
            'admin:blog_blogpost_add',
            'admin:recipes_recipe_add',
        ]:
            with self.subTest(url_name=url_name):
                response = self.client.get(reverse(url_name))
                self.assertEqual(response.status_code, 200)
                self.assertContains(response, 'data-writing-assistant')
                self.assertContains(response, 'What should this say?')
                if url_name == 'admin:recipes_recipe_add':
                    self.assertContains(response, 'Research complete recipe')
                    self.assertContains(response, 'value="Ghana"')

    def test_recipe_form_script_targets_unfold_inline_add_link(self):
        script_path = (
            Path(__file__).resolve().parents[1]
            / 'products/static/admin/js/legitorganic-admin.js'
        )
        script = script_path.read_text()
        self.assertIn('`#${prefix}-group a.add-row`', script)
        self.assertNotIn('`#${prefix}-group .add-row a`', script)
