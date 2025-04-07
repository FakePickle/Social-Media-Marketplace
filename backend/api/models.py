import pyotp
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from decouple import config
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models

# Generate a key for encryption
key = Fernet.generate_key()
cipher = Fernet(key)


class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

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

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_short_name(self):
        return self.first_name

    def generate_keys(self):
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_key = private_key.public_key()

        self.private_key = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.BestAvailableEncryption(
                config("RSA_PASSPHRASE").encode()
            ),
        ).decode()

        self.public_key = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()

        self.save()

    def generate_totp_secret(self):
        if not self.totp_secret:
            self.totp_secret = pyotp.random_base32()
            self.save()

    def get_totp_uri(self):
        return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
            name=self.username,
            issuer_name="Rivr",
        )

    def get_secret(self):
        return self.totp_secret


class OTPVerification(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def verify_otp(self, otp):
        totp = pyotp.TOTP(self.user.totp_secret)
        return totp.verify(otp)


class Friendship(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="friendship_user1"
    )
    friend = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="friendship_user2"
    )
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Ensure user1 has a smaller ID to avoid duplicate mirrored friendships
        if self.user.id > self.friend.id:
            self.user, self.friend = self.friend, self.user2
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user} ↔ {self.friend}"


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
        from cryptography.hazmat.primitives import serialization, hashes
        from cryptography.hazmat.primitives.asymmetric import padding
        from decouple import config

        # Load sender's private key (for signing)
        private_key = serialization.load_pem_private_key(
            sender.private_key.encode(), 
            password=config("RSA_PASSPHRASE").encode()
        )

        # Sign the message
        signature = private_key.sign(
            plain_text.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH,
            ),
            hashes.SHA256(),
        )

        # Load receiver's public key (for encryption)
        public_key = serialization.load_pem_public_key(receiver.public_key.encode())

        # Encrypt the plaintext
        ciphertext = public_key.encrypt(
            plain_text.encode(),
            padding.OAEP(
                mgf=padding.MGF1(hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )

        # Return both encrypted message and signature (you can encode with base64 or hex)
        return {
            "ciphertext": ciphertext.hex(),
            "signature": signature.hex()
        }


    @staticmethod
    def decrypt_message(ciphertext_hex, signature_hex, sender, receiver):
        from cryptography.hazmat.primitives import serialization, hashes
        from cryptography.hazmat.primitives.asymmetric import padding
        from cryptography.exceptions import InvalidSignature
        from decouple import config

        ciphertext = bytes.fromhex(ciphertext_hex)
        signature = bytes.fromhex(signature_hex)

        # Load receiver's private key (to decrypt message)
        private_key = serialization.load_pem_private_key(
            receiver.private_key.encode(), 
            password=config("RSA_PASSPHRASE").encode()
        )

        # Decrypt the message
        plain_text = private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )

        # Load sender's public key (to verify signature)
        public_key = serialization.load_pem_public_key(sender.public_key.encode())

        # Verify the signature
        try:
            public_key.verify(
                signature,
                plain_text,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH,
                ),
                hashes.SHA256(),
            )
            return plain_text.decode()
        except InvalidSignature:
            raise ValueError("Signature verification failed!")


    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Message from {self.sender} to {self.receiver} at {self.timestamp}"


class Group(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    private_key = models.TextField(null=True, blank=True)  # For group encryption
    public_key = models.TextField(null=True, blank=True)  # For group decryption
    is_public = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        CustomUser,  # Assuming CustomUser is in the same app
        on_delete=models.CASCADE,
        related_name="created_groups",
    )
    members = models.ManyToManyField(CustomUser, related_name="group_members", null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def generate_keys(self):
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        public_key = private_key.public_key()

        self.private_key = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.BestAvailableEncryption(
                config("RSA_PASSPHRASE").encode()
            ),
        ).decode()

        self.public_key = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()

        self.save()

    def add_member(self, user_list):
        for user in user_list:
            if user not in self.members.all():
                self.members.add(user)
                self.save()

    def __str__(self):
        return self.name


class GroupMessage(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="group_messages_sent"
    )
    content = models.TextField()  # Will store encrypted content
    timestamp = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def encrypt_message(plain_text: str, group: Group):
        """
        Encrypt message using sender's public key (for authenticity) and
        group members' public keys (for confidentiality).
        In a real system, you'd likely use symmetric encryption with a shared key
        or hybrid encryption for efficiency.
        """
        # For simplicity, we'll use sender's public key here
        # In practice, you'd want to encrypt for all group members
        private_key = serialization.load_pem_private_key(group.private_key.encode())
        encrypted = private_key.encrypt(
            plain_text.encode(),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )
        return encrypted.hex()

    @staticmethod
    def decrypt_message(encrypted_message, group: Group):
        """
        Decrypt message using receiver's private key.
        Assumes message was encrypted with sender's public key.
        """
        public_key = serialization.load_pem_public_key(
            group.public_key.encode(), password=None
        )
        decrypted = public_key.decrypt(
            bytes.fromhex(encrypted_message),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )
        return decrypted.decode()
