import os
import json
import base64
from flask import Flask, request
from google.cloud import storage, firestore
import matchering as mg
import uuid

# --- CONFIGURACIÓN ---
app = Flask(__name__)
db = firestore.Client()
storage_client = storage.Client()
BUCKET_NAME = "spectrum-mastering-files-857351913435"

# Local polling worker (optional) - scans examples/jobs/ for pending jobs when run directly
import time
from pathlib import Path

JOBS_FOLDER = "examples/jobs"


def _job_file_path(job_id: str) -> Path:
    return Path(JOBS_FOLDER) / f"{job_id}.json"


def _read_local_job(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def _write_local_job(path: Path, data: dict):
    path.write_text(json.dumps(data), encoding="utf-8")


def process_local_jobs_loop(poll_interval: int = 5):
    Path(JOBS_FOLDER).mkdir(parents=True, exist_ok=True)
    print(f"Worker: polling {JOBS_FOLDER} for jobs every {poll_interval}s")
    while True:
        for p in Path(JOBS_FOLDER).glob("*.json"):
            job = _read_local_job(p)
            if not job or job.get("status") != "pending":
                continue

            job_id = job["id"]
            target = job.get("target_path")
            reference = job.get("reference_path")
            print(f"Worker: processing job {job_id}")
            try:
                unique_id = str(uuid.uuid4())
                output_filename = f"mastered_{unique_id}.wav"
                output_path = os.path.join("results", output_filename)
                mg.log(print)
                mg.process(
                    target=target, reference=reference, results=[mg.pcm24(output_path)]
                )
                job.update(
                    {
                        "status": "completed",
                        "outputFile": output_filename,
                        "downloadUrl": f"/api/download/{output_filename}",
                    }
                )
            except Exception as e:
                job.update({"status": "failed", "error": str(e)})
            _write_local_job(p, job)
        time.sleep(poll_interval)


if __name__ == "__main__":
    # Allow running the local polling worker directly
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--poll-interval", type=int, default=5, help="Polling interval in seconds"
    )
    args = parser.parse_args()
    try:
        process_local_jobs_loop(poll_interval=args.poll_interval)
    except KeyboardInterrupt:
        print("Worker stopped by user")


# --- RUTA PRINCIPAL (Solo escucha al buzón) ---
@app.route("/", methods=["POST"])
def process_job_handler():
    envelope = request.get_json()
    if not envelope or "message" not in envelope:
        return "Bad Request: invalid Pub/Sub message format", 400

    # Desempacamos el mensaje del buzón
    pubsub_message = envelope["message"]
    data_str = base64.b64decode(pubsub_message["data"]).decode("utf-8")
    data = json.loads(data_str)

    job_id = data["jobId"]
    target_gcs_path = data["targetGcsPath"]
    reference_gcs_path = data["referenceGcsPath"]

    # Aquí va la misma lógica de "cocina" de antes
    job_ref = db.collection("masteringJobs").document(job_id)
    job_ref.set(
        {"status": "processing", "createdAt": firestore.SERVER_TIMESTAMP}, merge=True
    )

    # ... (Pega aquí tu lógica de `run_mastering_in_background` completa)
    # ... (El bloque try/except/finally para descargar, procesar y subir)

    return "OK", 204  # Le decimos al buzón "Paquete recibido y procesado"
