"""Weekly auto-blog: research a rotating topic with Tavily, generate a grounded
draft, and save it UNPUBLISHED for staff review.

Topics live in the BlogTopic model (editable in the admin at any time). Missing
defaults are added without reactivating or overwriting staff-managed topics.

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
import random

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone
from django.utils.text import slugify

from blog.models import BlogPost, BlogCategory, BlogTopic
from blog.research import gather_research
from blog.generation import generate_post

logger = logging.getLogger(__name__)

# Ensures each standard Journal section has a useful starting pool. Existing
# topics and staff activation choices are never overwritten.
DEFAULT_TOPICS = [
    ('Sustainable farming practices for smallholder farmers in Ghana', 'Farming & Sustainability'),
    ('Reducing post-harvest food loss on small farms', 'Farming & Sustainability'),
    ('Soil health and organic matter for better yields', 'Farming & Sustainability'),
    ('Climate change and food production in West Africa', 'Farming & Sustainability'),
    ('Water use and irrigation for smallholder farms', 'Farming & Sustainability'),
    ('The health benefits of eating seasonal vegetables', 'Nutrition & Health'),
    ('Building a balanced diet with local Ghanaian foods', 'Nutrition & Health'),
    ('Food safety and safe handling at home', 'Nutrition & Health'),
    ('The role of beans and legumes in healthy eating', 'Nutrition & Health'),
    ('How to build flavour with Ghanaian herbs and spices', 'Recipes & Cooking'),
    ('Practical ways to cook more with seasonal produce', 'Recipes & Cooking'),
    ('Batch cooking Ghanaian staples for a busy week', 'Recipes & Cooking'),
    ('Reducing food waste through everyday kitchen planning', 'Recipes & Cooking'),
]


def _seed_topics_if_empty():
    """Ensure the editorial pool covers every standard Journal section."""
    for topic, category_name in DEFAULT_TOPICS:
        category, _ = BlogCategory.objects.get_or_create(name=category_name)
        BlogTopic.objects.get_or_create(topic=topic, defaults={'category': category})


def _recent_titles(limit=8):
    return [
        t.lower()
        for t in BlogPost.objects.order_by('-created_at').values_list('title', flat=True)[:limit]
    ]


def _key(topic):
    """First distinctive word (skips short stopwords like 'the'/'and')."""
    for w in topic.lower().replace('/', ' ').split():
        if len(w) > 3:
            return w
    return topic.lower()


def _pick_topic():
    """Choose a varied section first, then a varied topic within that section."""
    active = list(BlogTopic.objects.filter(is_active=True).select_related('category'))
    if not active:
        return None
    recent = _recent_titles()
    eligible = [
        topic for topic in active if not any(_key(topic.topic) in title for title in recent)
    ] or active

    by_category = {}
    for topic in eligible:
        by_category.setdefault(topic.category_id, []).append(topic)

    # A section is considered recently used when any topic in it was used.
    # Never-used sections sort first; random choice prevents a fixed seed order.
    section_last_used = {
        category_id: max(
            (topic.last_used_at for topic in topics if topic.last_used_at),
            default=None,
        )
        for category_id, topics in by_category.items()
    }
    oldest_section_use = min(
        section_last_used.values(),
        key=lambda value: (value is not None, value or timezone.now()),
    )
    section_candidates = [
        category_id
        for category_id, last_used in section_last_used.items()
        if last_used == oldest_section_use
    ]
    chosen_section = random.choice(section_candidates)
    section_topics = by_category[chosen_section]
    oldest_topic_use = min(
        (topic.last_used_at for topic in section_topics),
        key=lambda value: (value is not None, value or timezone.now()),
    )
    topic_candidates = [topic for topic in section_topics if topic.last_used_at == oldest_topic_use]
    return random.choice(topic_candidates)


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
        parser.add_argument(
            '--dry-run', action='store_true', help='Do everything except save the post.'
        )
        parser.add_argument(
            '--topic', type=str, default=None, help='Override the topic (not saved to the pool).'
        )
        parser.add_argument(
            '--category', type=str, default=None, help='Journal section for an overridden topic.'
        )
        parser.add_argument('--no-notify', action='store_true', help='Do not notify admins.')

    def handle(self, *args, **opts):
        if opts['topic']:
            topic_obj, topic = None, opts['topic']
            category_name = opts['category'] or 'Farming & Sustainability'
        else:
            _seed_topics_if_empty()
            topic_obj = _pick_topic()
            if topic_obj is None:
                self.stdout.write(self.style.WARNING('No active topics — nothing to do.'))
                return
            topic, category_name = topic_obj.topic, topic_obj.category.name
        self.stdout.write(f'Section: {category_name}\nTopic: {topic}')

        sources, enough = gather_research(topic)
        self.stdout.write(f'Research: {len(sources)} sources (enough={enough})')
        if not enough:
            msg = (
                f'Skipped weekly blog: only {len(sources)} sources for "{topic}" (grounding guard).'
            )
            self.stdout.write(self.style.WARNING(msg))
            if not opts['no_notify']:
                self._notify_skip(topic, len(sources))
            return

        try:
            draft = generate_post(topic, sources)
        except RuntimeError as e:
            if not opts['no_notify']:
                self._notify_failure(topic, 'The writing service is not configured.')
            raise CommandError(f'Generation unavailable: {e}') from e
        except Exception as e:
            logger.error('Weekly blog generation failed for %r: %s', topic, e, exc_info=True)
            if not opts['no_notify']:
                self._notify_failure(topic, 'The writing service returned an error.')
            raise CommandError(f'Generation failed: {e}') from e

        if opts['dry_run']:
            self.stdout.write(self.style.SUCCESS('DRY RUN — not saved'))
            self.stdout.write(f"Title: {draft['title']}")
            self.stdout.write(f"Excerpt: {draft['excerpt']}")
            self.stdout.write(f"Tags: {draft['tags']}")
            self.stdout.write(
                f"Content ({len(draft['content'])} chars):\n{draft['content'][:1500]}..."
            )
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
        self.stdout.write(
            self.style.SUCCESS(f'Draft created (unpublished): "{post.title}" [id={post.id}]')
        )

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

    def _notify_failure(self, topic, reason):
        try:
            from notifications.utils import notify_admins

            notify_admins(
                type='blog_draft',
                title='Weekly blog needs attention',
                body=f'{reason} No draft was created for "{topic}".',
                link='/admin/blog/blogpost/',
            )
        except Exception as e:
            logger.warning('blog_failure notification failed: %s', e)
