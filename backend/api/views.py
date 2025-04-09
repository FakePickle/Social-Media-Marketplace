import ast
import base64
import io
import random
from datetime import date, timedelta

import qrcode
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from decouple import config
from django.conf import settings
from django.contrib.auth import authenticate
from django.core.mail import message, send_mail
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import (AccessToken, RefreshToken,
                                             TokenError)

from .models import (Chat, CustomUser, Friendship, Group, GroupMessage,
                     MarketPlace, Message, VerificationCode)
from .serializers import (ChatSerializer, FriendshipSerializer,
                          GroupMessageSerializer, GroupSerializer,
                          LoginSerializer, MarketPlaceSerializer,
                          MessageSerializer, RegisterSerializer,
                          TOTPVerificationSerializer, UserListSerializer,
                          UserProfileSerializer)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            # Generate a secure random code
            code = "".join([str(random.randint(0, 9)) for _ in range(6)])
            email = serializer.validated_data["email"]

            # Standardize the data format
            registration_data = {}
            for key, value in serializer.validated_data.items():
                if isinstance(value, date):
                    registration_data[key] = value.isoformat()
                else:
                    registration_data[key] = value

            # Create or update verification record with 15 min expiry
            expires_at = timezone.now() + timedelta(minutes=15)

            try:
                # Update existing verification or create new one
                verification, created = VerificationCode.objects.update_or_create(
                    email=email,
                    defaults={
                        "code": code,
                        "data": registration_data,
                        "expires_at": expires_at,
                    },
                )

                # Log for debugging
                if created:
                    print(f"Created new verification code for {email}")
                else:
                    print(f"Updated verification code for {email}")

                # Send verification email
                send_mail(
                    subject="Welcome to Rivr - Verify your account",
                    message=f"Please verify your account using the following code: {code}",
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )

                # Return response without including sensitive data
                response_data = {
                    "message": "Verification code sent to your email.",
                    "email": email,
                    "verify-endpoint": "/api/verify-email/",
                }

                # Only include code in development environment
                if settings.DEBUG:
                    response_data["code"] = code

                return Response(response_data, status=status.HTTP_200_OK)

            except Exception as e:
                return Response(
                    {"error": f"Failed to generate verification code: {str(e)}"},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ratelimit(key="ip", rate="5/m", method="POST"))
    def post(self, request):
        if getattr(request, "limited", False):
            return Response(
                {"error": "Too many login attempts"},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data["email"]
            password = serializer.validated_data["password"]

            user = authenticate(request, username=email, password=password)

            if user and user.is_active:
                if not user.is_verified:
                    return Response(
                        {"message": "Account not verified. Please set up 2FA.", "email": email},
                        status=status.HTTP_200_OK,  # Prompt for 2FA setup if unverified
                    )
                return Response(
                    {"message": "Please enter your 2FA code", "email": email},
                    status=status.HTTP_200_OK,  # Prompt for 2FA
                )
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get("otp")
        email = request.data.get("email")

        print(code)
        print(email)

        if not code or not email:
            return Response(
                {"error": "Email and verification code are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        print(f"Verifying code {code} for {email}")

        try:
            # Find verification record by email
            verification = VerificationCode.objects.get(email=email)

            # Check expiration
            if verification.is_expired():
                verification.delete()  # Clean up expired records
                return Response(
                    {"error": "Verification code expired. Please request a new code."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Check code
            if code != verification.code:
                return Response(
                    {"error": "Invalid verification code"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Create user from stored data
            registration_data = verification.data
            serializer = RegisterSerializer(data=registration_data)

            if not serializer.is_valid():
                return Response(
                    {
                        "error": "Invalid registration data",
                        "details": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            user = serializer.create(registration_data)

            # Generate QR code for TOTP
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(user.get_totp_uri())
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")

            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            qr_code = base64.b64encode(buffer.getvalue()).decode("utf-8")

            return Response(
                {
                    "message": "Account created successfully.",
                    "instructions": "Scan this QR code in your authenticator app.",
                    "qr_code": f"data:image/png;base64,{qr_code}",
                    "secret_key": user.get_secret(),
                    "totp_uri": user.get_totp_uri(),
                },
                status=status.HTTP_201_CREATED,
            )
        except VerificationCode.DoesNotExist:
            return Response(
                {
                    "error": "No verification found for this email. Please register first."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class FriendshipView(APIView):
    queryset = Friendship.objects.all()
    serializer_class = FriendshipSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        username = request.user.username
        # Only show incoming requests where user is the recipient (friend)
        friendships = self.queryset.filter(friend__username=username, is_accepted=False)
        if not friendships.exists():
            return Response({"detail": "No friendships found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = self.serializer_class(friendships, many=True)
        print(f"Serialized friendships: {serializer.data}")
        return Response(serializer.data)

    def post(self, request):
        print(f"Authenticated user: {request.user.username if request.user.is_authenticated else 'None'}")
        data = request.data.copy()
        data["user"] = request.user.username  # Force authenticated user
        print("Data received for friendship:", data)
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            friendship = serializer.save()
            return Response(self.serializer_class(friendship).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        print("Data received for friendship update:", request.data)
        print("Authenticated user:", request.user.username)
        data = request.data.copy()
        data["user"] = request.user.username
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            try:
                serializer.update_friendship(serializer.validated_data)
                return Response(status=status.HTTP_204_NO_CONTENT)
            except serializers.ValidationError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        request_user = request.user.username
        friend_user = request.data.get("friend")
        if not friend_user:
            return Response({"error": "Friend username is required."}, status=status.HTTP_400_BAD_REQUEST)
        data = {"user": request_user, "friend": friend_user}
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            try:
                serializer.delete(data)
            except Friendship.DoesNotExist:
                return Response({"error": "Friendship does not exist."}, status=status.HTTP_404_NOT_FOUND)
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ChatListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        chats = Chat.objects.filter(Q(user1=user) | Q(user2=user))
        if not chats.exists():
            return Response({"detail": "No chats found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChatSerializer(chats, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        data["user1"] = request.user.username  # Force authenticated user as user1
        serializer = ChatSerializer(data=data)
        if serializer.is_valid():
            chat = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MessageView(APIView):
    queryset = Message.objects.all()
    dmserializer = MessageSerializer
    groupserializer = GroupMessageSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None, group=None):
        sender_username = request.user.username
        receiver_username = request.query_params.get("receiver")  # Use query param for receiver

        if pk is not None:
            group_obj = get_object_or_404(Group, pk=pk)
            if not group_obj.members.filter(username=sender_username).exists():
                return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
            messages = GroupMessage.objects.filter(group=group_obj).order_by("timestamp")
            if not messages.exists():
                return Response({"detail": "No messages found"}, status=status.HTTP_404_NOT_FOUND)
            serialized_messages = []
            for msg in messages:
                try:
                    content = ast.literal_eval(msg.content)
                    decrypted = GroupMessage.decrypt_message(content["ciphertext"], content["signature"], msg.sender, group_obj)
                except Exception as e:
                    decrypted = f"Unable to decrypt message: {e}"
                message_data = GroupMessageSerializer(msg).data
                message_data["decrypted_content"] = decrypted
                serialized_messages.append(message_data)
            return Response(serialized_messages)

        if receiver_username:
            try:
                user = CustomUser.objects.get(username=sender_username)
                receiver = CustomUser.objects.get(username=receiver_username)
            except CustomUser.DoesNotExist:
                return Response({"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            messages = Message.objects.filter(
                (Q(sender=user) & Q(receiver=receiver)) | (Q(sender=receiver) & Q(receiver=user))
            ).order_by("timestamp")
            response_data = []
            for msg in messages:
                try:
                    content_dict = ast.literal_eval(msg.content)
                    decrypted = Message.decrypt_message(content_dict["ciphertext"], content_dict["signature"], msg.sender, msg.receiver)
                except Exception as e:
                    decrypted = f"Unable to decrypt message: {e}"
                data = MessageSerializer(msg).data
                data["decrypted_content"] = decrypted
                response_data.append(data)
            return Response(response_data)
        return Response({"detail": "Receiver required for DMs"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        data = request.data.copy()
        data["sender"] = request.user.username  # Force authenticated user as sender
        serializer = None
        if data.get("group"):
            serializer = GroupMessageSerializer(data=data)
        elif data.get("receiver"):
            serializer = MessageSerializer(data=data)
        if serializer:
            if serializer.is_valid():
                message = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return Response({"error": "Invalid request: group or receiver required."}, status=status.HTTP_400_BAD_REQUEST)


class CombinedChatGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        chats = Chat.objects.filter(Q(user1=user) | Q(user2=user))
        groups = Group.objects.filter(members=user)
        if not (chats.exists() or groups.exists()):
            return Response({"detail": "No chats or groups found"}, status=status.HTTP_404_NOT_FOUND)

        chat_last_messages = {}
        for chat in chats:
            last_message = chat.messages.order_by("-timestamp").first()
            if last_message:
                chat_last_messages[chat.id] = {"content": last_message.content, "timestamp": last_message.timestamp.isoformat()}

        group_last_messages = {}
        for group in groups:
            last_message = group.messages.order_by("-timestamp").first()
            if last_message:
                decrypted_content = self.decrypt_group_message(last_message)
                group_last_messages[group.id] = {"content": decrypted_content, "timestamp": last_message.timestamp.isoformat()}

        chat_serializer = ChatSerializer(chats, many=True)
        group_serializer = GroupSerializer(groups, many=True)

        for chat_data in chat_serializer.data:
            chat_data["type"] = "chat"
            chat_id = chat_data["id"]
            chat_data["last_message"] = chat_last_messages.get(chat_id, {}).get("content")
            chat_data["last_message_timestamp"] = chat_last_messages.get(chat_id, {}).get("timestamp")

        for group_data in group_serializer.data:
            group_data["type"] = "group"
            group_id = group_data["id"]
            group_data["last_message"] = group_last_messages.get(group_id, {}).get("content")
            group_data["last_message_timestamp"] = group_last_messages.get(group_id, {}).get("timestamp")

        combined_list = chat_serializer.data + group_serializer.data
        sorted_list = sorted(combined_list, key=lambda x: x.get("last_message_timestamp") or "", reverse=True)
        return Response({"results": sorted_list, "chat_count": len(chat_serializer.data), "group_count": len(group_serializer.data)})

    def decrypt_group_message(self, group_message):
        try:
            ciphertext = bytes.fromhex(group_message.content)
            private_key = serialization.load_pem_private_key(
                group_message.group.private_key.encode(),
                password=config("RSA_PASSPHRASE").encode(),
            )
            plain_text = private_key.decrypt(
                ciphertext,
                padding.OAEP(mgf=padding.MGF1(hashes.SHA256()), algorithm=hashes.SHA256(), label=None),
            )
            return plain_text.decode()
        except Exception as e:
            return f"Error decrypting message: {str(e)}"


class GroupCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        groups = Group.objects.filter(members=user)
        if not groups.exists():
            return Response({"detail": "No groups found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        serializer = GroupSerializer(data=data)
        if serializer.is_valid():
            group = serializer.save()
            group.members.add(request.user)  # Ensure creator is a member
            return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class GroupDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        if not group.members.filter(username=request.user.username).exists():
            return Response({"detail": "Not a member of this group"}, status=status.HTTP_403_FORBIDDEN)
        serializer = GroupSerializer(group)
        return Response(serializer.data)

    def put(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        if not group.members.filter(username=request.user.username).exists():
            return Response({"detail": "Not a member of this group"}, status=status.HTTP_403_FORBIDDEN)
        serializer = GroupSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            group = serializer.update(group, request.data)
            return Response(GroupSerializer(group).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        if not group.members.filter(username=request.user.username).exists():
            return Response({"detail": "Not a member of this group"}, status=status.HTTP_403_FORBIDDEN)
        serializer = GroupSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            group = serializer.remove_member_by_name(group, request.data.get("member"))
            return Response(GroupSerializer(group).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarketPlaceListCreateView(APIView):
    queryset = MarketPlace.objects.all()
    serializer_class = MarketPlaceSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):
        items = self.queryset.all()
        serializer = self.serializer_class(items, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        data["created_by"] = request.user.username  # Force authenticated user
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            item = serializer.save(created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MarketPlaceDetailView(APIView):
    queryset = MarketPlace.objects.all()
    serializer_class = MarketPlaceSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        obj = get_object_or_404(MarketPlace, pk=pk)
        if request.user.username != obj.created_by.username:
            raise PermissionDenied("You can only modify your own marketplace items")
        return obj

    def put(self, request, pk):
        instance = self.get_object(pk)
        serializer = MarketPlaceSerializer(instance, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        instance = self.get_object(pk)
        instance.delete()
        return Response({"Status: success"}, status=status.HTTP_204_NO_CONTENT)


class UserMarketPlaceListView(APIView):
    serializer_class = MarketPlaceSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):  # Added request parameter
        items = MarketPlace.objects.filter(created_by=request.user)
        serializer = self.serializer_class(items, many=True)
        return Response(serializer.data)


class AvailableMarketPlaceListView(APIView):
    serializer_class = MarketPlaceSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request):  # Added request parameter
        items = MarketPlace.objects.filter(is_sold=False)
        serializer = self.serializer_class(items, many=True)
        return Response(serializer.data)


class VerifyTOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = TOTPVerificationSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.validated_data["user"]

            # Mark user as verified if not already
            if not user.is_verified:
                user.is_verified = True
                user.save()

            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Authentication successful",
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                    "user": {
                        "id": user.id,
                        "email": user.email,
                        "username": user.username,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "bio": user.bio,
                        "is_verified": user.is_verified,
                        "is_admin": user.is_staff,
                        "date_joined": user.date_joined,
                        "profile_picture": (
                            user.profile_picture.url if user.profile_picture else None
                        ),
                    },
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response(
                {"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = CustomUser.objects.get(email=email)
            # Generate a secure random code
            code = "".join([str(random.randint(0, 9)) for _ in range(6)])

            # Create or update verification record with 15 min expiry
            expires_at = timezone.now() + timedelta(minutes=15)

            verification, created = VerificationCode.objects.update_or_create(
                email=email,
                defaults={
                    "code": code,
                    "data": {},  # Empty JSON object for password reset
                    "expires_at": expires_at,
                },
            )

            # Send verification email
            send_mail(
                subject="Password Reset Request - Rivr",
                message=f"Your password reset code is: {code}\nThis code will expire in 15 minutes.",
                from_email=settings.EMAIL_HOST_USER,
                recipient_list=[email],
                fail_silently=False,
            )

            return Response(
                {
                    "message": "Password reset code sent to your email",
                    "email": email,
                    "verify-endpoint": "/api/verify-password-reset/",
                },
                status=status.HTTP_200_OK,
            )

        except CustomUser.DoesNotExist:
            return Response(
                {"error": "No user found with this email"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to process request: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class VerifyPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        code = request.data.get("code")
        email = request.data.get("email")

        if not code or not email:
            return Response(
                {"error": "Code and email are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            verification = VerificationCode.objects.get(email=email)

            if verification.is_expired():
                verification.delete()
                return Response(
                    {"error": "Reset code has expired. Please request a new one."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if code != verification.code:
                return Response(
                    {"error": "Invalid reset code"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Generate a temporary token for the reset process
            token = RefreshToken.for_user(CustomUser.objects.get(email=email))

            return Response(
                {
                    "message": "Reset code verified successfully",
                    "reset_token": str(token.access_token),
                },
                status=status.HTTP_200_OK,
            )

        except VerificationCode.DoesNotExist:
            return Response(
                {"error": "No reset request found for this email"},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to verify code: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get("reset_token")
        new_password = request.data.get("new_password")

        if not token or not new_password:
            return Response(
                {"error": "Reset token and new password are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Verify the token
            token = AccessToken(token)
            user = CustomUser.objects.get(id=token["user_id"])

            # Update password
            user.set_password(new_password)
            user.save()

            # Delete any existing verification codes for this email
            VerificationCode.objects.filter(email=user.email).delete()

            return Response(
                {"message": "Password reset successfully"}, status=status.HTTP_200_OK
            )

        except TokenError:
            return Response(
                {"error": "Invalid or expired reset token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to reset password: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class ListUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            active_users = CustomUser.objects.filter(is_active=True).exclude(id=request.user.id)
            serializer = UserListSerializer(active_users, many=True, context={"request": request})
            return Response({"users": serializer.data, "count": active_users.count()}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to fetch users: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id=None):
        try:
            if user_id:
                # Get specific user profile
                user = CustomUser.objects.get(id=user_id, is_active=True)
                serializer = UserProfileSerializer(user, context={"request": request})
            else:
                # Get current user's profile if authenticated
                if not request.user.is_authenticated:
                    return Response(
                        {"error": "Authentication required"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
                serializer = UserProfileSerializer(
                    request.user, context={"request": request}
                )

            return Response(serializer.data, status=status.HTTP_200_OK)

        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to fetch user profile: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    def put(self, request, user_id=None):
        try:
            if user_id:
                # Update specific user profile (admin only)
                if not request.user.is_staff:
                    return Response(
                        {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
                    )
                user = CustomUser.objects.get(id=user_id, is_active=True)
            else:
                # Update current user's profile
                if not request.user.is_authenticated:
                    return Response(
                        {"error": "Authentication required"},
                        status=status.HTTP_401_UNAUTHORIZED,
                    )
                user = request.user

            # Handle profile picture upload
            if "profile_picture" in request.FILES:
                user.profile_picture = request.FILES["profile_picture"]

            # Update other fields
            serializer = UserProfileSerializer(
                user, data=request.data, partial=True, context={"request": request}
            )
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to update user profile: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
