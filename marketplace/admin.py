from django.contrib import admin
from django.contrib.auth.models import User
from .models import Profile, Message

# Register the Profile model (if custom user profile is used)
admin.site.register(Profile)

# Register Message model
admin.site.register(Message)

# Customizing the User model in Admin
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('username', 'email')

admin.site.unregister(User)
admin.site.register(User, UserAdmin)
