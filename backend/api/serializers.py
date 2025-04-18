from datetime import datetime

import pyotp
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers

from .models import (Chat, CustomUser, Friendship, Group, GroupMessage,
                     MarketPlace, Message)


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

    def create(self, validated_data):
        """Create a new user with TOTP setup"""
        # Convert date string back to date object if needed
        if "dob" in validated_data and isinstance(validated_data["dob"], str):
            validated_data["dob"] = datetime.strptime(
                validated_data["dob"], "%Y-%m-%d"
            ).date()

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
        if not totp.verify(data.get("otp")):
            raise serializers.ValidationError("Invalid OTP.")

        return data


class ChatSerializer(serializers.ModelSerializer):
    user1 = serializers.SlugRelatedField(
        slug_field="username", queryset=CustomUser.objects.all()
    )
    user2 = serializers.SlugRelatedField(
        slug_field="username", queryset=CustomUser.objects.all()
    )
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Chat
        fields = ["id", "user1", "user2", "created_at", "messages"]

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

class FriendshipSerializer(serializers.ModelSerializer):
    user = serializers.CharField(max_length=150, write_only=True)
    friend = serializers.CharField(max_length=150, write_only=True)
    user_username = serializers.CharField(source="user.username", read_only=True)
    friend_username = serializers.CharField(source="friend.username", read_only=True)
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    user_bio = serializers.CharField(source="user.bio", read_only=True, allow_null=True)
    user_profile_pic = serializers.CharField(source="user.profile_picture", read_only=True, allow_null=True)

    class Meta:
        model = Friendship
        fields = [
            "user", "friend", "user_username", "friend_username",
            "user_id", "user_bio", "user_profile_pic",
            "created_at", "is_accepted"
        ]

    def validate(self, data):
        user = data.get("user")
        friend = data.get("friend")
        if not user or not friend:
            raise serializers.ValidationError("Both user and friend are required.")
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

    def create(self, validated_data):
        user = validated_data["user"]
        friend = validated_data["friend"]
        # Check for existing friendships in either direction
        if Friendship.objects.filter(
            user=user, friend=friend, is_accepted=True
        ).exists():
            raise serializers.ValidationError("You are already friends with this user.")
        if Friendship.objects.filter(
            user=friend, friend=user, is_accepted=True
        ).exists():
            raise serializers.ValidationError("You are already friends with this user.")
        if Friendship.objects.filter(
            user=user, friend=friend, is_accepted=False
        ).exists():
            raise serializers.ValidationError("Accept pending friend request.")
        if Friendship.objects.filter(
            user=friend, friend=user, is_accepted=False
        ).exists():
            raise serializers.ValidationError("Friend request already sent.")
        friendship = Friendship.objects.create(
            user=user, friend=friend, is_accepted=False
        )
        return friendship

    def update_friendship(self, validated_data):
        user = validated_data["user"]
        friend = validated_data["friend"]
        try:
            friendship = Friendship.objects.get(
                user=friend, friend=user, is_accepted=False
            )
            friendship.is_accepted = True
            friendship.save()
            return friendship
        except Friendship.DoesNotExist:
            raise serializers.ValidationError("No pending friendship request exists.")

    def delete(self, instance):
        user = self.validated_data["user"]
        friend = self.validated_data["friend"]
        try:
            print("trying to get friendship")
            friendship = Friendship.objects.get(
                Q(user=user, friend=friend) | Q(user=friend, friend=user)
            )
            print("trying to delete friendship")
            friendship.delete()
            return {"message": "Friendship deleted successfully."}
        except Friendship.DoesNotExist:
            raise serializers.ValidationError("Friendship does not exist.")


