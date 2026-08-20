from django.db import migrations, models
import django.db.models.deletion
from django.utils.text import slugify


ALIASES = {
    'Agriculture': 'Farming & Sustainability',
    'Health & Nutrition': 'Nutrition & Health',
}
SECTIONS = ('Farming & Sustainability', 'Nutrition & Health', 'Recipes & Cooking')


def link_topics_to_sections(apps, schema_editor):
    BlogCategory = apps.get_model('blog', 'BlogCategory')
    BlogPost = apps.get_model('blog', 'BlogPost')
    BlogTopic = apps.get_model('blog', 'BlogTopic')

    def available_slug(name, exclude_pk=None):
        base = slugify(name) or 'journal-section'
        value, suffix = base, 2
        query = BlogCategory.objects.filter(slug=value)
        if exclude_pk:
            query = query.exclude(pk=exclude_pk)
        while query.exists():
            value = f'{base}-{suffix}'
            suffix += 1
            query = BlogCategory.objects.filter(slug=value)
            if exclude_pk:
                query = query.exclude(pk=exclude_pk)
        return value

    def get_or_create_category(name):
        category = BlogCategory.objects.filter(name=name).first()
        if category is None:
            category = BlogCategory.objects.create(name=name, slug=available_slug(name))
        return category

    for old_name, new_name in ALIASES.items():
        old = BlogCategory.objects.filter(name=old_name).first()
        canonical = BlogCategory.objects.filter(name=new_name).first()
        if canonical is None and old is not None:
            old.name = new_name
            old.slug = available_slug(new_name, exclude_pk=old.pk)
            old.save(update_fields=['name', 'slug'])
            canonical = old
        elif canonical is None:
            canonical = get_or_create_category(new_name)
        if old is not None and old.pk != canonical.pk:
            BlogPost.objects.filter(category=old).update(category=canonical)
            old.delete()

    categories = {
        name: get_or_create_category(name)
        for name in SECTIONS
    }
    for topic in BlogTopic.objects.all():
        name = ALIASES.get(topic.legacy_category, topic.legacy_category)
        category = categories.get(name)
        if category is None:
            category = get_or_create_category(name)
        topic.category = category
        topic.save(update_fields=['category'])


def restore_category_names(apps, schema_editor):
    BlogTopic = apps.get_model('blog', 'BlogTopic')
    for topic in BlogTopic.objects.select_related('category'):
        topic.legacy_category = topic.category.name
        topic.save(update_fields=['legacy_category'])


class Migration(migrations.Migration):
    dependencies = [('blog', '0004_alter_blogpost_slug')]

    operations = [
        migrations.RenameField(
            model_name='blogtopic',
            old_name='category',
            new_name='legacy_category',
        ),
        migrations.AddField(
            model_name='blogtopic',
            name='category',
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name='topics',
                to='blog.blogcategory',
            ),
        ),
        migrations.RunPython(link_topics_to_sections, restore_category_names),
        migrations.RemoveField(model_name='blogtopic', name='legacy_category'),
        migrations.AlterField(
            model_name='blogtopic',
            name='category',
            field=models.ForeignKey(
                help_text='Journal section this subject belongs to.',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='topics',
                to='blog.blogcategory',
            ),
        ),
    ]
