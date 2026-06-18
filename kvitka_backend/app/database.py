from supabase import create_client, Client
from app.config import settings

# Initialize Supabase client
# Note: Validation of settings can be deferred until the client is used or executed here.
# To allow server to start even if environment variables are not fully configured yet,
# we can wrap the creation or perform checks.
supabase: Client = None

def get_supabase_client() -> Client:
    global supabase
    if supabase is None:
        settings.validate()
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return supabase
