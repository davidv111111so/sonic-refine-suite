import os
import tempfile
from datetime import timedelta
from google.cloud import storage
from google.auth.exceptions import DefaultCredentialsError

GCS_BUCKET = os.environ.get("GCS_BUCKET")


def _require_bucket():
    if not GCS_BUCKET:
        raise RuntimeError("GCS_BUCKET environment variable is not set")


def _get_client():
    try:
        return storage.Client()
    except DefaultCredentialsError as exc:
        # Re-raise with clearer message for local dev
        raise RuntimeError(
            "Google Application Default Credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS or run `gcloud auth application-default login`."
        ) from exc


def upload_fileobj_to_gcs(fileobj, destination_blob_name, content_type=None):
    """Upload a file-like object to GCS and return the blob name."""
    _require_bucket()
    client = _get_client()
    bucket = client.bucket(GCS_BUCKET)
    blob = bucket.blob(destination_blob_name)
    try:
        fileobj.seek(0)
    except Exception:
        pass
    blob.upload_from_file(fileobj, content_type=content_type)
    return blob.name


def upload_filepath_to_gcs(filepath, destination_blob_name, content_type=None):
    """Upload a local file (by path) to GCS and return the blob name."""
    _require_bucket()
    client = _get_client()
    bucket = client.bucket(GCS_BUCKET)
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(filepath, content_type=content_type)
    return blob.name


def download_blob_to_tempfile(blob_name, suffix=None):
    """Download a blob to a temporary local file and return its path."""
    _require_bucket()
    client = _get_client()
    bucket = client.bucket(GCS_BUCKET)
    blob = bucket.blob(blob_name)
    fd, local_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    blob.download_to_filename(local_path)
    return local_path


def generate_signed_url(blob_name, expiration_seconds=3600):
    """Generate a signed URL for a blob in the configured bucket."""
    _require_bucket()
    client = _get_client()
    bucket = client.bucket(GCS_BUCKET)
    blob = bucket.blob(blob_name)
    url = blob.generate_signed_url(expiration=timedelta(seconds=expiration_seconds))
    return url
