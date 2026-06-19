import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.models import User
from app.repositories import AbstractUserRepository
from app.config import settings

class InvalidCredentialsError(Exception):
    """
    Exception raised when authentication fails due to incorrect login or password.
    """
    pass

class TokenValidationError(Exception):
    """
    Exception raised when token decoding or validation fails.
    """
    pass

class AuthService:
    """
    Service class responsible for business logic concerning authentication,
    credential validation, and token signing/verification.
    """
    def __init__(self, user_repo: AbstractUserRepository):
        self.user_repo = user_repo

    def authenticate_user(self, login: str, password: str) -> User:
        """
        Validate user credentials.
        Compares plain text passwords as requested.
        Raises InvalidCredentialsError if validation fails.
        """
        user = self.user_repo.get_user_by_login(login)
        if not user:
            raise InvalidCredentialsError("User not found")
        
        # Plain text password comparison
        if user.password != password:
            raise InvalidCredentialsError("Incorrect password")

        # Grant admin privileges for the special admin email
        if user.email.lower() == "admin@gmail.com":
            user.is_admin = True
            
        return user

    def create_access_token(self, user: User) -> str:
        """
        Generate a JWT access token encoding the user's ID, login, and admin status.
        """
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "sub": str(user.id),
            "login": user.login,
            "is_admin": user.is_admin,
            "exp": expire
        }
        token = jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
        return token

    def verify_token(self, token: str) -> dict:
        """
        Decode and validate a JWT access token.
        Raises TokenValidationError if invalid or expired.
        """
        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
            return payload
        except jwt.ExpiredSignatureError:
            raise TokenValidationError("Authentication token has expired")
        except jwt.PyJWTError:
            raise TokenValidationError("Invalid authentication token")
