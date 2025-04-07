import ast
import base64
import io

import qrcode
from django.contrib.auth import authenticate
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (Chat, CustomUser, Friendship, Group, GroupMessage, Message,
                     OTPVerification)
from .serializers import (ChatSerializer, FriendshipSerializer, GroupMessageSerializer,
                          GroupSerializer, LoginSerializer, MessageSerializer,
                          OTPVerificationSerializer, RegisterSerializer)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Generate QR code
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(user.get_totp_uri())
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")

            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            qr_code = base64.b64encode(buffer.getvalue()).decode("utf-8")

            return Response(
                {
                    "message": "Account created successfully. You need to verify your account using an authenticator app.",
                    "instructions": "1. Scan the QR code with your authenticator app (e.g., Google Authenticator, Authy).\n2. Enter the code from your app to verify your account.",
                    "qr_code": f"data:image/png;base64,{qr_code}",
                    "secret_key": user.get_secret(),
                    "email": user.email,
                    "verification_endpoint": "/api/verify-totp/",
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetTOTPQRView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = request.query_params.get("email")

        if not email:
            return Response(
                {"error": "Email parameter is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = CustomUser.objects.get(email=email)

            # Generate QR code
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(user.get_totp_uri())
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")

            buffer = io.BytesIO()
            img.save(buffer, format="PNG")
            qr_code = base64.b64encode(buffer.getvalue()).decode("utf-8")

            return Response(
                {
                    "qr_code": f"data:image/png;base64,{qr_code}",
                    "totp_uri": user.get_totp_uri(),
                },
                status=status.HTTP_200_OK,
            )
        except CustomUser.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )


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

            if user and user.is_verified:
                refresh = RefreshToken.for_user(user)
                return Response(
                    {
                        "refresh": str(refresh),
                        "access": str(refresh.access_token),
                    },
                    status=status.HTTP_200_OK,
                )
            elif user and not user.is_verified:
                return Response(
                    {"error": "Account not verified. Please verify OTP."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response(
                {"error": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerificationSerializer(data=request.data)
        if serializer.is_valid():
            otp = serializer.validated_data["otp"]
            email = serializer.validated_data["email"]

            try:
                user = CustomUser.objects.get(email=email)
                otp_record = OTPVerification.objects.filter(
                    user=user, is_verified=False
                ).first()

                if not otp_record:
                    return Response(
                        {"error": "No pending verification for this user"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                if otp_record.verify_otp(otp):
                    otp_record.is_verified = True
                    user.is_verified = True
                    user.save()
                    otp_record.save()
                    return Response(
                        {
                            "message": "Account verified successfully",
                            "instructions": "You can now log in with your email and password",
                            "login_endpoint": "/api/login/",
                        },
                        status=status.HTTP_200_OK,
                    )
                return Response(
                    {
                        "error": "Invalid OTP. Please try again with a new code from your authenticator app."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except CustomUser.DoesNotExist:
                return Response(
                    {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProtectedView(APIView):
    def get(self, request):
        return Response({"message": "This is a protected view."})


class FriendshipView(APIView):
    queryset = Friendship.objects.all()
    serializer_class = FriendshipSerializer
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Get all friendships for the current user.
        """
        user = request.user
        friendships = Friendship.objects.filter(user=user) | Friendship.objects.filter(
            friend=user
        )
        serializer = self.serializer_class(friendships, many=True)
        return Response(serializer.data)

    def post(self, request):
        """
        Create a new friendship.
        """
        # print(request.data)
        # print("Incoming data:", request.data)
        data = request.data.copy()
        # print("Data after copy:", data)
        serializer = self.serializer_class(data=data)
        if serializer.is_valid():
            friendship = serializer.save()
            return Response(
                self.serializer_class(friendship).data, status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """
        Delete a friendship.
        """
        request_user = request.data.get("user")
        friend_user = request.data.get("friend")
        if not request_user or not friend_user:
            return Response(
                {"error": "Both user and friend are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            try:
                serializer.delete(request.data)
            except Friendship.DoesNotExist:
                return Response(
                    {"error": "Friendship does not exist."},
                    status=status.HTTP_404_NOT_FOUND,
                )
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChatListCreateView(APIView):

    def get(self, request):
        user = request.data.get("user")
        user = get_object_or_404(CustomUser, username=user)
        # Get all chats for the current user
        chats = Chat.objects.filter(Q(user1=user) | Q(user2=user))
        if not chats.exists():
            return Response({"detail": "No chats found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = ChatSerializer(chats, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ChatSerializer(data=request.data)
        if serializer.is_valid():
            chat = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MessageView(APIView):
    queryset = Message.objects.all()
    dmserializer = MessageSerializer
    groupserializer = GroupMessageSerializer
    permission_classes = [AllowAny]

    def get(self, request, pk=None, group=None):
        sender_username = request.data.get("sender")
        receiver_username = request.data.get("receiver")

        if group is not None:
            group_obj = get_object_or_404(Group, pk=group)
            message = get_object_or_404(Message, pk=pk, group=group_obj)

            if not group_obj.members.filter(username=sender_username).exists():
                return Response(
                    {"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN
                )

            try:
                decrypted = GroupMessage.decrypt_message(message.content, group_obj)
            except Exception as e:
                decrypted = f"Unable to decrypt message: {e}"

            data = GroupMessageSerializer(message).data
            data["decrypted_content"] = decrypted
            return Response(data)

        # If sender and receiver are provided (DM chat history)
        if sender_username and receiver_username:
            try:
                user = CustomUser.objects.get(username=sender_username)
                receiver = CustomUser.objects.get(username=receiver_username)
            except CustomUser.DoesNotExist:
                return Response(
                    {"detail": "User not found"}, status=status.HTTP_404_NOT_FOUND
                )

            # Get all messages between the two users
            messages = Message.objects.filter(
                (Q(sender=user) & Q(receiver=receiver))
                | (Q(sender=receiver) & Q(receiver=user))
            ).order_by("timestamp")

            response_data = []

            for msg in messages:
                try:
                    content_dict = ast.literal_eval(msg.content)
                    decrypted = Message.decrypt_message(
                        content_dict["ciphertext"],
                        content_dict["signature"],
                        msg.sender,
                        msg.receiver,
                    )
                except Exception as e:
                    decrypted = f"Unable to decrypt message: {e}"

                data = MessageSerializer(msg).data
                data["decrypted_content"] = decrypted
                response_data.append(data)

            return Response(response_data)

        # ✅ If `pk` is given (get single DM message)
        if pk is not None:
            message = get_object_or_404(Message, pk=pk)
            if (
                sender_username != message.sender.username
                and sender_username != message.receiver.username
            ):
                return Response(
                    {"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN
                )

            import ast

            try:
                content_dict = ast.literal_eval(message.content)
                decrypted = Message.decrypt_message(
                    content_dict["ciphertext"],
                    content_dict["signature"],
                    message.sender,
                    message.receiver,
                )
            except Exception as e:
                decrypted = f"Unable to decrypt message: {e}"

            data = MessageSerializer(message).data
            data["decrypted_content"] = decrypted
            return Response(data)

        return Response({"detail": "Bad request"}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        serializer = None

        if request.data.get("sender") and request.data.get("group"):
            serializer = GroupMessageSerializer(data=request.data)

        elif request.data.get("sender") and request.data.get("receiver"):
            serializer = MessageSerializer(data=request.data)

        if serializer is not None:
            if serializer.is_valid():
                message = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {
                "error": "Invalid request: sender and group or sender and receiver required."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )


class GroupCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        user = request.data.get("user")

        user_instance = get_object_or_404(CustomUser, username=user)
        # Get all groups for the current user
        groups = Group.objects.filter(members=user_instance)
        if not groups.exists():
            return Response({"detail": "No groups found"}, status=status.HTTP_404_NOT_FOUND)
        serializer = GroupSerializer(groups, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = GroupSerializer(data=request.data)
        if serializer.is_valid():
            group = serializer.save()
            return Response(GroupSerializer(group).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GroupDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        serializer = GroupSerializer(group)
        return Response(serializer.data)

    def put(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        serializer = GroupSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            group = serializer.update(group, request.data)
            return Response(GroupSerializer(group).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # delete member from group
    def delete(self, request, pk):
        group = get_object_or_404(Group, pk=pk)
        serializer = GroupSerializer(group, data=request.data, partial=True)
        if serializer.is_valid():
            group = serializer.remove_member_by_name(group, request.data.get("member"))
            return Response(GroupSerializer(group).data)


