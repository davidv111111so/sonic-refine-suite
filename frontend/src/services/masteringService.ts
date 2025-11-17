import { MasteringSettingsData } from '@/components/ai-mastering/MasteringSettings';

interface UploadResult {
  gcsPath: string;
  signedUrl: string;
}

interface JobResult {
  jobId: string;
}

interface JobStatus {
  status: 'queued' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  error?: string;
}

export class MasteringService {
  private backendUrl: string;

  constructor() {
    // Use environment variable or fallback to Cloud Run URL
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 
                     'https://mastering-backend-857351913435.us-central1.run.app';
  }

  /**
   * Get auth token from Supabase session
   */
  private async getAuthToken(): Promise<string> {
    // Get token from Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No authentication token available. Please log in.');
    }
    
    return session.access_token;
  }

  /**
   * Step 1: Upload file to Google Cloud Storage
   */
  async uploadFileToGCS(
    file: File, 
    onProgress?: (percent: number) => void
  ): Promise<UploadResult> {
    const authToken = await this.getAuthToken();

    // 1. Get signed upload URL from backend
    const urlResponse = await fetch(`${this.backendUrl}/api/generate-upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || 'audio/wav',
        fileSize: file.size
      })
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.text();
      throw new Error(`Failed to get upload URL: ${error}`);
    }

    const { signedUrl, gcsFileName } = await urlResponse.json();

    // 2. Upload file directly to GCS using signed URL
    const uploadResponse = await fetch(signedUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'audio/wav',
      },
      body: file
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
    }

    if (onProgress) {
      onProgress(100);
    }

    return {
      gcsPath: gcsFileName,
      signedUrl
    };
  }

  /**
   * Step 2: Start mastering job
   */
  async startMasteringJob(
    targetGcsPath: string,
    referenceGcsPath: string,
    settings?: MasteringSettingsData
  ): Promise<JobResult> {
    const authToken = await this.getAuthToken();

    const response = await fetch(`${this.backendUrl}/api/start-mastering-job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        targetGcsPath,
        referenceGcsPath,
        settings: settings || {}
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to start mastering job: ${error}`);
    }

    const result = await response.json();
    return { jobId: result.jobId };
  }

  /**
   * Step 3: Poll job status until complete
   */
  async pollJobStatus(
    jobId: string,
    onProgress?: (status: string, progress: number) => void
  ): Promise<string> {
    const authToken = await this.getAuthToken();
    const maxAttempts = 120; // 10 minutes max (5 second intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      const response = await fetch(`${this.backendUrl}/api/get-job-status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get job status: ${response.statusText}`);
      }

      const status: JobStatus = await response.json();

      if (status.status === 'completed' && status.downloadUrl) {
        if (onProgress) {
          onProgress('completed', 100);
        }
        return status.downloadUrl;
      }

      if (status.status === 'failed') {
        throw new Error(status.error || 'Mastering job failed');
      }

      // Update progress based on status
      if (onProgress) {
        const progress = status.status === 'processing' ? 50 : 30;
        onProgress(status.status, progress);
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Mastering job timed out');
  }

  /**
   * Download file from URL
   */
  private async downloadFile(url: string): Promise<Blob> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download result: ${response.statusText}`);
    }
    return await response.blob();
  }

  /**
   * Complete mastering flow: Upload -> Process -> Download
   */
  async masterAudio(
    targetFile: File,
    referenceFile: File,
    settings?: MasteringSettingsData,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<Blob> {
    try {
      // Stage 1: Upload target file (0-20%)
      if (onProgress) onProgress('Uploading target file...', 0);
      const targetUpload = await this.uploadFileToGCS(targetFile, (p) => {
        if (onProgress) onProgress('Uploading target file...', p * 0.2);
      });

      // Stage 2: Upload reference file (20-40%)
      if (onProgress) onProgress('Uploading reference file...', 20);
      const referenceUpload = await this.uploadFileToGCS(referenceFile, (p) => {
        if (onProgress) onProgress('Uploading reference file...', 20 + p * 0.2);
      });

      // Stage 3: Start mastering job (40%)
      if (onProgress) onProgress('Starting mastering process...', 40);
      const { jobId } = await this.startMasteringJob(
        targetUpload.gcsPath,
        referenceUpload.gcsPath,
        settings
      );

      // Stage 4: Poll job status (40-80%)
      if (onProgress) onProgress('Processing with Matchering AI...', 45);
      const downloadUrl = await this.pollJobStatus(jobId, (status, progress) => {
        if (onProgress) {
          const statusText = status === 'processing' 
            ? 'Mastering in progress...' 
            : 'Waiting for processing...';
          onProgress(statusText, 40 + progress * 0.4);
        }
      });

      // Stage 5: Download result (80-100%)
      if (onProgress) onProgress('Downloading mastered file...', 80);
      const resultBlob = await this.downloadFile(downloadUrl);
      if (onProgress) onProgress('Complete!', 100);

      return resultBlob;
    } catch (error) {
      console.error('Mastering service error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const masteringService = new MasteringService();

