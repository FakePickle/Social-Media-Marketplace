import pyotp
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import hashes
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models

# Generate a key for encryption
key = Fernet.generate_key()
cipher = Fernet(key)


class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
        
    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
            
        return self.create_user(email, username, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=150)
    dob = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    address = models.CharField(max_length=255, null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pics/", null=True, blank=True
    )
    private_key = models.TextField(null=True, blank=True)
    public_key = models.TextField(null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
    totp_secret = models.CharField(max_length=32, blank=True)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    def generate_totp_secret(self):
        if not self.totp_secret:
            self.totp_secret = pyotp.random_base32()
            self.save()

    def get_totp_uri(self):
        return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
            name=self.username,
            issuer_name="Rivr",
        )


class OTPVerification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def verify_otp(self, otp):
        totp = pyotp.TOTP(self.user.totp_secret)
        return totp.verify(otp)



class Message(models.Model):
    sender = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="sent_messages"
    )
    receiver = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="received_messages"
    )
    content = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def encrypt_message(plain_text, sender, receiver):
        from cryptography.hazmat.primitives import serialization

        # Load senders private key
        private_key = serialization.load_pem_private_key(
            sender.private_key.encode(),
            password=None
        )
        # Encrypt the message using the sender's private key
        encrypted = private_key.encrypt(
            plain_text.encode(),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        public_key = serialization.load_pem_public_key(
            receiver.public_key.encode()
        )
        # Encrypt the message using the receiver's public key
        encrypted = public_key.encrypt(
            encrypted,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )

        # Return the encrypted message as a hex string
        return encrypted.hex()

    @staticmethod
    def decrypt_message(encrypted_message, sender, receiver):
        from cryptography.hazmat.primitives import serialization

        # Load the sender's public key
        public_key = serialization.load_pem_public_key(
            sender.public_key.encode()
        )
        # Decrypt the message using the sender's public key
        decrypted = public_key.decrypt(
            bytes.fromhex(encrypted_message),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        # Load the receiver's private key
        private_key = serialization.load_pem_private_key(
            receiver.private_key.encode(),
            password=None
        )
        # Decrypt the message using the receiver's private key
        decrypted = private_key.decrypt(
            decrypted,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        # Return the decrypted message as a string
        return decrypted.decode()

    def save(self, *args, **kwargs):
        if not self.content.startswith("-----BEGIN"):  # Only encrypt plain text
            self.encrypt_message(self.content)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Message from {self.sender} to {self.receiver} at {self.timestamp}"


