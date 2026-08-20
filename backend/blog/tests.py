from unittest import mock

from django.core.management import call_command
from django.test import TestCase

from blog.models import BlogCategory, BlogPost, BlogTopic

CMD = 'blog.management.commands.generate_weekly_blog'


def sources(n=3):
    return [
        {'title': f'Source {i}', 'snippet': 'fact ' * 5, 'url': f'http://example.com/{i}', 'source': 'Web'}
        for i in range(n)
    ]


DRAFT = {'title': 'Test Post', 'excerpt': 'An excerpt.', 'tags': 'soil, health', 'content': '<p>Hello</p>'}


class WeeklyBlogCommandTests(TestCase):
    @mock.patch(f'{CMD}.generate_post', return_value=DRAFT)
    @mock.patch(f'{CMD}.gather_research', return_value=(sources(), True))
    def test_creates_unpublished_draft(self, m_research, m_gen):
        call_command('generate_weekly_blog', '--no-notify', '--topic', 'Soil health in Ghana')
        post = BlogPost.objects.get(title='Test Post')
        self.assertFalse(post.is_published)              # always a draft
        self.assertIsNotNone(post.author)
        self.assertEqual(post.author.email, 'editor@legitorganic.com')
        self.assertFalse(post.author.is_active)          # attribution-only, cannot log in
        self.assertIsNotNone(post.category)

    @mock.patch(f'{CMD}.generate_post')
    @mock.patch(f'{CMD}.gather_research', return_value=(sources(1), False))
    def test_skips_when_research_thin(self, m_research, m_gen):
        call_command('generate_weekly_blog', '--no-notify', '--topic', 'X')
        self.assertEqual(BlogPost.objects.count(), 0)    # no invented-fact post
        m_gen.assert_not_called()

    @mock.patch(f'{CMD}.generate_post', return_value=DRAFT)
    @mock.patch(f'{CMD}.gather_research', return_value=(sources(), True))
    def test_dry_run_saves_nothing(self, m_research, m_gen):
        call_command('generate_weekly_blog', '--dry-run', '--no-notify', '--topic', 'X')
        self.assertEqual(BlogPost.objects.count(), 0)

    @mock.patch(f'{CMD}.generate_post', return_value=DRAFT)
    @mock.patch(f'{CMD}.gather_research', return_value=(sources(), True))
    def test_seeds_topics_and_stamps_last_used(self, m_research, m_gen):
        self.assertEqual(BlogTopic.objects.count(), 0)
        call_command('generate_weekly_blog', '--no-notify')      # no --topic -> uses the pool
        self.assertTrue(BlogTopic.objects.exists())              # seeded on first run
        # exactly one topic was used this run
        self.assertEqual(BlogTopic.objects.filter(last_used_at__isnull=False).count(), 1)

    def test_pick_topic_prefers_unused_and_skips_recent(self):
        from blog.management.commands.generate_weekly_blog import _pick_topic, _key, _seed_topics_if_empty
        _seed_topics_if_empty()
        natural = _pick_topic()                          # no posts yet -> some unused topic
        BlogPost.objects.create(title=natural.topic, content='<p>x</p>', is_published=True)
        picked = _pick_topic()
        self.assertNotEqual(_key(picked.topic), _key(natural.topic))

    def test_inactive_topics_are_not_used(self):
        from blog.management.commands.generate_weekly_blog import _pick_topic
        category = BlogCategory.objects.get(name='Farming & Sustainability')
        BlogTopic.objects.create(topic='Only active one', category=category, is_active=True)
        BlogTopic.objects.create(topic='Deactivated topic', category=category, is_active=False)
        self.assertEqual(_pick_topic().topic, 'Only active one')

    def test_pick_topic_rotates_sections_before_repeating(self):
        from blog.management.commands.generate_weekly_blog import _pick_topic, _seed_topics_if_empty
        from django.utils import timezone

        _seed_topics_if_empty()
        sections = []
        for _ in range(3):
            topic = _pick_topic()
            sections.append(topic.category.name)
            topic.last_used_at = timezone.now()
            topic.save(update_fields=['last_used_at'])

        self.assertEqual(set(sections), {
            'Farming & Sustainability', 'Nutrition & Health', 'Recipes & Cooking',
        })


class GenerationTests(TestCase):
    @mock.patch('blog.generation.call_groq')
    def test_generate_post_sanitises_and_appends_sources(self, m_call):
        m_call.return_value = {
            'title': 'T', 'excerpt': 'E', 'tags': 'a, b',
            'content_html': '<p>ok</p><script>bad()</script>',
        }
        from blog.generation import generate_post
        d = generate_post('topic', [{'title': 'S1', 'snippet': 'x', 'url': 'http://example.com/a', 'source': 'Web'}])
        self.assertNotIn('<script', d['content'])        # script stripped
        self.assertIn('Further reading', d['content'])   # sources appended
        self.assertIn('http://example.com/a', d['content'])

    @mock.patch('blog.generation.call_groq', return_value={'title': '', 'content_html': ''})
    def test_empty_draft_rejected(self, m_call):
        from blog.generation import generate_post
        with self.assertRaises(ValueError):
            generate_post('topic', [{'title': 'S', 'snippet': 'x', 'url': 'http://e/1', 'source': 'Web'}])

    @mock.patch('blog.generation.call_groq')
    def test_research_source_html_is_escaped_and_unsafe_urls_rejected(self, m_call):
        m_call.return_value = {
            'title': 'T', 'excerpt': 'E', 'tags': 'a', 'content_html': '<p>Safe</p>',
        }
        from blog.generation import generate_post
        draft = generate_post('topic', [
            {
                'title': '<img src=x onerror=alert(1)>', 'snippet': 'x',
                'url': 'https://example.com/safe', 'source': 'Web',
            },
            {
                'title': 'Unsafe attribute URL', 'snippet': 'x',
                'url': 'https://example.com/?q=\" onmouseover=alert(1)', 'source': 'Web',
            },
            {
                'title': 'Unsafe protocol', 'snippet': 'x',
                'url': 'javascript:alert(1)', 'source': 'Web',
            },
        ])
        self.assertNotIn('<img', draft['content'])
        self.assertNotIn('javascript:', draft['content'])
        self.assertNotIn('onmouseover=', draft['content'])
        self.assertIn('&lt;img', draft['content'])


class ResearchTests(TestCase):
    def test_web_search_disabled_without_key(self):
        from blog.research import fetch_web
        with mock.patch.dict('os.environ', {}, clear=True):
            self.assertEqual(fetch_web('soil health'), [])

    @mock.patch('blog.research.fetch_web', return_value=[
        {'title': 'A', 'snippet': 's', 'url': 'http://dup', 'source': 'Web'},
        {'title': 'B', 'snippet': 's', 'url': 'http://dup', 'source': 'Web'},
        {'title': 'C', 'snippet': 's', 'url': 'http://unique', 'source': 'Web'},
    ])
    def test_gather_dedupes_by_url(self, m_web):
        from blog.research import gather_research
        combined, enough = gather_research('topic')
        self.assertEqual(sorted(s['url'] for s in combined), ['http://dup', 'http://unique'])
        self.assertFalse(enough)  # 2 distinct < MIN_SOURCES
