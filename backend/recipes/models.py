from django.db import models
from django.conf import settings
from django.utils.text import slugify


class Recipe(models.Model):
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]

    title = models.CharField(max_length=300)
    slug = models.SlugField(unique=True, blank=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='recipes/', blank=True, null=True)
    prep_time = models.PositiveIntegerField(default=0, help_text='In minutes')
    cook_time = models.PositiveIntegerField(default=0, help_text='In minutes')
    servings = models.PositiveIntegerField(default=1)
    difficulty = models.CharField(max_length=10, choices=DIFFICULTY_CHOICES, default='easy')
    is_default = models.BooleanField(default=False, help_text='Curated by Legit Organic')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='recipes'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class RecipeIngredient(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='ingredients')
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL,
        null=True, blank=True
    )
    name = models.CharField(max_length=200)
    quantity = models.CharField(max_length=50)
    unit = models.CharField(max_length=50, blank=True)
    notes = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.name}".strip()


class RecipeStep(models.Model):
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, related_name='steps')
    step_number = models.PositiveIntegerField()
    instruction = models.TextField()
    image = models.ImageField(upload_to='recipe_steps/', blank=True, null=True)

    class Meta:
        ordering = ['step_number']

    def __str__(self):
        return f"Step {self.step_number} — {self.recipe.title}"


class RecipePairing(models.Model):
    base_recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name='pairings'
    )
    suggested_recipe = models.ForeignKey(
        Recipe, on_delete=models.CASCADE, related_name='pairing_suggestions'
    )
    label = models.CharField(max_length=100, default='Usually served with')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = [['base_recipe', 'suggested_recipe']]

    def __str__(self):
        return f"{self.base_recipe} → {self.suggested_recipe}"


class UserRecipe(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='user_recipes'
    )
    name = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    base_recipes = models.ManyToManyField(Recipe, blank=True)
    is_saved = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.user})"


class UserRecipeIngredient(models.Model):
    user_recipe = models.ForeignKey(
        UserRecipe, on_delete=models.CASCADE, related_name='ingredients'
    )
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL, null=True, blank=True
    )
    name = models.CharField(max_length=200)
    quantity = models.DecimalField(max_digits=8, decimal_places=2)
    unit = models.CharField(max_length=50)
    notes = models.TextField(blank=True)
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.quantity} {self.unit} {self.name}".strip()
