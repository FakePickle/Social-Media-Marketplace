import base64
import io

import qrcode
from django.contrib.auth import authenticate
from django.utils.decorators import method_decorator
from django_ratelimit.decorators import ratelimit
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import CustomUser, OTPVerification
from .serializers import (LoginSerializer, OTPVerificationSerializer,
                          RegisterSerializer)


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
                    "totp_uri": user.get_totp_uri(),
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
