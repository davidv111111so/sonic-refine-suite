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
    : (import.meta.env.VITE_PYTHON_BACKEND_URL || "https://mastering-backend-azkp62xtaq-uc.a.run.app");

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
   * Upload file to Supabase Storage and get a public/signed URL
   */
  private async uploadToProcessingBucket(file: File, folder: string = 'uploads'): Promise<string> {
    const MAX_SIZE_MB = 1024; // Increased to 1GB for professional tracks
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file.size > MAX_SIZE_BYTES) {
      console.error(`❌ File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB). Max allowed: ${MAX_SIZE_MB}MB`);
      throw new Error(`File "${file.name}" exceeds the ${MAX_SIZE_MB}MB limit. Please provide a smaller file.`);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && localStorage.getItem("dev_bypass") !== "true") {
        throw new Error('Authenticated user required for upload');
      }

      const userId = user?.id || 'dev-user';
      const originalName = file.name || 'audio-file';
      const fileExt = originalName.includes('.') ? originalName.split('.').pop() : 'wav';
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${folder}/${fileName}`;

      console.log(`☁️ Uploading ${file.name} to storage: ${filePath}`);

      const { data, error } = await supabase.storage
        .from('audio-processing')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error details:', {
          message: error.message,
          name: (error as any).name,
          statusCode: (error as any).statusCode,
          error: error
        });

        if (error.message.includes('bucket not found') || error.message.includes('Bucket not found')) {
          console.error("❌ Bucket 'audio-processing' not found. Please create it in Supabase dashboard.");
          throw new Error("Storage bucket 'audio-processing' does not exist. Please contact administrator to create it in Supabase.");
        }
        if (error.message.includes('exceeded the maximum allowed size')) {
          console.error(`❌ Storage limit error. Bucket limit may be too low. Required: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
          throw new Error(`Upload rejected: File exceeds the maximum allowed size (1GB) for the 'audio-processing' storage bucket.`);
        }
        if (error.message.includes('permission denied') || error.message.includes('Unauthorized') || error.message.includes('row-level security')) {
          console.error("❌ Storage permission error. RLS policies may not be configured correctly.");
          throw new Error("Storage upload permission denied. Please ensure you're logged in or contact administrator.");
        }
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-processing')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('❌ Storage upload error:', error);
      throw error;
    }
  }

  /**
   * Complete mastering flow: Send files directly to Python backend via FormData
   * (bypasses Supabase Storage to avoid bucket size limits on large files)
   */
  async masterAudio(
    targetFile: File,
    referenceFile: File,
    settings?: MasteringSettingsData,
    onProgress?: (stage: string, percent: number) => void
  ): Promise<{ blob: Blob; analysis: any | null }> {
    try {
      console.log('🚀 Starting real Matchering mastering...');

      const authToken = await this.getAuthToken();

      if (onProgress) onProgress('Uploading files to AI backend...', 10);

      // Send files directly to backend via multipart/form-data
      const formData = new FormData();
      formData.append('target', targetFile, targetFile.name);
      formData.append('reference', referenceFile, referenceFile.name);
      if (settings) {
        formData.append('settings', JSON.stringify(settings));
      }

      console.log(`📤 Sending target (${(targetFile.size / 1024 / 1024).toFixed(1)}MB) + reference (${(referenceFile.size / 1024 / 1024).toFixed(1)}MB) directly to backend...`);

      if (onProgress) onProgress('Processing with AI Backend...', 30);

      const response = await fetch(`${this.backendUrl}/api/master-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
          // Do NOT set Content-Type — browser will set multipart boundary automatically
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error (${response.status}): ${errorText}`);
      }

      if (onProgress) onProgress('Processing with Matchering AI...', 50);

      // Parse LUFS analysis from response header
      let analysis = null;
      const analysisHeader = response.headers.get('X-Audio-Analysis');
      if (analysisHeader) {
        try {
          analysis = JSON.parse(analysisHeader);
          console.log('📊 LUFS Analysis:', analysis);
        } catch (e) {
          console.warn('Failed to parse audio analysis:', e);
        }
      }

      // Get the mastered audio blob
      const blob = await response.blob();

      if (onProgress) onProgress('Complete!', 100);

      console.log('✅ Mastering complete!');
      return { blob, analysis };
    } catch (error) {
      console.error('❌ Mastering service error:', error);
      throw error;
    }
  }

  async analyzeAudio(file: File): Promise<any> {
    try {
      const token = await this.getAuthToken();

      console.log(`🔍 Analyzing audio: ${file.name} (direct upload)`);

      // Send file directly to backend via multipart/form-data
      const formData = new FormData();
      formData.append('file', file, file.name);

      const response = await fetch(`${this.backendUrl}/api/analyze-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do NOT set Content-Type — browser will set multipart boundary automatically
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Analysis failed | Status: ${response.status} | URL: ${this.backendUrl}/api/analyze-audio`);
        console.error(`❌ Error Details: ${errorText}`);
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
   * Stem Separation: Send file directly to Python backend via FormData
   * (bypasses Supabase Storage to avoid bucket size limits)
   */
  async separateAudio(
    file: File,
    stemCount: string = '4',
    onProgress?: (stage: string, percent: number) => void
  ): Promise<{ task_id: string }> {
    try {
      console.log('🚀 Starting stem separation (direct upload)...');
      const token = await this.getAuthToken();

      if (onProgress) onProgress('Uploading file for separation...', 5);

      const modelName = stemCount === '6' ? 'htdemucs_6s' : 'htdemucs';

      // Send file directly to the backend via multipart/form-data
      const formData = new FormData();
      formData.append('file', file, file.name);
      formData.append('stem_count', stemCount);
      formData.append('library', 'demucs');
      formData.append('model_name', modelName);

      console.log(`📤 Sending ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) directly to backend...`);

      if (onProgress) onProgress('Queueing separation task...', 15);

      const response = await fetch(`${this.backendUrl}/api/separate-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Do NOT set Content-Type — browser will set multipart boundary automatically
        },
        body: formData,
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
        throw new Error(`Failed to get result (${response.status})`);
      }
      return await response.blob();
    } catch (error) {
      console.error("❌ getTaskResult error:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const masteringService = new MasteringService();
