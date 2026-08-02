"""Weekly auto-blog: research a rotating topic with Tavily, generate a grounded
draft, and save it UNPUBLISHED for staff review.

Topics live in the BlogTopic model (editable in the admin at any time). On the
first run, if none exist, a default set is seeded.

Usage:
    python manage.py generate_weekly_blog            # normal weekly run
    python manage.py generate_weekly_blog --dry-run  # research + generate, print, save nothing
    python manage.py generate_weekly_blog --topic "Soil health in Ghana"
    python manage.py generate_weekly_blog --no-notify

Safety: if research is too thin, the run SKIPS (no post) rather than letting the
model invent facts. Drafts are always is_published=False.
"""
import logging
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify

from blog.models import BlogPost, BlogCategory, BlogTopic
from blog.research import gather_research
from blog.generation import generate_post

logger = logging.getLogger(__name__)

# Seeded into BlogTopic only when the table is empty. After that, manage topics
# in the admin — this list is not consulted again.
DEFAULT_TOPICS = [
    ('Sustainable farming practices for smallholder farmers in Ghana', 'Agriculture'),
    ('The health benefits of eating seasonal vegetables', 'Health & Nutrition'),
    ('Reducing post-harvest food loss on small farms', 'Agriculture'),
    ('Soil health and organic matter for better yields', 'Agriculture'),
    ('Building a balanced diet with local Ghanaian foods', 'Health & Nutrition'),
    ('Climate change and food production in West Africa', 'Agriculture'),
    ('Food safety and safe handling at home', 'Health & Nutrition'),
    ('The role of beans and legumes in healthy eating', 'Health & Nutrition'),
    ('Water use and irrigation for smallholder farms', 'Agriculture'),
    ('Composting and natural fertiliser for home gardens', 'Agriculture'),
]


def _seed_topics_if_empty():
    if not BlogTopic.objects.exists():
        BlogTopic.objects.bulk_create(
            [BlogTopic(topic=t, category=c) for t, c in DEFAULT_TOPICS]
        )


def _recent_titles(limit=8):
    return [t.lower() for t in BlogPost.objects.order_by('-created_at').values_list('title', flat=True)[:limit]]


def _key(topic):
    """First distinctive word (skips short stopwords like 'the'/'and')."""
    for w in topic.lower().replace('/', ' ').split():
        if len(w) > 3:
            return w
    return topic.lower()


def _pick_topic():
    """Least-recently-used active topic, skipping any whose distinctive keyword
    is in a recent post title. Returns a BlogTopic or None."""
    active = list(BlogTopic.objects.filter(is_active=True))
    if not active:
        return None
    never = [t for t in active if t.last_used_at is None]
    used = sorted((t for t in active if t.last_used_at), key=lambda t: t.last_used_at)
    ordered = never + used
    recent = _recent_titles()
    for t in ordered:
        if not any(_key(t.topic) in title for title in recent):
            return t
    return ordered[0]


def _author():
    User = get_user_model()
    email = os.getenv('BLOG_BOT_AUTHOR_EMAIL', 'editor@legitorganic.com').strip()
    user, created = User.objects.get_or_create(
        email=email,
        defaults={'first_name': 'Legit Organic', 'last_name': 'Editor', 'is_active': False},
    )
    if created:
        user.set_unusable_password()
        user.save(update_fields=['password'])
    return user


class Command(BaseCommand):
    help = 'Generate a grounded weekly blog draft (unpublished) for staff review.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Do everything except save the post.')
        parser.add_argument('--topic', type=str, default=None, help='Override the topic (not saved to the pool).')
        parser.add_argument('--no-notify', action='store_true', help='Do not notify admins.')

    def handle(self, *args, **opts):
        if opts['topic']:
            topic_obj, topic, category_name = None, opts['topic'], 'Agriculture'
        else:
            _seed_topics_if_empty()
            topic_obj = _pick_topic()
            if topic_obj is None:
                self.stdout.write(self.style.WARNING('No active topics — nothing to do.'))
                return
            topic, category_name = topic_obj.topic, topic_obj.category
        self.stdout.write(f'Topic: {topic}')

        sources, enough = gather_research(topic)
        self.stdout.write(f'Research: {len(sources)} sources (enough={enough})')
        if not enough:
            msg = f'Skipped weekly blog: only {len(sources)} sources for "{topic}" (grounding guard).'
            self.stdout.write(self.style.WARNING(msg))
            if not opts['no_notify']:
                self._notify_skip(topic, len(sources))
            return

        try:
            draft = generate_post(topic, sources)
        except RuntimeError as e:
            self.stdout.write(self.style.ERROR(f'Generation unavailable: {e}'))
            return
        except Exception as e:
            logger.error('Weekly blog generation failed for %r: %s', topic, e, exc_info=True)
            self.stdout.write(self.style.ERROR(f'Generation failed: {e}'))
            return

        if opts['dry_run']:
            self.stdout.write(self.style.SUCCESS('DRY RUN — not saved'))
            self.stdout.write(f"Title: {draft['title']}")
            self.stdout.write(f"Excerpt: {draft['excerpt']}")
            self.stdout.write(f"Tags: {draft['tags']}")
            self.stdout.write(f"Content ({len(draft['content'])} chars):\n{draft['content'][:1500]}...")
            return

        category, _ = BlogCategory.objects.get_or_create(name=category_name, defaults={'slug': ''})
        # Bounded, unique slug — AI titles can exceed the default slug length and
        # two runs could share a title.
        base = slugify(draft['title'])[:200] or 'weekly-post'
        slug, n = base, 2
        while BlogPost.objects.filter(slug=slug).exists():
            slug = f'{base}-{n}'
            n += 1
        post = BlogPost.objects.create(
            title=draft['title'],
            slug=slug,
            content=draft['content'],
            excerpt=draft['excerpt'],
            tags=draft['tags'],
            category=category,
            author=self._author_safe(),
            is_published=False,  # ALWAYS a draft — staff reviews and publishes
        )
        if topic_obj is not None:
            topic_obj.last_used_at = timezone.now()
            topic_obj.save(update_fields=['last_used_at'])
        self.stdout.write(self.style.SUCCESS(f'Draft created (unpublished): "{post.title}" [id={post.id}]'))

        if not opts['no_notify']:
            self._notify_ready(post)

    def _author_safe(self):
        try:
            return _author()
        except Exception as e:
            logger.warning('Could not resolve blog author, leaving null: %s', e)
            return None

    def _notify_ready(self, post):
        try:
            from notifications.utils import notify_admins
            notify_admins(
                type='blog_draft',
                title='New weekly blog draft',
                body=f'A draft "{post.title}" is ready for review.',
                link=f'/admin/blog/blogpost/{post.pk}/change/',
            )
        except Exception as e:
            logger.warning('blog_draft notification failed: %s', e)

    def _notify_skip(self, topic, count):
        try:
            from notifications.utils import notify_admins
            notify_admins(
                type='blog_draft',
                title='Weekly blog skipped',
                body=f'Not enough research for "{topic}" ({count} sources); no draft generated.',
                link='/admin/blog/blogpost/',
            )
        except Exception as e:
            logger.warning('blog_skip notification failed: %s', e)
