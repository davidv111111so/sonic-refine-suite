
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def check_table(name):
    print(f"--- Checking table: {name} ---")
    try:
        res = supabase.table(name).select("*").limit(1).execute()
        print(f"✅ Success: {name} found.")
        print(f"Sample data length: {len(res.data)}")
    except Exception as e:
        print(f"❌ Error for {name}: {e}")

check_table("job_logs")
check_table("job_history")
check_table("profiles")
check_table("user_roles")
