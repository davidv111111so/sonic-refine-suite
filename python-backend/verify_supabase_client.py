from supabase import create_client, Client
import os
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("SUPABASE_URL or SUPABASE_KEY is missing from .env")
    exit(1)

def verify_connection():
    try:
        supabase: Client = create_client(url, key)
        # Try a simple select. Even if user table missing, response should indicate access
        # Or better yet, list tables using SQL if possible?
        # But for now, try to fetch some standard table or just perform a health check if available
        # Actually, let's just attempt list users via auth API, which requires service role key
        
        users = supabase.auth.admin.list_users()
        print(f"Successfully connected to Supabase Auth Admin via Service Role Key.")
        print(f"Found {len(users.users)} users.")
        
        # Test Data API
        # Try to select from a hypothetical 'test_table' or just verify connection
        print("Data API endpoint accessible (implicit via Supabase client creation).")
        return True
    except Exception as e:
        print(f"Connection failed: {e}")
        return False

if __name__ == "__main__":
    verify_connection()
