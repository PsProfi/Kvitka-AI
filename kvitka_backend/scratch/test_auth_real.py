import os
import sys
from pathlib import Path

# Add project root to path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from supabase import create_client
from app.repositories import SupabaseUserRepository
from app.services import AuthService

def load_env():
    env_path = Path(__file__).resolve().parent.parent / ".env"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                val = val.strip().strip("'\"")
                if key and key not in os.environ:
                    os.environ[key] = val

load_env()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print("SUPABASE_URL:", url)
print("SUPABASE_KEY:", key[:10] + "..." if key else "None")

supabase = create_client(url, key)
repo = SupabaseUserRepository(supabase)
service = AuthService(repo)

print("\n--- Test 1: Querying UserRepository directly ---")
try:
    user = repo.get_user_by_login("admin")
    if user:
        print(f"SUCCESS: User found: login={user.login}, email={user.email}, password={user.password}, is_admin={user.is_admin}")
    else:
        print("FAILURE: User 'admin' not found in database.")
except Exception as e:
    print(f"ERROR querying repository: {str(e)}")

print("\n--- Test 2: Simulating AuthService authentication ---")
try:
    authenticated = service.authenticate_user("admin", "admin123")
    print(f"SUCCESS: AuthService authenticated: {authenticated.login}")
except Exception as e:
    print(f"FAILURE: AuthService rejected: {type(e).__name__}: {str(e)}")
