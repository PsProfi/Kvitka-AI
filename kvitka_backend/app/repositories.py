from abc import ABC, abstractmethod
from typing import Optional
from supabase import Client
from app.models import User

class AbstractUserRepository(ABC):
    """
    Interface for User data access. Establishes Dependency Inversion Principle,
    allowing the service layer to depend on an abstraction rather than concrete Supabase clients.
    """
    @abstractmethod
    def get_user_by_login(self, login: str) -> Optional[User]:
        """
        Fetch a user from the persistent storage by their unique login handle.
        """
        pass

    @abstractmethod
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """
        Fetch a user from the persistent storage by their unique ID.
        """
        pass

class SupabaseUserRepository(AbstractUserRepository):
    """
    Supabase-specific implementation of the UserRepository interface.
    """
    def __init__(self, client: Client):
        self.client = client

    def get_user_by_login(self, login: str) -> Optional[User]:
        try:
            response = self.client.table("users").select("*").eq("login", login).execute()
            data = response.data
            if not data:
                return None
            # pyrefly: ignore [bad-unpacking]
            return User(**data[0])
        except Exception as e:
            # Propagate database or network-level errors as high-level RuntimeErrors
            raise RuntimeError(f"Supabase database error: {str(e)}")

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        try:
            response = self.client.table("users").select("*").eq("id", user_id).execute()
            data = response.data
            if not data:
                return None
            # pyrefly: ignore [bad-unpacking]
            return User(**data[0])
        except Exception as e:
            raise RuntimeError(f"Supabase database error: {str(e)}")
