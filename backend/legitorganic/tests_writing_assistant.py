from unittest.mock import patch

from django.core.cache import cache
from django.test import Client, TestCase
from django.urls import reverse

from products.models import Product
from users.models import User
from .writing_assistant import SYSTEM_PROMPT, _prompt


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
            'product', 'description', 'Describe garden eggs.',
            {'name': 'Garden eggs'}, ['Tomatoes', 'Onions'],
        )
        self.assertNotIn('Tomatoes', product_prompt)
        self.assertNotIn('Onions', product_prompt)
        self.assertIn('restrained rewrite of those anchors', product_prompt)
        self.assertIn('when the anchors are sparse, make the answer shorter', product_prompt)

    def test_complete_blog_draft_is_long_form_without_padding(self):
        prompt = _prompt(
            'blog', 'draft',
            'Explain how harvest timing affects freshness for customers in Accra.',
            {'title': 'From harvest to kitchen'}, [],
        )
        self.assertIn('900-1400 word first draft', prompt)
        self.assertIn('clear editorial through-line', prompt)
        self.assertIn('Never pad the article or invent facts', prompt)
        self.assertIn('return a shorter complete draft', prompt)

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
        response = self.client.post(self.url, self.payload(
            kind='blog', task='draft', instruction='Write a practical guide to storing leafy vegetables.'
        ), content_type='application/json')
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
            ],
            'steps': [{'instruction': 'Wash and slice the leaves.'}],
        }
        self.client.force_login(self.owner)
        response = self.client.post(self.url, self.payload(
            kind='recipe', task='method', instruction='Draft a simple kontomire method for four people.'
        ), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        ingredients = response.json()['draft']['ingredients']
        self.assertEqual(ingredients[0]['product_id'], product.pk)
        self.assertEqual(ingredients[1]['product_id'], '')

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
