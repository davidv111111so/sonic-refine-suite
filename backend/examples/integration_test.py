"""Small integration test: upload a file, start a job, poll for completion.

Usage:
    python integration_test.py --file ../some.wav --api-key dev-secret-key --base-url http://localhost:3001

This script is intended for development only.
"""

import argparse
import time
import requests


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--file", required=True)
    p.add_argument("--api-key", default="dev-secret-key")
    p.add_argument("--base-url", default="http://localhost:3001")
    args = p.parse_args()

    headers = {"X-API-Key": args.api_key}

    # Upload
    files = {"target": open(args.file, "rb")}
    r = requests.post(f"{args.base_url}/api/upload", files=files, headers=headers)
    r.raise_for_status()
    info = r.json()
    print("Uploaded:", info)

    # Start job
    payload = {"target_path": info["path"]}
    r = requests.post(
        f"{args.base_url}/api/start-mastering-job", json=payload, headers=headers
    )
    r.raise_for_status()
    job = r.json()
    print("Job started:", job)

    jobId = job["jobId"]
    # Poll
    while True:
        time.sleep(2)
        r = requests.get(f"{args.base_url}/api/jobs/{jobId}", headers=headers)
        if r.status_code == 404:
            print("Job not found yet")
            continue
        r.raise_for_status()
        status = r.json()
        print("Status:", status)
        if status.get("status") in ("completed", "failed"):
            break

    print("Done")


if __name__ == "__main__":
    main()
