import os
from functools import wraps
from flask import Flask, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
import matchering as mg
import uuid
import jwt
from typing import Optional, Dict

# Optional: load API key from env for simple auth during dev
APP_API_KEY = os.environ.get("MATCHERING_API_KEY", "dev-secret-key")

# --- Configuration ---
UPLOAD_FOLDER = "uploads"
RESULTS_FOLDER = "results"
ALLOWED_EXTENSIONS = {"wav", "mp3", "flac"}
JOBS_FOLDER = "jobs"

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["RESULTS_FOLDER"] = RESULTS_FOLDER
# Configure max upload size (default 100 MB) - can be overridden with env MATCHERING_MAX_UPLOAD
app.config["MAX_CONTENT_LENGTH"] = int(
    os.environ.get("MATCHERING_MAX_UPLOAD", 100 * 1024 * 1024)
)


def _verify_supabase_jwt(token: str) -> Optional[Dict]:
    """
    Verify Supabase JWT using the project secret (HS256). If valid, return the decoded payload.
    Set SUPABASE_JWT_SECRET in env for production. This is a simple verification - adapt to your needs.
    """
    secret = os.environ.get("SUPABASE_JWT_SECRET")
    if not secret:
        return None
    try:
        # NOTE: Supabase JWTs are typically HS256 signed with the project's anon/public key
        payload = jwt.decode(
            token, secret, algorithms=["HS256"], options={"verify_aud": False}
        )
        return payload
    except Exception:
        return None


def require_api_key(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Accept API key via header 'X-API-Key' or Authorization Bearer
        key = None
        if "X-API-Key" in request.headers:
            key = request.headers.get("X-API-Key")
        auth = request.headers.get("Authorization")
        if not key and auth and auth.startswith("Bearer "):
            bearer = auth.replace("Bearer ", "")
            # First, if SUPABASE_JWT_SECRET exists try to validate JWT
            payload = _verify_supabase_jwt(bearer)
            if payload:
                # JWT validated; allow request. Optionally check payload claims here.
                return f(*args, **kwargs)
            # If not a valid JWT, treat bearer as API key fallback
            key = bearer

        if not key or key != APP_API_KEY:
            return jsonify({"error": "Unauthorized - invalid API key or token"}), 401
        return f(*args, **kwargs)

    return decorated


# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)
os.makedirs(JOBS_FOLDER, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


# Health endpoint
@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "matchering-api"}), 200


# --- Main Mastering Endpoint ---
# In Part 2, we will add security to this endpoint.
@app.route("/api/ai-mastering", methods=["POST"])
@require_api_key
def ai_mastering_endpoint():
    # 1. --- Validate File Uploads ---
    if "target" not in request.files:
        return jsonify({"error": "No target file part"}), 400

    target_file = request.files["target"]

    if target_file.filename == "":
        return jsonify({"error": "No selected target file"}), 400

    if not target_file or not allowed_file(target_file.filename):
        return jsonify({"error": "Target file type not allowed"}), 400

    # Additional size check: some WSGI servers may not enforce MAX_CONTENT_LENGTH
    target_file.seek(0, os.SEEK_END)
    size = target_file.tell()
    target_file.seek(0)
    if size > app.config["MAX_CONTENT_LENGTH"]:
        return jsonify({"error": "Target file too large"}), 413

    # Securely save the target file
    # secure_filename expects a str; guard if filename is None
    target_filename = secure_filename(target_file.filename or "uploaded_target")
    target_path = os.path.join(app.config["UPLOAD_FOLDER"], target_filename)
    target_file.save(target_path)

    reference_path = None

    # 2. --- Determine Reference: Upload or Preset ---
    if "reference" in request.files:
        # Use the uploaded reference file
        reference_file = request.files["reference"]
        if reference_file and allowed_file(reference_file.filename):
            # size check for reference
            reference_file.seek(0, os.SEEK_END)
            rsize = reference_file.tell()
            reference_file.seek(0)
            if rsize > app.config["MAX_CONTENT_LENGTH"]:
                return jsonify({"error": "Reference file too large"}), 413
            reference_filename = secure_filename(
                reference_file.filename or "uploaded_reference"
            )
            reference_path = os.path.join(
                app.config["UPLOAD_FOLDER"], reference_filename
            )
            reference_file.save(reference_path)
        else:
            return jsonify({"error": "Reference file type not allowed"}), 400
    elif "preset_id" in request.form:
        # Use a genre preset
        preset_id = request.form["preset_id"]
        # This is where you map the ID to your stored preset files
        # IMPORTANT: Store your preset files securely on the server
        preset_file_path = f"presets/{preset_id}.wav"  # Example path
        if os.path.exists(preset_file_path):
            reference_path = preset_file_path
        else:
            return jsonify({"error": "Invalid preset ID"}), 400
    else:
        return jsonify({"error": "No reference file or preset ID provided"}), 400

    # 3. --- Process with Matchering ---
    try:
        # Generate a unique filename for the output
        unique_id = str(uuid.uuid4())
        output_filename = f"mastered_{unique_id}.wav"
        output_path = os.path.join(app.config["RESULTS_FOLDER"], output_filename)

        mg.log(print)  # Log progress to console
        mg.process(
            target=target_path,
            reference=reference_path,
            results=[
                mg.pcm24(output_path),
            ],
        )

        # 4. --- Return Download Information ---
        return jsonify(
            {
                "fileName": output_filename,
                "downloadUrl": f"/api/download/{output_filename}",
            }
        )

    except Exception as e:
        # Clean up uploaded files on error
        if os.path.exists(target_path):
            os.remove(target_path)
        if (
            reference_path
            and "uploads" in reference_path
            and os.path.exists(reference_path)
        ):
            os.remove(reference_path)
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up uploaded files after processing
        if os.path.exists(target_path):
            os.remove(target_path)
        if (
            reference_path
            and "uploads" in reference_path
            and os.path.exists(reference_path)
        ):
            os.remove(reference_path)


