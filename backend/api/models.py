import pyotp
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding, rsa
from decouple import config
from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models
from django.db.models import Q, UniqueConstraint
from django.utils import timezone

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
    last_name = models.CharField(max_length=30)
    dob = models.DateField(null=True, blank=True)
    bio = models.TextField(max_length=500, null=True, blank=True)
    address = models.CharField(max_length=100, null=True, blank=True)
    profile_picture = models.ImageField(
        upload_to="profile_pictures/", null=True, blank=True
    )
    is_verified = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=32, null=True, blank=True)
    private_key = models.TextField(null=True, blank=True)
    public_key = models.TextField(null=True, blank=True)
    is_approved = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = CustomUserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username", "first_name", "last_name"]

    def __str__(self):
        return self.email

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def get_short_name(self):
        return self.first_name

    def generate_totp_secret(self):
        if not self.totp_secret:
            self.totp_secret = pyotp.random_base32()
            self.save()

    def get_totp_uri(self):
        if not self.totp_secret:
            self.generate_totp_secret()
        return pyotp.totp.TOTP(self.totp_secret).provisioning_uri(
            self.email, issuer_name="Rivr"
        )

    def get_secret(self):
        return self.totp_secret

    def verify_totp(self, code):
        if not self.totp_secret:
            return False
        totp = pyotp.TOTP(self.totp_secret)
        return totp.verify(code)

    def generate_keys(self):
        if not self.private_key or not self.public_key:
            private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            public_key = private_key.public_key()

            self.private_key = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.BestAvailableEncryption(
                    password=config("RSA_PASSPHRASE").encode()
                ),
            ).decode("utf-8")

            self.public_key = public_key.public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo,
            ).decode("utf-8")
            self.save()


class Friendship(models.Model):
    user = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="friendship_user1"
    )
    friend = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="friendship_user2"
    )
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            UniqueConstraint(
                fields=["user", "friend"],
                name="unique_friendship",
            ),
            UniqueConstraint(
                fields=["friend", "user"],
                name="unique_friendship_mirror",
            ),
        ]

    def __str__(self):
        return f"{self.user} ↔ {self.friend}"


class Chat(models.Model):
    user1 = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="chats_as_user1"
    )
    user2 = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="chats_as_user2"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user1", "user2"], name="unique_user_chat")
        ]

    def __str__(self):
        return f"Chat between {self.user1.username} and {self.user2.username}"

    @staticmethod
    def get_or_create_chat(user_a, user_b):
        """Ensure chat is created only once per unique pair (regardless of order)"""
        user1, user2 = sorted([user_a, user_b], key=lambda u: u.id)
        chat, created = Chat.objects.get_or_create(user1=user1, user2=user2)
        return chat


from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from decouple import config
from django.db import models


class Message(models.Model):
    chat = models.ForeignKey(
        "Chat", on_delete=models.CASCADE, related_name="messages", null=True, blank=True
    )
    sender = models.ForeignKey(
        "CustomUser", on_delete=models.CASCADE, related_name="sent_messages"
    )
    receiver = models.ForeignKey(
        "CustomUser", on_delete=models.CASCADE, related_name="received_messages"
    )
    content = models.TextField()  # Stores encrypted content as a stringified dict
    timestamp = models.DateTimeField(auto_now_add=True)

    @staticmethod
    def encrypt_message(plain_text, sender, receiver):
        """Encrypt a message using the receiver's public key and sign it with the sender's private key."""
        try:
            # Load sender's encrypted private key (for signing)
            private_key = serialization.load_pem_private_key(
                sender.private_key.encode(), password=config("RSA_PASSPHRASE").encode()
            )
        except ValueError as e:
            raise ValueError(f"Failed to load sender's private key: {str(e)}")

        try:
            # Load receiver's public key (for encryption)
            public_key = serialization.load_pem_public_key(receiver.public_key.encode())
        except ValueError as e:
            raise ValueError(f"Failed to load receiver's public key: {str(e)}")

        # Encrypt the plaintext with receiver's public key
        ciphertext = public_key.encrypt(
            plain_text.encode(),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None,
            ),
        )

        # Sign the plaintext with sender's private key
        signature = private_key.sign(
            plain_text.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()), salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256(),
        )

        # Return encrypted content and signature as a dict
        return {"ciphertext": ciphertext.hex(), "signature": signature.hex()}

    @staticmethod
    def decrypt_message(ciphertext_hex, signature_hex, sender, receiver):
        """Decrypt a message using the receiver's private key and verify with the sender's public key."""
        try:
            # Convert hex strings to bytes
            ciphertext = bytes.fromhex(ciphertext_hex)
            signature = bytes.fromhex(signature_hex)
        except ValueError as e:
            raise ValueError(f"Invalid hex data: {str(e)}")

        try:
            # Load receiver's encrypted private key (to decrypt)
            private_key = serialization.load_pem_private_key(
                receiver.private_key.encode(),
                password=config("RSA_PASSPHRASE").encode(),
            )
        except ValueError as e:
            raise ValueError(f"Failed to load receiver's private key: {str(e)}")

        try:
            # Load sender's public key (to verify signature)
            public_key = serialization.load_pem_public_key(sender.public_key.encode())
        except ValueError as e:
            raise ValueError(f"Failed to load sender's public key: {str(e)}")

        # Decrypt the message
        try:
            plain_text = private_key.decrypt(
                ciphertext,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None,
                ),
            )
        except ValueError as e:
            raise ValueError(f"Decryption failed: {str(e)}")

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
        """Ensure chat is set before saving."""
        if not self.chat:
            self.chat = Chat.get_or_create_chat(self.sender, self.receiver)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Message from {self.sender} to {self.receiver} at {self.timestamp}"

    class Meta:
        ordering = ["timestamp"]  # Ensure messages are ordered by time


class Group(models.Model):
    id = models.AutoField(primary_key=True)
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
    members = models.ManyToManyField(
        CustomUser, related_name="group_members", null=True
    )
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
    def encrypt_message(plain_text, sender, receiver):
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding
        from decouple import config

        # Load sender's private key (for signing)
        private_key = serialization.load_pem_private_key(
            sender.private_key.encode(), password=config("RSA_PASSPHRASE").encode()
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
        return {"ciphertext": ciphertext.hex(), "signature": signature.hex()}

    @staticmethod
    def decrypt_message(ciphertext_hex, signature_hex, sender, receiver):
        from cryptography.exceptions import InvalidSignature
        from cryptography.hazmat.primitives import hashes, serialization
        from cryptography.hazmat.primitives.asymmetric import padding
        from decouple import config

        ciphertext = bytes.fromhex(ciphertext_hex)
        signature = bytes.fromhex(signature_hex)

        # Load receiver's private key (to decrypt message)
        private_key = serialization.load_pem_private_key(
            receiver.private_key.encode(), password=config("RSA_PASSPHRASE").encode()
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


class MarketPlace(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE, related_name="created_marketplaces"
    )
    image = models.TextField(null=True, blank=True)
    price = models.CharField(max_length=20, null=True, blank=True)
    upi_id = models.CharField(max_length=100, null=True, blank=True)
    is_sold = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def create(self, **kwargs):
        super().create(**kwargs)

    def __str__(self):
        return self.name


class VerificationCode(models.Model):
    email = models.EmailField(unique=True)
    code = models.CharField(max_length=6)
    data = models.JSONField()  # Store registration data
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def is_expired(self):
        return timezone.now() > self.expires_at

    def __str__(self):
        return f"Verification code for {self.email}"
