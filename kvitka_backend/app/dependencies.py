from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.database import get_supabase_client
from app.repositories import AbstractUserRepository, SupabaseUserRepository
from app.services import AuthService, TokenValidationError
from app.models import User

# Standard HTTP Bearer scheme setup for OpenAPI docs compatibility
security = HTTPBearer()

def get_user_repository() -> AbstractUserRepository:
    """
    Dependency function to provide a UserRepository instance configured with Supabase client.
    """
    client = get_supabase_client()
    return SupabaseUserRepository(client)

def get_auth_service(
    repo: AbstractUserRepository = Depends(get_user_repository)
) -> AuthService:
    """
    Dependency function to provide the AuthService instance.
    """
    return AuthService(repo)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    auth_service: AuthService = Depends(get_auth_service)
) -> User:
    """
    Extracts the bearer token, decodes and validates it via AuthService, 
    and returns the corresponding database User entity.
    """
    token = credentials.credentials
    try:
        payload = auth_service.verify_token(token)
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token payload is missing user ID (sub)"
            )
        
        user_id = int(user_id_str)
        user = auth_service.user_repo.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found in system"
            )
        return user
    except TokenValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token subject identifier format is invalid"
        )

def verify_admin(current_user: User = Depends(get_current_user)) -> User:
    """
    FastAPI dependency function to check if the current user has admin rights.
    Raises HTTP 403 Forbidden with specific local message if not admin.
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Доступ заборонено. Потрібні права адміністратора"
        )
    return current_user
