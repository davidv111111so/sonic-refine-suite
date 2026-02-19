import { supabase } from '@/integrations/supabase/client';
import { MasteringSettingsData } from '@/components/ai-mastering/MasteringSettings';

export class MasteringService {
  // Dynamic backend URL based on environment
  // Dynamic backend URL based on environment
  // We prioritize local proxy (empty string) when running on localhost to avoid CORS and production limits
  private backendUrl = (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname.includes('192.168.') ||
    window.location.hostname.includes('10.') ||
    window.location.hostname.includes('172.')
  )
    ? ""
    : (import.meta.env.VITE_PYTHON_BACKEND_URL || "https://mastering-backend-857351913435.us-central1.run.app");

  /**
   * Get auth token from Supabase session
   */
  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      if (localStorage.getItem("dev_bypass") === "true") {
        return "dev-bypass-token";
      }
      throw new Error('No authentication token available. Please log in.');
    }
    return session.access_token;
  }

  /**
   * Upload file to Backblaze B2 (if available) or fallback to Supabase Storage
   */
  private async uploadToProcessingBucket(file: File, folder: string = 'uploads'): Promise<string> {
    const MAX_SIZE_MB = 1024; // 1GB limit handled by B2 too
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file.size > MAX_SIZE_BYTES) {
      throw new Error(`File "${file.name}" exceeds the ${MAX_SIZE_MB}MB limit.`);
    }

    try {
      const authToken = await this.getAuthToken();

      // 1. Try to get B2 upload URL
      console.log(`☁️ Requesting B2 upload authorization for ${file.name}...`);
      const b2Resp = await fetch(`${this.backendUrl}/api/get-b2-upload-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fileName: `${folder}/${Math.random().toString(36).substring(2)}-${Date.now()}-${file.name}`,
          contentType: file.type || 'audio/wav'
        })
      });

      if (b2Resp.ok) {
        const b2Data = await b2Resp.json();
        console.log(`🚀 Using Backblaze B2 for upload: ${b2Data.fileName}`);

        // Upload to B2
        const formData = new FormData();
        // B2 doesn't use FormData for direct uploads via uploadUrl usually, it's a raw body
        // But for browser simplified flow, sometimes it's easier to proxy or use custom headers
        // Given B2 Service returns uploadUrl and authorizationToken:
        const uploadResponse = await fetch(b2Data.uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': b2Data.authorizationToken,
            'X-Bz-File-Name': encodeURIComponent(b2Data.fileName),
            'Content-Type': file.type || 'audio/wav',
            'X-Bz-Content-Sha1': 'do_not_verify' // or compute it if needed
          },
          body: file
        });

        if (uploadResponse.ok) {
          const result = await uploadResponse.json();
          // Construct the download URL
          // We can ask the backend for the URL or construct it if we know the bucket name
          // Since it's a private bucket, we return a B2-compatible path the backend can download
          console.log(`✅ B2 Upload complete: ${result.fileName}`);
          return `b2://${b2Data.fileName}`;
        } else {
          console.warn('⚠️ B2 Direct upload failed, falling back to Supabase', await uploadResponse.text());
        }
      } else {
        console.log('ℹ️ B2 not available or configured, using Supabase fallback');
      }

      // 2. Supabase Fallback
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'dev-user';
      const originalName = file.name || 'audio-file';
      const fileExt = originalName.includes('.') ? originalName.split('.').pop() : 'wav';
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from('audio-processing')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (error) throw new Error(`Supabase upload failed: ${error.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('audio-processing')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('❌ Upload error:', error);
      throw error;
    }
  }

  /**
   * Complete mastering flow: Upload to Storage -> Send URLs to Python backend
   */
  async masterAudio(
    targetFile: File,
    referenceFile: File,
    settings?: MasteringSettingsData,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<{ blob: Blob; analysis: any | null }> {
    try {
      console.log('🚀 Starting Mastering Flow...');
      const authToken = await this.getAuthToken();

      // 1. Upload files to Storage
      if (onProgress) onProgress('Uploading files to cloud storage...', 10);

      const targetUrl = await this.uploadToProcessingBucket(targetFile, 'mastering/target');
      const referenceUrl = await this.uploadToProcessingBucket(referenceFile, 'mastering/reference');

      console.log(`✅ Files uploaded. Target: ${targetUrl}, Ref: ${referenceUrl}`);

      // 2. Call Backend with URLs
      if (onProgress) onProgress('Processing with AI Backend...', 30);

      const payload: any = {
        target_url: targetUrl,
        reference_url: referenceUrl,
        settings: settings || {}
      };

      const response = await fetch(`${this.backendUrl}/api/master-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mastering failed (${response.status}): ${errorText}`);
      }

      const { task_id } = await response.json();
      console.log("✅ Mastering task started:", task_id);

      // 3. Poll for Completion
      let status = 'queued';
      let taskData = null;

      while (status === 'queued' || status === 'processing') {
        if (onProgress) {
          const progressMsg = status === 'queued' ? 'Queueing mastering task...' : 'AI Mastering in progress...';
          const progressPct = taskData?.progress ? 30 + (taskData.progress * 0.6) : 35;
          onProgress(progressMsg, progressPct);
        }

        await new Promise(resolve => setTimeout(resolve, 3000));
        taskData = await this.getTaskStatus(task_id);
        status = taskData.status;

        if (status === 'failed') {
          const detail = taskData.error_message || taskData.error || 'Unknown backend error';
          console.error('❌ Backend task failed:', detail);
          throw new Error(`Mastering failed: ${detail}`);
        }
      }

      // 4. Get Result Blob
      if (onProgress) onProgress('Finalizing results...', 95);
      const blob = await this.getTaskResult(task_id);

      if (onProgress) onProgress('Complete!', 100);
      return {
        blob,
        analysis: taskData.metadata || null
      };
    } catch (error) {
      console.error('❌ masterAudio error:', error);
      throw error;
    }
  }

  async analyzeAudio(file: File): Promise<any> {
    try {
      const token = await this.getAuthToken();

      console.log(`🔍 Analyzing audio: ${file.name} (via storage)`);

      // 1. Upload to Storage
      const fileUrl = await this.uploadToProcessingBucket(file, 'analysis');

      // 2. Call Backend
      const response = await fetch(`${this.backendUrl}/api/analyze-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file_url: fileUrl }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Analysis failed | Status: ${response.status}`);
        throw new Error(`Analysis failed: ${response.status} - ${errorText || 'Internal Server Error'}`);
      }

      const data = await response.json();
      console.log("✅ Analysis complete:", data);
      return data;
    } catch (error) {
      console.error("❌ analyzeAudio error:", error);
      throw error;
    }
  }

  /**
   * Stem Separation: Upload to Storage -> Send URL to Python backend
   */
  async separateAudio(
    file: File,
    stemCount: string = '4',
    onProgress?: (stage: string, percent: number) => void
  ): Promise<{ task_id: string }> {
    try {
      console.log('🚀 Starting stem separation (via storage)...');
      const token = await this.getAuthToken();

      if (onProgress) onProgress('Uploading file for separation...', 5);

      // 1. Upload to Storage
      const fileUrl = await this.uploadToProcessingBucket(file, 'stems');

      console.log(`✅ File uploaded: ${fileUrl}`);

      const modelName = stemCount === '6' ? 'htdemucs_6s' : 'htdemucs';

      // 2. Call Backend
      if (onProgress) onProgress('Queueing separation task...', 15);

      const payload = {
        file_url: fileUrl,
        stem_count: stemCount,
        library: 'demucs',
        model_name: modelName
      };

      const response = await fetch(`${this.backendUrl}/api/separate-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Separation failed (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Separation task started:", data.task_id);
      return data;
    } catch (error) {
      console.error("❌ separateAudio error:", error);
      throw error;
    }
  }

  /**
   * Get task status for long-running processes (Stems)
   * Includes built-in retry logic for transient connection failures
   */
  async getTaskStatus(taskId: string, retries: number = 3): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.backendUrl}/api/task-status/${taskId}`);
        if (!response.ok) {
          throw new Error(`Failed to get status (${response.status})`);
        }
        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`⚠️ getTaskStatus attempt ${attempt}/${retries} failed:`, error);

        if (attempt < retries) {
          // Exponential backoff: 500ms, 1000ms, 2000ms...
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)));
        }
      }
    }

    console.error("❌ getTaskStatus failed after all retries:", lastError);
    throw lastError;
  }

  /**
   * Get task result (ZIP or audio blob)
   */
  async getTaskResult(taskId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.backendUrl}/api/task-result/${taskId}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to get result (${response.status}): ${errorText}`);
      }

      // Check if the response is JSON (download URL) or binary (direct file)
      const contentType = response.headers.get('Content-Type') || '';
      if (contentType.includes('application/json')) {
        // Backend returned a download URL — fetch the file directly from storage
        const data = await response.json();
        if (data.download_url) {
          console.log('📥 Fetching result from download URL...');
          const fileResponse = await fetch(data.download_url);
          if (!fileResponse.ok) {
            throw new Error(`Failed to download from storage (${fileResponse.status})`);
          }
          return await fileResponse.blob();
        }
        throw new Error('No download URL in response');
      }

      // Direct binary response (local development)
      return await response.blob();
    } catch (error) {
      console.error("❌ getTaskResult error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const masteringService = new MasteringService();
