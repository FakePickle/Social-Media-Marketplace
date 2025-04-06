from django.contrib.auth import get_user_model
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

User = get_user_model()


class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that just extends the standard SimpleJWT authentication.
    """
    def get_user(self, validated_token):
        """Get user from validated token"""
        user_id = validated_token.get("user_id")
        if not user_id:
            return None
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None