class GroupSerializer(serializers.ModelSerializer):
    members = serializers.ListField(child=serializers.CharField(), write_only=True)
    member_details = serializers.SlugRelatedField(
        many=True, read_only=True, slug_field="username", source="members"
    )
    created_by = serializers.SlugRelatedField(
        slug_field="username", queryset=CustomUser.objects.all()
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
            raise serializers.ValidationError(
                {"members": f"Users not found: {', '.join(missing)}"}
            )

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
                invalid_usernames = set(member_usernames) - set(
                    users.values_list("username", flat=True)
                )
                raise serializers.ValidationError(
                    {
                        "members": f"The following usernames are invalid: {', '.join(invalid_usernames)}"
                    }
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
            raise serializers.ValidationError(
                "Only the group creator can delete the group."
            )

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

        # print(sender, group, message)

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
        # print(f"Encrypted group message: {message}")
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
    created_by = serializers.SlugRelatedField(
        slug_field="username", queryset=CustomUser.objects.all()
    )
    created_at = serializers.DateTimeField(default=timezone.now, read_only=True)

    class Meta:
        model = MarketPlace
        fields = [
            "id",
            "name",
            "description",
            "price",
            "image",
            "upi_id",
            "created_by",
            "created_at",
            "is_sold",  # Added to match your database schema
        ]

    def create(self, validated_data):
        """Create a new marketplace item"""
        created_by = validated_data.pop("created_by", None)
        if not created_by:
            raise serializers.ValidationError({"created_by": "This field is required."})

        try:
            created_by_user = CustomUser.objects.get(username=created_by)
            if not created_by_user.is_verified:
                raise serializers.ValidationError(
                    {"created_by": "User is not verified."}
                )
            if not validated_data.get("upi_id"):  # Check for None or empty string
                raise serializers.ValidationError({"upi_id": "User UPI ID is not set."})
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError({"created_by": "User does not exist."})

        validated_data["created_by"] = created_by_user
        item = MarketPlace.objects.create(**validated_data)
        print(validated_data)
        return item

    def update(self, instance, validated_data):
        """Update an existing marketplace item"""
        instance.name = validated_data.get("name", instance.name)
        instance.description = validated_data.get("description", instance.description)
        instance.price = validated_data.get("price", instance.price)
        # Use existing image if not provided in validated_data
        instance.image = validated_data.get("image", instance.image)
        print(validated_data.get("image"))
        instance.upi_id = validated_data.get("upi_id", instance.upi_id)
        instance.is_sold = validated_data.get("is_sold", instance.is_sold)
        instance.save()
        return instance

    def validate(self, data):
        """Ensure item name is unique, excluding the current instance for updates"""
        print(data)
        item_name = data.get("name")
        if item_name:
            queryset = MarketPlace.objects.filter(name=item_name)
            if self.instance:  # If updating, exclude the current instance
                queryset = queryset.exclude(id=self.instance.id)
            if queryset.exists():
                raise serializers.ValidationError(
                    "Marketplace item with this name already exists."
                )
        return data


class TOTPVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    totp_code = serializers.CharField(min_length=6, max_length=6, required=True)

    def validate(self, data):
        email = data.get("email")
        totp_code = data.get("totp_code")

        try:
            user = CustomUser.objects.get(email=email)
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found")

        if not user.totp_secret:
            raise serializers.ValidationError("2FA not set up for this user")

        # Verify the TOTP code
        import pyotp

        totp = pyotp.TOTP(user.totp_secret)
        if not totp.verify(totp_code):
            raise serializers.ValidationError("Invalid authentication code")

        # Store user in the validated data for the view
        data["user"] = user
        return data


class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "date_joined",
            "last_login",
            "is_active",
            "is_verified",
            "profile_picture",
            "profile_picture_url",
            "bio",
            "address",
            "dob",
        ]
        read_only_fields = [
            "id",
            "email",
            "date_joined",
            "last_login",
            "is_active",
            "is_verified",
        ]

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None


class UserListSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()
    is_friend = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ["id", "username", "profile_picture_url", "bio", "is_friend"]

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def get_is_friend(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False

        # Check if there's an accepted friendship between the users
        return Friendship.objects.filter(
            (Q(user=request.user, friend=obj) | Q(user=obj, friend=request.user)),
            is_accepted=True,
        ).exists()
