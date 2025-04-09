from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from .views import (
    AvailableMarketPlaceListView,
    CombinedChatGroupView,
    FriendshipView,
    GroupCreateView,
    GroupDetailView,
    ListUserView,
    LoginView,
    MarketPlaceDetailView,
    MarketPlaceListCreateView,
    MessageView,
    RegisterView,
    RequestPasswordResetView,
    ResetPasswordView,
    UserProfileView,
    VerifyEmailView,
    VerifyPasswordResetView,
    VerifyTOTPView,
    UserManagementView,
    UserListView,
    AdminDashboardView,
    AdminMarketplaceItemView,
    AdminMarketplaceListView,
    UserProfileView,
)
from .views import (AvailableMarketPlaceListView, ChatListCreateView,
                    CombinedChatGroupView, FriendshipView, GroupCreateView,
                    GroupDetailView, ListUserView, LoginView,
                    MarketPlaceDetailView, MarketPlaceListCreateView,
                    MessageView, RegisterView, RequestPasswordResetView,
                    ResetPasswordView, UserMarketPlaceListView,
                    UserProfileView, VerifyEmailView, VerifyPasswordResetView,
                    VerifyTOTPView)

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
    # User endpoints
    path("users/", ListUserView.as_view(), name="list-users"),
    path("user/profile/", UserProfileView.as_view(), name="current-user-profile"),
    path("user/profile/<int:user_id>/", UserProfileView.as_view(), name="user-profile"),
    path("messages/", MessageView.as_view(), name="messages"),
    path("groups/", GroupCreateView.as_view(), name="create-group"),
    path("groups/<int:pk>/", GroupDetailView.as_view(), name="group-detail"),
    path("create-chat/", ChatListCreateView.as_view(), name="create-chat"),
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
    # User Management
    path("admin/users/", UserListView.as_view(), name="admin_user_list"),
    path(
        "admin/users/<int:user_id>/",
        UserManagementView.as_view(),
        name="admin_user_management",
    ),
    # Marketplace Management
    path(
        "admin/marketplace/",
        AdminMarketplaceListView.as_view(),
        name="admin_marketplace_list",
    ),
    path(
        "admin/marketplace/<int:item_id>/",
        AdminMarketplaceItemView.as_view(),
        name="admin_marketplace_item",
    ),
    # Dashboard
    path("admin/dashboard/", AdminDashboardView.as_view(), name="admin_dashboard"),
]
