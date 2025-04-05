from cryptography.fernet import Fernet
from django.contrib.auth.models import AbstractUser
from django.db import models

# Generate a key for encryption
key = Fernet.generate_key()
cipher = Fernet(key)


class Message(models.Model):
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="sent_messages"
    )
    receiver = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="received_messages"
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def encrypt_message(self):
        self.content = cipher.encrypt(self.content.encode()).decode()

    def decrypt_message(self):
        return cipher.decrypt(self.content.encode()).decode()

    def save(self, *args, **kwargs):
        self.encrypt_message()
        super().save(*args, **kwargs)


class CustomUser(AbstractUser):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=150)
    dob = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pics/", null=True, blank=True
    )
    bio = models.TextField(null=True, blank=True)
    public_key = models.TextField(blank=True)
    private_key = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.username

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def generate_keys(self):
        # Generate public and private keys for encryption
        pass
