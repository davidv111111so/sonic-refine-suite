import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

try:
    print("🧪 Testing upload to 'audio-processing'...")
    with open("test.txt", "w") as f:
        f.write("test")
    
    with open("test.txt", "rb") as f:
        res = supabase.storage.from_("audio-processing").upload("test-connection.txt", f, {"upsert": "true"})
        print("✅ Test upload successful!")
        
    supabase.storage.from_("audio-processing").remove(["test-connection.txt"])
    print("🗑️ Test file cleaned up.")
    os.remove("test.txt")
except Exception as e:
    print(f"❌ Test upload failed: {str(e)}")
