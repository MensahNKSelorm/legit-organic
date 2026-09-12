from decimal import Decimal

from django.core.exceptions import ValidationError
from django.test import TestCase
from django.urls import reverse

from .models import Category, Product


class StorefrontReadinessTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Vegetables')

    def test_zero_price_product_is_not_listed(self):
        Product.objects.create(
            name='Price awaiting confirmation',
            price=Decimal('0.00'),
            unit='1 kg',
            category=self.category,
            is_available=True,
        )

        response = self.client.get(reverse('product-list'))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), [])

    def test_zero_price_product_detail_is_not_public(self):
        product = Product.objects.create(
            name='Incomplete item',
            price=Decimal('0.00'),
            unit='piece',
            category=self.category,
            is_available=True,
        )

        response = self.client.get(reverse('product-detail', args=[product.slug]))

        self.assertEqual(response.status_code, 404)

    def test_model_validation_rejects_non_positive_price(self):
        product = Product(
            name='Invalid price',
            price=Decimal('0.00'),
            unit='piece',
            category=self.category,
        )

        with self.assertRaises(ValidationError):
            product.full_clean()
