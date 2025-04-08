import random

import pyotp
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework import serializers

from .models import (Chat, CustomUser, Friendship, Group, GroupMessage, MarketPlace, Message)


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = "__all__"


class RegisterSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "username",
            "first_name",
            "last_name",
            "dob",
            "email",
            "password",
            "bio",
        ]
        extra_kwargs = {
            "password": {"write_only": True, "min_length": 8},
            "bio": {"required": False},
        }

    def validate_dob(self, value):
        """Validate the date of birth to be 18"""
        if value:
            today = timezone.now().date()
            age = (
                today.year
                - value.year
                - ((today.month, today.day) < (value.month, value.day))
            )
            if age < 18:
                raise serializers.ValidationError("You must be at least 18 years old.")
        return value

    def validate_email(self, value):
        """Validate the email to be unique"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def generate_otp(self):
        """Generate a random 6-digit OTP"""
        return str(random.randint(100000, 999999))

    def save(self):
        request = self.context["request"]
        code = self.generate_otp()
        request.session["registration_data"] = self.validated_data
        request.session["verification_code"] = code
        request.session.modified = True
        return code

    def create(self, validated_data):
        """Create a new user with TOTP setup"""
        # Create the base user first
        user = CustomUser(
            email=validated_data["email"],
            username=validated_data["username"],
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
            dob=validated_data["dob"],
            bio=validated_data.get("bio", ""),
        )

        # Set password and save to get user ID
        user.set_password(validated_data["password"])
        user.save()

        # Generate TOTP secret for 2FA
        user.generate_keys()
        user.generate_totp_secret()

        return user


class LoginSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=8, required=True)

    class Meta:
        model = CustomUser
        fields = ["email", "password"]


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "username",
            "first_name",
            "last_name",
            "bio",
            "profile_picture",
            "is_active",
            "is_verified",
        ]


class OTPSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, min_length=6, required=True)

    def validate(self, data):
        try:
            user = CustomUser.objects.get(email=data["email"])
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User does not exist.")

        # Check if the OTP is valid
        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(totp):
            raise serializers.ValidationError("Invalid OTP.")

        return data


class ChatSerializer(serializers.ModelSerializer):
    user1 = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all())
    user2 = serializers.SlugRelatedField(slug_field='username', queryset=CustomUser.objects.all())
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = ['id', 'user1', 'user2', 'created_at', 'messages']

    def create(self, validated_data):
        """Create a new chat instance"""
        user1 = validated_data["user1"]
        user2 = validated_data["user2"]

        # Ensure both users are valid
        try:
            user1_instance = CustomUser.objects.get(username=user1)
            user2_instance = CustomUser.objects.get(username=user2)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User1 or User2 does not exist.")

        # Create the chat instance
        chat = Chat.objects.create(user1=user1_instance, user2=user2_instance)

        return chat
        


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.SlugRelatedField(
        slug_field="username", queryset=CustomUser.objects.all()
    )
    receiver = serializers.SlugRelatedField(
        slug_field="username", queryset=CustomUser.objects.all()
    )

    class Meta:
        model = Message
        fields = ["sender", "receiver", "content", "timestamp"]

    def create(self, validated_data):
        sender_user = validated_data["sender"]
        receiver_user = validated_data["receiver"]
        content = validated_data["content"]

        # Check if sender and receiver are valid users
        try:
            sender_user = CustomUser.objects.get(email=sender_user)
            receiver_user = CustomUser.objects.get(email=receiver_user)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("Sender or receiver does not exist.")

        # Create the message instance
        validated_data["sender"] = sender_user
        validated_data["receiver"] = receiver_user
        validated_data["content"] = content

        message = Message().encrypt_message(content, sender_user, receiver_user)
        print(f"Encrypted message: {message}")
        # Save the message to the database
        validated_data["content"] = message
        validated_data["timestamp"] = timezone.now()

        return Message.objects.create(**validated_data)

    def validate(self, attrs):
        """Ensure sender and receiver are not the same"""
        print(attrs)
        if attrs["sender"] == attrs["receiver"]:
            raise serializers.ValidationError("Sender and receiver cannot be the same.")
        return attrs


class FriendshipSerializer(serializers.Serializer):
    class Meta:
        model = Friendship
        fields = ["user", "friend", "created_at"]

    def create(self, validated_data):
        """Create a new friendship"""
        # print(validated_data)
        user = validated_data.get("user")
        friend = validated_data.get("friend")

        # print("Raw incoming data:", user, friend)

        # Ensure both users are valid
        try:
            user_instance = CustomUser.objects.get(email=user)
            friend_instance = CustomUser.objects.get(email=friend)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User or friend does not exist.")

        # Create the friendship instance
        friendship = Friendship.objects.create(
            user=user_instance, friend=friend_instance
        )
        return friendship

    def update_friendship(self, validated_data):
        """Update friendship status"""
        user = validated_data.get("user")
        friend = validated_data.get("friend")
        status = validated_data.get("status")

        if status != "accepted" and status != "rejected":
            raise serializers.ValidationError("Invalid status.")

        # Ensure both users are valid
        try:
            user_instance = CustomUser.objects.get(username=user)
            friend_instance = CustomUser.objects.get(username=friend)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User or friend does not exist.")

        # Set status of friendship
        friendship = Friendship.objects.get(user=user_instance, friend=friend_instance)
        friendship.status = status
        friendship.save()
        return friendship

    def validate(self, data):
        user = self.initial_data.get("user")
        friend = self.initial_data.get("friend")
        # print("Raw incoming data:", user, friend)

        try:
            user_obj = CustomUser.objects.get(username=user)
            friend_obj = CustomUser.objects.get(username=friend)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User or friend does not exist.")

        if user_obj == friend_obj:
            raise serializers.ValidationError("You cannot befriend yourself.")

        data["user"] = user_obj
        data["friend"] = friend_obj
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
            user = CustomUser.objects.get(username=instance.get("user"))
            friend = CustomUser.objects.get(username=instance.get("friend"))
            friendship = Friendship.objects.get(user=user, friend=friend)
            # Ensure the friendship exists before deleting
            if not friendship:
                raise serializers.ValidationError("Friendship does not exist.")
            friendship.delete()
            return friendship
        except Friendship.DoesNotExist:
            raise serializers.ValidationError("Friendship does not exist.")


class GroupSerializer(serializers.ModelSerializer):
    members = serializers.ListField(
        child=serializers.CharField(), write_only=True
    )
    member_details = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='username',
        source='members'
    )
    created_by = serializers.SlugRelatedField(
        slug_field="username",
        queryset=CustomUser.objects.all()
    )

    class Meta:
        model = Group
        fields = ["id", "name", "members", "member_details", "created_by"]

    def create(self, validated_data):
        """Create a new group using usernames for members and creator"""
        member_usernames = validated_data.pop("members", [])
        creator_username = validated_data.pop("created_by", None)

        if not creator_username:
            raise serializers.ValidationError({"created_by": "This field is required."})

        # Validate users
        users = CustomUser.objects.filter(username__in=member_usernames)
        if users.count() != len(member_usernames):
            found_usernames = set(users.values_list("username", flat=True))
            missing = set(member_usernames) - found_usernames
            raise serializers.ValidationError({"members": f"Users not found: {', '.join(missing)}"})

        # Validate creator
        try:
            creator_user = CustomUser.objects.get(email=creator_username)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"created_by": "User does not exist."})

        # Create and save group first
        group = Group.objects.create(
            name=validated_data["name"],
            created_by=creator_user,
        )

        # Assign members
        group.members.set(users)

        # Generate encryption keys
        group.generate_keys()

        return group

    def update(self, instance, validated_data):
        instance.name = validated_data.get("name", instance.name)

        member_usernames = validated_data.get("members", None)
        if member_usernames is not None:
            users = CustomUser.objects.filter(username__in=member_usernames)
            
            # Check if all usernames provided are valid
            if users.count() != len(member_usernames):
                invalid_usernames = set(member_usernames) - set(users.values_list("username", flat=True))
                raise serializers.ValidationError(
                    {"members": f"The following usernames are invalid: {', '.join(invalid_usernames)}"}
                )

            instance.add_member(users)

        return instance


    def remove_member_by_name(self, group_name, member_username):
        """Remove a specific member from the group using group name and member username"""

        group = get_object_or_404(Group, name=group_name)

        try:
            member = CustomUser.objects.get(username=member_username)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User does not exist.")

        if member in group.members.all():
            group.members.remove(member)
        else:
            raise serializers.ValidationError("Member not in group.")
        
        return group

    def delete_group_by_name(self, group_name, requested_by_username):
        """Delete the group instance using group name if requested by its creator"""
        from django.shortcuts import get_object_or_404

        group = get_object_or_404(Group, name=group_name)

        try:
            user = CustomUser.objects.get(username=requested_by_username)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User does not exist.")

        if group.created_by != user:
            raise serializers.ValidationError("Only the group creator can delete the group.")
        
        group.delete()
        return {"message": f"Group '{group_name}' deleted successfully."}


    
    def validate(self, data):
        """Ensure group name is unique"""
        group_name = data.get("name")
        if Group.objects.filter(name=group_name).exists():
            raise serializers.ValidationError("Group with this name already exists.")
        return data


class GroupMessageSerializer(serializers.ModelSerializer):
    sender = serializers.SlugRelatedField(
        slug_field="username", queryset=CustomUser.objects.all()
    )

    class Meta:
        model = GroupMessage
        fields = ["sender", "group", "content", "timestamp"]

    def create(self, validated_data):
        """Create a new group message"""
        sender = validated_data["sender"]
        group = validated_data["group"]
        message = validated_data["content"]

        print(sender, group, message)

        # Ensure sender and group are valid
        try:
            sender_user = CustomUser.objects.get(email=sender)
            group_instance = Group.objects.get(name=group)
        except (CustomUser.DoesNotExist, Group.DoesNotExist):
            raise serializers.ValidationError("Sender or group does not exist.")

        # Create the group message instance
        validated_data["sender"] = sender_user
        validated_data["group"] = group_instance

        message = GroupMessage().encrypt_message(message, sender_user, group_instance)
        print(f"Encrypted group message: {message}")
        # print(
        #     "Decrypted group message:",
        #     GroupMessage.decrypt_message(message, group_instance),
        # )

        # Save the group message to the database
        validated_data["content"] = message
        validated_data["timestamp"] = timezone.utc

        group_message = GroupMessage.objects.create(**validated_data)
        return group_message


class MarketPlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarketPlace
        fields = ["id", "name", "description", "price", "created_by", "created_at"]

    def create(self, validated_data):
        """Create a new marketplace item"""
        created_by = validated_data.pop("created_by", None)
        if not created_by:
            raise serializers.ValidationError({"created_by": "This field is required."})
        try:
            created_by_user = CustomUser.objects.get(email=created_by)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"created_by": "User does not exist."})

        validated_data["created_by"] = created_by_user

        item = MarketPlace.objects.create(**validated_data)
        return item

    def update(self, instance, validated_data):
        """Update an existing marketplace item"""
        instance.name = validated_data.get("name", instance.name)
        instance.description = validated_data.get("description", instance.description)
        instance.price = validated_data.get("price", instance.price)
        instance.save()
        return instance
    
    def delete(self, instance):
        """Delete a marketplace item"""
        instance.delete()
        return {"message": "Marketplace item deleted successfully."}
    
    def validate(self, data):
        """Ensure item name is unique"""
        item_name = data.get("name")
        if MarketPlace.objects.filter(name=item_name).exists():
            raise serializers.ValidationError("Marketplace item with this name already exists.")
        return data
