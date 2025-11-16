import React, { useState, useRef, useEffect } from "react";
import { getBackendConfig } from "../services/backendIntegration";

type JobStatus = {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number;
  downloadUrl?: string;
  error?: string;
};

export default function MasteringFlow() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  const config = getBackendConfig();

  function getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if ((config as any).apiKey)
      headers["Authorization"] = `Bearer ${(config as any).apiKey}`;
    return headers;
  }

  async function handleUpload() {
    if (!file) return setError("No file selected");
    setError(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("target", file);

      const res = await fetch(`${config.baseUrl}/api/upload`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: fd,
      });

      if (!res.ok)
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      const data = await res.json();

      // start job
      const startRes = await fetch(
        `${config.baseUrl}/api/start-mastering-job`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({ target_path: data.path }),
        },
      );

      if (!startRes.ok)
        throw new Error(
          `Start job failed: ${startRes.status} ${startRes.statusText}`,
        );
      const startJson = await startRes.json();
      setJobId(startJson.jobId);
      setJobStatus({ id: startJson.jobId, status: "pending", progress: 0 });
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${config.baseUrl}/api/jobs/${jobId}`, {
          headers: getAuthHeaders(),
        });
        if (res.status === 404) return; // job not yet visible
        if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
        const json = await res.json();
        setJobStatus(json);
        if (json.status === "completed" || json.status === "failed") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
      } catch (err: any) {
        setError(err?.message || String(err));
        if (pollRef.current) window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };

    // start polling every 1500ms
    poll();
    pollRef.current = window.setInterval(poll, 1500);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
  }, [jobId]);

  return (
    <div
      style={{
        maxWidth: 680,
        margin: "12px auto",
        padding: 12,
        border: "1px solid #eee",
        borderRadius: 8,
      }}
    >
      <h3>AI Mastering (Upload → Job → Poll)</h3>
      <p style={{ marginTop: 0, color: "#666" }}>Backend: {config.baseUrl}</p>

      <input
        type="file"
        accept="audio/*"
        onChange={(e) =>
          setFile(
            e.target.files && e.target.files[0] ? e.target.files[0] : null,
          )
        }
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={handleUpload} disabled={uploading || !file}>
          {uploading ? "Uploading…" : "Upload & Start Job"}
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "crimson" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {jobStatus && (
        <div style={{ marginTop: 12 }}>
          <div>
            <strong>Job:</strong> {jobStatus.id}
          </div>
          <div>
            <strong>Status:</strong> {jobStatus.status}
          </div>
          {typeof jobStatus.progress === "number" && (
            <div>
              <strong>Progress:</strong> {jobStatus.progress}%
            </div>
          )}
          {jobStatus.status === "completed" && jobStatus.downloadUrl && (
            <div style={{ marginTop: 8 }}>
              <a
                href={`${config.baseUrl}${jobStatus.downloadUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                Download mastered file
              </a>
            </div>
          )}
          {jobStatus.status === "failed" && jobStatus.error && (
            <div style={{ marginTop: 8, color: "crimson" }}>
              {jobStatus.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
