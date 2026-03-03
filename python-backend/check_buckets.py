import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("❌ Missing Supabase credentials in .env")
    exit(1)

supabase: Client = create_client(url, key)

try:
    print(f"📡 Checking buckets at {url}...")
    buckets = supabase.storage.list_buckets()
    print("📦 Existing buckets:")
    for b in buckets:
        print(f" - {b.name}")
    
    bucket_names = [b.name for b in buckets]
    if "audio-processing" not in bucket_names:
        print("🚀 Creating 'audio-processing' bucket...")
        supabase.storage.create_bucket("audio-processing", options={"public": True})
        print("✅ Bucket created!")
    else:
        print("✨ Bucket 'audio-processing' already exists.")

    if "avatars" not in bucket_names:
        print("🚀 Creating 'avatars' bucket...")
        supabase.storage.create_bucket("avatars", options={"public": True})
        print("✅ Bucket 'avatars' created!")
    else:
        print("✨ Bucket 'avatars' already exists.")
except Exception as e:
    print(f"❌ Error: {str(e)}")
