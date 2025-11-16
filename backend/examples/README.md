# Matchering example backend (examples)

This folder contains a minimal Flask example showing how to run Matchering as an API for the frontend.

Quick start (development)

1. Create and activate a Python virtual environment, then install dependencies:

```powershell
cd "c:\Users\david\SPECTRUM APP\backend"
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. Set required env vars (development defaults used if not set):

```powershell
# set a dev API key (do not use in production)
$env:MATCHERING_API_KEY = 'dev-secret-key'
# optional: override port
$env:MATCHERING_PORT = '3001'
# optional: max upload (bytes) - default 100 MB
$env:MATCHERING_MAX_UPLOAD = 100000000
```

3. Run the example app:

```powershell
python examples\app.py
```

4. Health check:

Open http://localhost:3001/health

Queued job flow (local)

- To avoid request timeouts for long processing, use the queued job endpoints:
  1. Upload files via the normal upload flow (they will be stored in `uploads/`).
  2. Call POST /api/start-mastering-job with JSON: `{ "target_path": "uploads/<file>", "reference_path": "uploads/<file>" }`.
  3. The endpoint returns a `jobId` immediately. Poll `/api/jobs/<jobId>` for status.
  4. When status is `completed` you will receive `downloadUrl` to fetch the result.

Local worker and integration test

- To run a local polling worker (scans `examples/jobs/`), run:

```powershell
cd "c:\Users\david\SPECTRUM APP\backend"
. .venv\Scripts\Activate.ps1
python worker.py --poll-interval 5
```

- To run a small integration test (uploads a file, starts job, polls):

```powershell
python examples\integration_test.py --file "C:\path\to\file.wav" --api-key dev-secret-key --base-url http://localhost:3001
```

Frontend integration notes (React + Vite)

- Frontend dev expects backend at http://localhost:3001 by default.
- Ensure the frontend uses the Supabase edge function (if used) or calls the backend directly.

Security and production notes

- The example uses a simple API key for development only. For production, authenticate requests via server-side tokens and protect endpoints.
- Use cloud storage for uploads and results in production, and run workers as separate instances.
