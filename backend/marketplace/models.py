from django.db import models
from django.contrib.auth.models import User
from cryptography.fernet import Fernet

# Generate a key for encryption
key = Fernet.generate_key()
cipher = Fernet(key)

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_messages")
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name="received_messages")
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def encrypt_message(self):
        self.content = cipher.encrypt(self.content.encode()).decode()

    def decrypt_message(self):
        return cipher.decrypt(self.content.encode()).decode()

    def save(self, *args, **kwargs):
        self.encrypt_message()
        super().save(*args, **kwargs)
