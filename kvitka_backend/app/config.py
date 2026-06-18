import os
from pathlib import Path

def load_env():
    """
    Manually load .env file if it exists, to avoid strict dependencies 
    on python-dotenv or pydantic-settings in simple environments.
    """
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
                if key:
                    os.environ[key] = val

# Load the environment variables from .env
load_env()

class Settings:
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "super-secret-key-for-local-development-only")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    def validate(self):
        if not self.SUPABASE_URL or "your-project-id" in self.SUPABASE_URL:
            raise ValueError("SUPABASE_URL environment variable is not configured correctly.")
        if not self.SUPABASE_KEY or "your-anon-public-key" in self.SUPABASE_KEY:
            raise ValueError("SUPABASE_KEY environment variable is not configured correctly.")

settings = Settings()
