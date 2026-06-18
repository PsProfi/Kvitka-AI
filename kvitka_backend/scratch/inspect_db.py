import os
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

print(f"Connecting to Supabase: {url}")
try:
    supabase = create_client(url, key)
    response = supabase.table("users").select("id, login, email, password, is_admin").execute()
    users = response.data
    print(f"Query successful. Found {len(users)} user(s):")
    for u in users:
        print(f" - ID: {u.get('id')}, Login: {u.get('login')}, Password: {u.get('password')}, Is Admin: {u.get('is_admin')}")
except Exception as e:
    print(f"Error executing query: {str(e)}")
