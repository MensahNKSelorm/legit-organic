from django.contrib import admin
from .models import Farm, Certification, Product, BlogPost, ContactMessage

# Register your models here.
admin.site.register(Farm)
admin.site.register(Certification)
admin.site.register(Product)
admin.site.register(BlogPost)
admin.site.register(ContactMessage)