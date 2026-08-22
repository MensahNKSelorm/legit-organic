from django.test import TestCase

from blog.models import BlogPost
from blog.serializers import BlogPostDetailSerializer
from products.models import Product
from products.serializers import ProductSerializer


class PublicRichTextSanitisationTests(TestCase):
    def test_product_html_removes_script_and_event_handlers(self):
        product = Product.objects.create(name='Test', slug='test', price='1.00', unit='each')
        product.description = '<p onclick="steal()">Safe</p><script>steal()</script>'
        rendered = ProductSerializer(product).data['description']
        self.assertIn('<p>Safe</p>', rendered)
        self.assertNotIn('onclick', rendered)
        self.assertNotIn('<script', rendered)

    def test_blog_html_removes_javascript_urls(self):
        post = BlogPost(title='Test', slug='test', content='<a href="javascript:steal()">Read</a>')
        rendered = BlogPostDetailSerializer(post).data['content']
        self.assertNotIn('javascript:', rendered)
