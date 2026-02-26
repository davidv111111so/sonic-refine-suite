import os
import sys
from b2sdk.v2 import InMemoryAccountInfo, B2Api
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

KEY_ID = os.environ.get("B2_APPLICATION_KEY_ID")
APP_KEY = os.environ.get("B2_APPLICATION_KEY")
BUCKET_NAME = os.environ.get("B2_BUCKET_NAME")

if not KEY_ID or not APP_KEY or not BUCKET_NAME:
    print("❌ Missing B2 credentials in .env file")
    sys.exit(1)

def update_cors():
    print(f"🔄 Authenticating with B2...")
    info = InMemoryAccountInfo()
    b2_api = B2Api(info)
    
    try:
        b2_api.authorize_account("production", KEY_ID, APP_KEY)
        bucket = b2_api.get_bucket_by_name(BUCKET_NAME)
        print(f"✅ Authenticated. Bucket: {bucket.name} ({bucket.id_})")
        
        # Define CORS rules
        cors_rules = [
            {
                "corsRuleName": "allowAny",
                "allowedOrigins": ["*"],
                "allowedOperations": [
                    "b2_download_file_by_id",
                    "b2_download_file_by_name",
                    "b2_upload_file",
                    "b2_upload_part",
                    "s3_delete",
                    "s3_get",
                    "s3_head",
                    "s3_post",
                    "s3_put"
                ],
                "allowedHeaders": [
                    "authorization",
                    "content-type",
                    "x-bz-file-name",
                    "x-bz-content-sha1"
                ],
                "exposeHeaders": ["x-bz-content-sha1"],
                "maxAgeSeconds": 3600
            }
        ]
        
        print(f"🔄 Updating CORS rules for {BUCKET_NAME}...")
        bucket.update(cors_rules=cors_rules)
        
        print("✅ CORS rules updated successfully!")
        print("Allowed Origins:")
        for origin in cors_rules[0]["allowedOrigins"]:
            print(f"  - {origin}")
            
    except Exception as e:
        print(f"❌ Error updating CORS: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    update_cors()
