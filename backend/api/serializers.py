from datetime import timezone
import pyotp
from rest_framework import serializers

from .models import CustomUser, Message, OTPVerification, Friendship, Group, GroupMessage


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = "__all__"


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = [
            "username",
            "first_name",
            "last_name",
            "phone_number",
            "email",
            "password",
            "bio",
        ]

    def create(self, validated_data):
        """Create a new user with TOTP setup"""
        # Create the base user first
        user = CustomUser(
            email=validated_data["email"],
            username=validated_data["username"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            phone_number=validated_data.get("phone_number", ""),
            bio=validated_data.get("bio", "")
        )
        
        # Set password and save to get user ID
        user.set_password(validated_data["password"])
        user.save()
        
        # Generate TOTP secret for 2FA
        user.generate_totp_secret()
        
        # Create OTP verification record
        OTPVerification.objects.create(user=user)
            
        return user


class LoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8, required=True)

    class Meta:
        model = CustomUser
        fields = ["email", "password"]


class OTPVerificationSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, required=True)
    
    class Meta:
        model = OTPVerification
        fields = ["email", "otp"]


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "sender", "receiver", "content", "timestamp"]
    
    def create(self, validated_data):
        """Create a new message"""
        sender = validated_data["sender"]
        receiver = validated_data["receiver"]
        message = validated_data["content"]

        # Ensure sender and receiver are valid users
        try:
            sender_user = CustomUser.objects.get(username=sender)
            receiver_user = CustomUser.objects.get(username=receiver)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Sender or receiver does not exist.")
        
        # Create the message instance
        validated_data["sender"] = sender_user
        validated_data["receiver"] = receiver_user
        
        message = Message().encrypt_message(message, sender_user, receiver_user)
        print(f"Encrypted message: {message}")
        print("Decrypted message:", Message.decrypt_message(message))
        # Save the message to the database
        validated_data["content"] = message
        validated_data["timestamp"] = timezone.now()

        message = Message.objects.create(**validated_data)
        return message


class FriendshipSerializer(serializers.Serializer):
    class Meta:
        model = Friendship
        fields = ["user", "friend"]

    def create(self, validated_data):
        """Create a new friendship"""
        user = validated_data["user"]
        friend = validated_data["friend"]

        # Ensure both users are valid
        try:
            user_instance = CustomUser.objects.get(username=user)
            friend_instance = CustomUser.objects.get(username=friend)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User or friend does not exist.")
        
        # Create the friendship instance
        friendship = Friendship.objects.create(user=user_instance, friend=friend_instance)
        return friendship
    
    def validate(self, data):
        """Ensure that a user cannot befriend themselves."""
        if data["user"] == data["friend"]:
            raise serializers.ValidationError("You cannot befriend yourself.")
        return data
    
    def validate_friend(self, value):
        """Ensure that the friend exists."""
        try:
            CustomUser.objects.get(username=value)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Friend does not exist.")
        return value
    
    def delete(self, instance):
        """Delete a friendship."""
        try:
            friendship = Friendship.objects.get(user=instance.user, friend=instance.friend)
            friendship.delete()
            return friendship
        except Friendship.DoesNotExist:
            raise serializers.ValidationError("Friendship does not exist.")