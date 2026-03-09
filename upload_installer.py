
import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load from python-backend/.env
load_dotenv('python-backend/.env')

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")

if not url or not key:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found in .env")
    sys.exit(1)

supabase: Client = create_client(url, key)

bucket_name = "downloads"
file_path = "src-tauri/target/release/level-player.exe"
destination_path = "LevelPlayer_Windows.exe"

def upload_file():
    try:
        # Check if bucket exists, create if not
        buckets = supabase.storage.list_buckets()
        if not any(b.name == bucket_name for b in buckets):
            print(f"Creating bucket: {bucket_name}")
            supabase.storage.create_bucket(bucket_name, options={"public": True})
        
        # Upload
        print(f"Uploading {file_path} to {bucket_name}/{destination_path}...")
        with open(file_path, 'rb') as f:
            supabase.storage.from_(bucket_name).upload(
                path=destination_path,
                file=f,
                file_options={"content-type": "application/vnd.microsoft.portable-executable", "x-upsert": "true"}
            )
        
        # Get Public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(destination_path)
        print(f"SUCCESS! Public URL: {public_url}")
        return public_url
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    upload_file()
