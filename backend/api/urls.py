from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from .views import (
    AvailableMarketPlaceListView,
    LoginView,
    MarketPlaceDetailView,
    MarketPlaceListCreateView,
    RegisterView,
    MessageView,
    GroupCreateView,
    GroupDetailView,
    FriendshipView,
    CombinedChatGroupView,
    UserMarketPlaceListView,
    VerifyEmailView,
    VerifyTOTPView,
    RequestPasswordResetView,
    VerifyPasswordResetView,
    ResetPasswordView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("verify-2fa/", VerifyTOTPView.as_view(), name="verify-2fa"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    # Password reset endpoints
    path(
        "request-password-reset/",
        RequestPasswordResetView.as_view(),
        name="request-password-reset",
    ),
    path(
        "verify-password-reset/",
        VerifyPasswordResetView.as_view(),
        name="verify-password-reset",
    ),
    path("reset-password/", ResetPasswordView.as_view(), name="reset-password"),
    # path("users/", UserView.as_view(), name="user-list"),
    path("messages/", MessageView.as_view(), name="messages"),
    path("messages/<int:pk>/", MessageView.as_view(), name="message-detail"),
    path("groups/", GroupCreateView.as_view(), name="create-group"),
    path("groups/<int:pk>/", GroupDetailView.as_view(), name="group-detail"),
    path("friendships/", FriendshipView.as_view(), name="friendship-list-create"),
    path("friendships/accept/", FriendshipView.as_view(), name="friendship-accept"),
    path("friendships/delete/", FriendshipView.as_view(), name="friendship-delete"),
    path("allChats/", CombinedChatGroupView.as_view(), name="all-chats"),
    # List all items and create new ones
    path(
        "marketplace/",
        MarketPlaceListCreateView.as_view(),
        name="marketplace-list-create",
    ),
    # Retrieve, update, or delete specific item
    path(
        "marketplace/<int:pk>/",
        MarketPlaceDetailView.as_view(),
        name="marketplace-detail",
    ),
    # List current user's items
    path(
        "marketplace/my-items/",
        UserMarketPlaceListView.as_view(),
        name="my-marketplace-items",
    ),
    # List available (unsold) items
    path(
        "marketplace/available/",
        AvailableMarketPlaceListView.as_view(),
        name="available-marketplace-items",
    ),
]
