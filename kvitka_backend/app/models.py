from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class User(BaseModel):
    """
    Domain model representing the database record schema.
    """
    id: int
    login: str
    email: str
    password: str
    is_admin: bool

    class Config:
        from_attributes = True
        populate_by_name = True

class UserLoginRequest(BaseModel):
    """
    Pydantic schema to validate the incoming login request JSON payload.
    """
    login: str = Field(..., min_length=1, description="The user's unique login handle")
    password: str = Field(..., min_length=1, description="The user's plain text password")

class UserResponse(BaseModel):
    """
    Pydantic schema returned upon successful login, containing basic user details.
    """
    id: int
    login: str
    is_admin: bool

    class Config:
        from_attributes = True

class TokenResponse(UserResponse):
    """
    Pydantic schema containing both the user's profile details and the generated access token.
    This fulfills the requirement of returning the user's id, login, and is_admin, while
    providing the bearer token needed for subsequent protected requests.
    """
    access_token: str
    token_type: str = "bearer"
