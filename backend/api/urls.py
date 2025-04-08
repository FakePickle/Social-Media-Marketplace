from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView, TokenRefreshView

from .views import (LoginView, RegisterView,
                    MessageView, GroupCreateView, GroupDetailView,
                    FriendshipView, CombinedChatGroupView, VerifyEmailView,
                    )

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/blacklist/", TokenBlacklistView.as_view(), name="token_blacklist"),
    # path("users/", UserView.as_view(), name="user-list"),
    path("messages/", MessageView.as_view(), name="messages"),
    path("messages/<int:pk>/", MessageView.as_view(), name="message-detail"),
    path('groups/', GroupCreateView.as_view(), name='create-group'),
    path('groups/<int:pk>/', GroupDetailView.as_view(), name='group-detail'),
    path('friendships/', FriendshipView.as_view(), name='friendship-list-create'),
    path('friendships/delete/', FriendshipView.as_view(), name='friendship-delete'),
    path('allChats/', CombinedChatGroupView.as_view(), name='all-chats'),
]
