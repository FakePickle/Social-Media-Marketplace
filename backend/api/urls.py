from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from .views import (GetTOTPQRView, LoginView,
                    OTPVerifyView, RegisterView,
                    MessageView, ProtectedView,
                    GroupCreateView, GroupDetailView,
                    GroupMemberUpdateView, FriendshipView)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("verify-totp/", OTPVerifyView.as_view(), name="verify-totp"),
    path("totp-qr/", GetTOTPQRView.as_view(), name="totp-qr"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("protected/", ProtectedView.as_view(), name="protected"),
    path("messages/", MessageView.as_view(), name="messages"),
    path("messages/<int:pk>/", MessageView.as_view(), name="message-detail"),
    path('groups/', GroupCreateView.as_view(), name='create-group'),
    path('groups/<int:pk>/', GroupDetailView.as_view(), name='group-detail'),
    path('groups/<int:pk>/members/', GroupMemberUpdateView.as_view(), name='update-group-members'),
    path('friendships/', FriendshipView.as_view(), name='friendship-list-create'),
    path('friendships/delete/', FriendshipView.as_view(), name='friendship-delete')
]
