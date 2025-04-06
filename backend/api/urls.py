from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from .views import GetTOTPQRView, LoginView, OTPVerifyView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("verify-totp/", OTPVerifyView.as_view(), name="verify-totp"),
    path("totp-qr/", GetTOTPQRView.as_view(), name="totp-qr"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
]
