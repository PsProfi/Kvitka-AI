import os
import sys
from pathlib import Path
from supabase import create_client

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

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in environment")
    exit(1)

supabase = create_client(url, key)

def create_user(login, email, password, is_admin):
    # Check if user already exists
    response = supabase.table("users").select("*").eq("login", login).execute()
    if response.data:
        print(f"User with login '{login}' already exists.")
        return

    # Insert user
    user_data = {
        "login": login,
        "email": email,
        "password": password,
        "is_admin": is_admin
    }
    
    try:
        insert_response = supabase.table("users").insert(user_data).execute()
        if insert_response.data:
            created = insert_response.data[0]
            print(f"Successfully created user:")
            print(f" - ID: {created.get('id')}")
            print(f" - Login: {created.get('login')}")
            print(f" - Email: {created.get('email')}")
            print(f" - Password: {created.get('password')}")
            print(f" - Is Admin: {created.get('is_admin')}")
        else:
            print("Failed to insert user - no data returned.")
    except Exception as e:
        print(f"Error creating user: {str(e)}")

if __name__ == "__main__":
    # If arguments are provided: python create_user.py <login> <email> <password> <is_admin>
    if len(sys.argv) >= 5:
        login = sys.argv[1]
        email = sys.argv[2]
        password = sys.argv[3]
        is_admin = sys.argv[4].lower() in ("true", "1", "yes")
        create_user(login, email, password, is_admin)
    else:
        # Default: Create a test admin and a test regular user
        print("Creating default users (admin & regular user)...")
        create_user("admin", "admin@example.com", "admin123", True)
        create_user("user", "user@example.com", "user123", False)
