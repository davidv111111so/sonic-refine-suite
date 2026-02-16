import os
import requests
from b2sdk.v2 import InMemoryAccountInfo, B2Api
from typing import Optional

class B2Service:
    def __init__(self):
        self.key_id = os.environ.get("B2_APPLICATION_KEY_ID")
        self.application_key = os.environ.get("B2_APPLICATION_KEY")
        self.bucket_name = os.environ.get("B2_BUCKET_NAME")
        
        self.api = None
        self.bucket = None
        
        if self.key_id and self.application_key:
            self.authenticate()

    def authenticate(self):
        """Authenticate with Backblaze B2"""
        try:
            info = InMemoryAccountInfo()
            self.api = B2Api(info)
            self.api.authorize_account("production", self.key_id, self.application_key)
            if self.bucket_name:
                self.bucket = self.api.get_bucket_by_name(self.bucket_name)
                print(f"✅ B2 Authenticated: {self.bucket_name}")
        except Exception as e:
            print(f"❌ B2 Authentication failed: {str(e)}")
            self.api = None

    def get_upload_url(self, file_name: str, content_type: str = "audio/wav"):
        """
        Generate a presigned upload URL or authorization.
        Note: B2 handling of frontend uploads usually involves 'b2_get_upload_url'.
        For simplicity, we might proxy the upload or provide an auth token.
        """
        if not self.bucket:
            self.authenticate()
        if not self.bucket:
            return None
        
        # B2 uses a different pattern than S3 for presigned uploads.
        # We can use the b2_get_upload_url to give the frontend what it needs.
        try:
            # In b2sdk v2.x, get_upload_url is typically on the session and returns a dict
            # We access the session via the api object
            upload_url_info = self.api.session.get_upload_url(self.bucket.id_)
            
            return {
                "uploadUrl": upload_url_info['uploadUrl'],
                "authorizationToken": upload_url_info['authorizationToken'],
                "fileName": file_name
            }
        except Exception as e:
            print(f"❌ Failed to get B2 upload URL: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

    def upload_file(self, local_path: str, remote_path: str, content_type: str = "audio/wav"):
        """Upload a file directly from the backend to B2"""
        if not self.bucket:
            self.authenticate()
        if not self.bucket:
            return None
            
        try:
            print(f"📤 Uploading to B2: {remote_path}...")
            # We'll use a unique name in B2 to avoid conflicts
            self.bucket.upload_local_file(
                local_file=local_path,
                file_name=remote_path,
                content_type=content_type
            )
            # Return a b2:// protocol URL for internal use
            return f"b2://{remote_path}"
        except Exception as e:
            print(f"❌ B2 Upload failed: {str(e)}")
            return None

    def get_download_url(self, remote_path: str, valid_duration: int = 3600):
        """Generate an authorized download URL for a private file"""
        if not self.bucket:
            self.authenticate()
        if not self.bucket:
            return None
            
        try:
            # In b2sdk v2.x, the bucket object has get_download_authorization which returns a string
            auth_token = self.bucket.get_download_authorization(
                file_name_prefix=remote_path,
                valid_duration_in_seconds=valid_duration
            )
            
            # Construct the authorized URL
            base_url = self.api.get_download_url_for_file_name(self.bucket_name, remote_path)
            # The token is passed as a query param named 'Authorization'
            return f"{base_url}?Authorization={auth_token}"
        except Exception as e:
            print(f"❌ Failed to get B2 download URL: {str(e)}")
            import traceback
            traceback.print_exc()
            return None

    def download_file(self, remote_path: str, local_path: str):
        """Download a file from B2 to local backend using authorized URL"""
        try:
            # Handle cases where the path might include the bucket name prefix
            # e.g. b2://bucket-name/file.wav -> remote_path = "bucket-name/file.wav"
            if self.bucket_name and remote_path.startswith(f"{self.bucket_name}/"):
                print(f"🧹 Stripping bucket name from path: {remote_path}")
                remote_path = remote_path.replace(f"{self.bucket_name}/", "", 1)
            
            url = self.get_download_url(remote_path)
            if not url:
                print(f"❌ Could not generate download URL for: {remote_path}")
                return False
                
            print(f"📥 Downloading from B2 URL: {remote_path}...")
            response = requests.get(url, stream=True, timeout=300)
            response.raise_for_status()
            
            with open(local_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=65536):
                    f.write(chunk)
            
            print(f"✅ B2 Download successful: {local_path}")
            return True
        except Exception as e:
            print(f"❌ B2 Download failed: {str(e)}")
            if os.path.exists(local_path):
                os.remove(local_path)
            return False

# Singleton instance
b2_service = B2Service()
