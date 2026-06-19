# Trigger reload to load new env settings (v2)
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.models import UserLoginRequest, TokenResponse, User
from app.dependencies import get_auth_service, verify_admin
from app.services import AuthService, InvalidCredentialsError

app = FastAPI(
    title="Kvitka-AI Auth API",
    description="Clean architecture FastAPI service for Supabase manual user auth and admin verification",
    version="1.0.0",
    servers=[{"url": "https://straining-dodgy-sage.ngrok-free.dev"}]
)

# Enable CORS for standard web client connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post(
    "/api/auth/login",
    response_model=TokenResponse,
    summary="User Login",
    description="Authenticate a user manually via custom login and password credentials. Returns a JWT access token and user information."
)
def login(
    payload: UserLoginRequest,
    auth_service: AuthService = Depends(get_auth_service)
):
    """
    Login endpoint. Compares plaintext password and returns user details + JWT token.
    Raises 401 with standard localized message if login or password matches incorrectly.
    """
    try:
        user = auth_service.authenticate_user(payload.login, payload.password)
        access_token = auth_service.create_access_token(user)
        
        # Returns user details id, login, is_admin, and access_token
        return TokenResponse(
            id=user.id,
            login=user.login,
            is_admin=user.is_admin,
            access_token=access_token,
            token_type="bearer"
        )
    except InvalidCredentialsError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неправильний логін або пароль"
        )

@app.get(
    "/api/admin/dashboard",
    summary="Admin Dashboard Example",
    description="Example of a protected admin dashboard route. Requires a valid JWT token representing an administrator."
)
def get_admin_dashboard(
    current_admin: User = Depends(verify_admin)
):
    """
    Protected route example. Only accessible by users with is_admin set to True.
    """
    return {
        "status": "success",
        "message": "Welcome to the administrator dashboard",
        "admin": {
            "id": current_admin.id,
            "login": current_admin.login,
            "email": current_admin.email
        },
        "stats": {
            "version": "1.0.0",
            "environment": "production-ready"
        }
    }

# General global database error mapping helper to return 500 cleanly
@app.exception_handler(RuntimeError)
def runtime_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": f"Database or runtime error: {str(exc)}"}
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