@app.route("/api/upload", methods=["POST"])
@require_api_key
def upload_file():
    # Accept a single file under field 'target' (or 'file') and save to uploads folder.
    if "target" not in request.files and "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file_field = request.files.get("target") or request.files.get("file")
    if not file_field or file_field.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file_field.filename):
        return jsonify({"error": "File type not allowed"}), 400

    # size check
    file_field.seek(0, os.SEEK_END)
    size = file_field.tell()
    file_field.seek(0)
    if size > app.config["MAX_CONTENT_LENGTH"]:
        return jsonify({"error": "File too large"}), 413

    filename = secure_filename(file_field.filename or f"uploaded_{str(uuid.uuid4())}")
    path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file_field.save(path)

    # Return server-side path that can be used with /api/start-mastering-job
    return jsonify({"path": path, "filename": filename}), 200


# --- Queued job endpoints (simple local implementation) ---
import threading
import json


def _job_status_path(job_id: str) -> str:
    return os.path.join(JOBS_FOLDER, f"{job_id}.json")


def _write_job(job_id: str, data: dict):
    with open(_job_status_path(job_id), "w", encoding="utf-8") as f:
        json.dump(data, f)


def _read_job(job_id: str) -> Optional[Dict]:
    path = _job_status_path(job_id)
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _process_job(job_id: str, target_path: str, reference_path: str):
    # Update status -> processing
    _write_job(job_id, {"id": job_id, "status": "processing", "progress": 0})
    try:
        unique_id = str(uuid.uuid4())
        output_filename = f"mastered_{unique_id}.wav"
        output_path = os.path.join(app.config["RESULTS_FOLDER"], output_filename)

        mg.log(print)
        # run matchering; this is blocking and can take time
        mg.process(
            target=target_path,
            reference=reference_path,
            results=[mg.pcm24(output_path)],
        )

        _write_job(
            job_id,
            {
                "id": job_id,
                "status": "completed",
                "progress": 100,
                "outputFile": output_filename,
                "downloadUrl": f"/api/download/{output_filename}",
            },
        )
    except Exception as e:
        _write_job(job_id, {"id": job_id, "status": "failed", "error": str(e)})


@app.route("/api/start-mastering-job", methods=["POST"])
@require_api_key
def start_mastering_job():
    # Expect JSON with either: target_path (local uploads path) and reference_path
    data = request.get_json()
    if not data or "target_path" not in data:
        return jsonify({"error": "target_path required"}), 400

    target_path = data["target_path"]
    reference_path = data.get("reference_path")

    if not os.path.exists(target_path):
        return jsonify({"error": "target_path not found on server"}), 400
    if reference_path and not os.path.exists(reference_path):
        return jsonify({"error": "reference_path not found on server"}), 400

    job_id = str(uuid.uuid4())
    # initial job file with paths so external workers can pick it up
    _write_job(
        job_id,
        {
            "id": job_id,
            "status": "pending",
            "progress": 0,
            "target_path": target_path,
            "reference_path": reference_path,
        },
    )

    # start background thread
    thread = threading.Thread(
        target=_process_job, args=(job_id, target_path, reference_path), daemon=True
    )
    thread.start()

    return jsonify({"message": "Job accepted", "jobId": job_id}), 202


@app.route("/api/jobs/<job_id>", methods=["GET"])
@require_api_key
def get_job_status(job_id):
    job = _read_job(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)


# --- Download Endpoint ---
@app.route("/api/download/<filename>")
def download_file(filename):
    return send_from_directory(
        app.config["RESULTS_FOLDER"], filename, as_attachment=True
    )


if __name__ == "__main__":
    # Default dev port is 3001 to match frontend dev config; set MATCHERING_PORT env to override
    port = int(os.environ.get("MATCHERING_PORT", 3001))
    # Bind to 0.0.0.0 so it is reachable from other containers/dev tools
    app.run(host="0.0.0.0", debug=True, port=port)
