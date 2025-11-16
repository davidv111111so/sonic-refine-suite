// Backend Integration Interface for Future Deployment

export interface BackendConfig {
  baseUrl: string;
  apiKey?: string;
  timeout: number;
}

export interface ProcessingJobMetadata {
  [key: string]: unknown;
}

export interface ProcessingJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  stage: string;
  inputFile: string;
  outputFile?: string;
  metadata?: ProcessingJobMetadata;
  error?: string;
}

export class BackendAudioService {
  private config: BackendConfig;
  private socket: WebSocket | null = null; // WebSocket connection

  constructor(config: BackendConfig) {
    this.config = config;
  }

  // File upload to backend
  async uploadFile(file: File): Promise<{ fileId: string; uploadUrl: string }> {
    const formData = new FormData();
    formData.append("audio", file);
    formData.append(
      "metadata",
      JSON.stringify({
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
      })
    );

    const response = await fetch(`${this.config.baseUrl}/api/upload`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Start backend processing
  async enhanceAudio(
    fileId: string,
    settings: Record<string, unknown>
  ): Promise<{ jobId: string }> {
    const response = await fetch(`${this.config.baseUrl}/api/enhance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        fileId,
        settings: {
          ...settings,
          // Backend-specific settings
          algorithm: "professional",
          targetQuality: "studio",
          processing: {
            noiseReduction: settings.noiseReduction,
            upsampling: true,
            targetSampleRate: 96000,
            bitDepth: 24,
            compression: settings.compression,
            normalization: settings.normalization,
            eq: settings.enableEQ ? settings.eqBands : null,
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Enhancement failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Start queued mastering job using server-side queue
  async startMasteringJob(
    targetPath: string,
    referencePath?: string
  ): Promise<{ jobId: string }> {
    const response = await fetch(
      `${this.config.baseUrl}/api/start-mastering-job`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders(),
        },
        body: JSON.stringify({
          target_path: targetPath,
          reference_path: referencePath,
        }),
      }
    );

    if (!response.ok)
      throw new Error(`startMasteringJob failed: ${response.statusText}`);
    return await response.json();
  }

  // Get processing status
  async getJobStatus(jobId: string): Promise<ProcessingJob> {
    const response = await fetch(`${this.config.baseUrl}/api/jobs/${jobId}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return await response.json();
  }

  // Download enhanced file
  async downloadEnhanced(jobId: string): Promise<Blob> {
    const response = await fetch(
      `${this.config.baseUrl}/api/download/${jobId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return await response.blob();
  }

  // Real-time progress updates via WebSocket
  connectProgressUpdates(onProgress: (update: ProcessingJob) => void): void {
    // In production, this would connect to Socket.io
    if (typeof window !== "undefined" && "WebSocket" in window) {
      try {
        const wsUrl = this.config.baseUrl.replace("http", "ws") + "/progress";
        this.socket = new WebSocket(wsUrl);

        this.socket.onmessage = (event) => {
          try {
            const update = JSON.parse(event.data) as ProcessingJob;
            onProgress(update);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.socket.onerror = (error) => {
          console.error("WebSocket error:", error);
        };

        this.socket.onclose = () => {
          this.socket = null;
        };
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
        this.socket = null;
      }
    }
  }

  // Batch processing
  async processBatch(
    fileIds: string[],
    settings: Record<string, unknown>
  ): Promise<{ batchId: string; jobs: string[] }> {
    const response = await fetch(`${this.config.baseUrl}/api/batch-enhance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify({
        fileIds,
        settings,
        batchOptions: {
          priority: "normal",
          notifyOnComplete: true,
        },
      }),
    });

    return await response.json();
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
    }
  }
}

// Configuration for different deployment environments
export const getBackendConfig = (): BackendConfig => {
  const environment = process.env.NODE_ENV || "development";

  switch (environment) {
    case "production":
      return {
        baseUrl:
          process.env.REACT_APP_API_URL ||
          "https://mastering-backend-857351913435.us-central1.run.app",
        apiKey: process.env.REACT_APP_API_KEY,
        timeout: 300000, // 5 minutes for large files
      };

    case "staging":
      return {
        baseUrl:
          process.env.REACT_APP_API_URL || "https://staging-api.yourdomain.com",
        apiKey: process.env.REACT_APP_API_KEY,
        timeout: 180000, // 3 minutes
      };

    default:
      return {
        baseUrl: "http://localhost:3001",
        timeout: 120000, // 2 minutes
      };
  }
};

// Feature detection for backend availability
export const isBackendAvailable = async (): Promise<boolean> => {
  try {
    const config = getBackendConfig();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${config.baseUrl}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};
