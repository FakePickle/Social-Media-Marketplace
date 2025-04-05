from django.contrib import admin

from .models import Message

# Register the Profile model (if custom user profile is used)
# admin.site.register(Profile)

# Register Message model
admin.site.register(Message)
