import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from fastapi import status

# Import application components
from app.main import app
from app.models import User
from app.repositories import SupabaseUserRepository
from app.services import AuthService, InvalidCredentialsError
from app.dependencies import get_user_repository

class TestAuthSystem(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        
        # Sample user data for mocks
        self.mock_user_data = {
            "id": 1,
            "login": "john_doe",
            "email": "john@example.com",
            "password": "secretpassword123",
            "is_admin": False
        }
        
        self.mock_admin_data = {
            "id": 2,
            "login": "admin_user",
            "email": "admin@example.com",
            "password": "adminpassword123",
            "is_admin": True
        }

    def test_user_repository_get_user_by_login(self):
        """Test that UserRepository queries the database table correctly."""
        mock_supabase_client = MagicMock()
        mock_table = mock_supabase_client.table.return_value
        mock_select = mock_table.select.return_value
        mock_eq = mock_select.eq.return_value
        
        # Setup mock return value for successful query
        mock_eq.execute.return_value = MagicMock(data=[self.mock_user_data])
        
        repo = SupabaseUserRepository(mock_supabase_client)
        user = repo.get_user_by_login("john_doe")
        
        mock_supabase_client.table.assert_called_once_with("users")
        mock_table.select.assert_called_once_with("*")
        mock_select.eq.assert_called_once_with("login", "john_doe")
        
        self.assertIsNotNone(user)
        self.assertEqual(user.login, "john_doe")
        self.assertEqual(user.is_admin, False)

    def test_auth_service_authenticate_success(self):
        """Test that AuthService succeeds when credentials are valid."""
        mock_repo = MagicMock()
        mock_repo.get_user_by_login.return_value = User(**self.mock_user_data)
        
        service = AuthService(mock_repo)
        user = service.authenticate_user("john_doe", "secretpassword123")
        
        self.assertEqual(user.login, "john_doe")

    def test_auth_service_authenticate_failure(self):
        """Test that AuthService raises exception when credentials are invalid."""
        mock_repo = MagicMock()
        mock_repo.get_user_by_login.return_value = User(**self.mock_user_data)
        
        service = AuthService(mock_repo)
        
        # Test wrong password
        with self.assertRaises(InvalidCredentialsError):
            service.authenticate_user("john_doe", "wrong_password")
            
        # Test non-existent user
        mock_repo.get_user_by_login.return_value = None
        with self.assertRaises(InvalidCredentialsError):
            service.authenticate_user("unknown_user", "some_password")

    @patch("app.dependencies.get_supabase_client")
    def test_api_login_success(self, mock_get_supabase):
        """Test API Login Endpoint success with mocked repository."""
        # Create a mock repository
        mock_repo = MagicMock()
        mock_repo.get_user_by_login.return_value = User(**self.mock_admin_data)
        
        # Override dependency
        app.dependency_overrides[get_user_repository] = lambda: mock_repo
        
        try:
            response = self.client.post(
                "/api/auth/login",
                json={"login": "admin_user", "password": "adminpassword123"}
            )
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            data = response.json()
            self.assertEqual(data["login"], "admin_user")
            self.assertEqual(data["is_admin"], True)
            self.assertIn("access_token", data)
            self.assertEqual(data["token_type"], "bearer")
        finally:
            app.dependency_overrides.clear()

    @patch("app.dependencies.get_supabase_client")
    def test_api_login_unauthorized(self, mock_get_supabase):
        """Test API Login Endpoint returns 401 on failure."""
        mock_repo = MagicMock()
        mock_repo.get_user_by_login.return_value = None  # user not found
        
        app.dependency_overrides[get_user_repository] = lambda: mock_repo
        
        try:
            response = self.client.post(
                "/api/auth/login",
                json={"login": "nonexistent", "password": "password"}
            )
            
            self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
            data = response.json()
            self.assertEqual(data["detail"], "Неправильний логін або пароль")
        finally:
            app.dependency_overrides.clear()

    @patch("app.dependencies.get_supabase_client")
    def test_admin_dashboard_access(self, mock_get_supabase):
        """Test authorization levels for the protected admin route."""
        mock_repo = MagicMock()
        admin_user = User(**self.mock_admin_data)
        regular_user = User(**self.mock_user_data)
        
        # Mock database lookup for user verification dependency
        mock_repo.get_user_by_id.side_effect = lambda uid: admin_user if uid == 2 else regular_user
        mock_repo.get_user_by_login.return_value = admin_user
        
        app.dependency_overrides[get_user_repository] = lambda: mock_repo
        
        try:
            # Generate valid tokens using helper
            auth_service = AuthService(mock_repo)
            admin_token = auth_service.create_access_token(admin_user)
            user_token = auth_service.create_access_token(regular_user)
            
            # Case 1: Access without token should fail with HTTP 401 or HTTP 403 (due to HTTPBearer schema requirement)
            no_token_response = self.client.get("/api/admin/dashboard")
            self.assertIn(no_token_response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])
            
            # Case 2: Access with admin token should succeed (200)
            headers_admin = {"Authorization": f"Bearer {admin_token}"}
            admin_response = self.client.get("/api/admin/dashboard", headers=headers_admin)
            self.assertEqual(admin_response.status_code, status.HTTP_200_OK)
            self.assertIn("Welcome to the administrator dashboard", admin_response.json()["message"])
            
            # Case 3: Access with non-admin token should fail with HTTP 403 Forbidden
            headers_user = {"Authorization": f"Bearer {user_token}"}
            user_response = self.client.get("/api/admin/dashboard", headers=headers_user)
            self.assertEqual(user_response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertEqual(user_response.json()["detail"], "Доступ заборонено. Потрібні права адміністратора")
            
        finally:
            app.dependency_overrides.clear()

if __name__ == "__main__":
    unittest.main()
