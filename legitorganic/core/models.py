from django.db import models

# Create your models here.
class Certification(models.Model):
    name = models.CharField(max_length=200)
    issuer = models.CharField(max_length=200, blank=True)
    certification_file = models.FileField(upload_to='certifications/', null=True, blank=True)
    issued_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name


class Farm(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(blank=True, unique=True)
    location = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    established_year = models.PositiveSmallIntegerField(null=True, blank=True)
    organic_certifications = models.ManyToManyField(Certification, blank=True)
    photo = models.ImageField(upload_to='photos/', null=True, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(blank=True, unique=True)
    farm = models.ForeignKey(Farm, on_delete=models.CASCADE, related_name='products')
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=50, unique=True)
    price_per_kg = models.DecimalField(decimal_places=2, max_digits=10)
    packing_sizes = models.JSONField(blank=True, null=True)
    farming_method = models.CharField(max_length=50, choices=[
        ('organic', 'Organic'),
        ('conventional', 'Conventional'),
        ('integrated', 'Integrated'),
    ], default='organic')
    available = models.BooleanField(default=True)
    main_image = models.ImageField(upload_to='products/', null=True, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class BlogPost(models.Model):
    title = models.CharField(max_length=200)
    slug = models.SlugField(blank=True, unique=True)
    excerpt = models.TextField(max_length=300, blank=True)
    content = models.TextField()
    author = models.CharField(max_length=100, blank=True)
    published = models.BooleanField(default=True)
    published_at = models.DateTimeField(null=True, blank=True)
    cover_image = models.ImageField(upload_to='blogs/', null=True, blank=True)

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        if not self.slug:
            from django.utils.text import slugify
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)


class ContactMessage(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    responded = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.name} - {self.subject}"
