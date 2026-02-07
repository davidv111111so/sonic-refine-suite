import { supabase } from '@/integrations/supabase/client';
import { MasteringSettingsData } from '@/components/ai-mastering/MasteringSettings';

export class MasteringService {
  // Dynamic backend URL based on environment
  // Dynamic backend URL based on environment
  // We prioritize local proxy (empty string) when running on localhost to avoid CORS and production limits
  private backendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
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
    const MAX_SIZE_MB = 200;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

    if (file.size > MAX_SIZE_BYTES) {
      console.error(`❌ File too large: ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB). Max allowed: ${MAX_SIZE_MB}MB`);
      throw new Error(`File "${file.name}" exceeds the ${MAX_SIZE_MB}MB limit. Please upload a smaller file.`);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && localStorage.getItem("dev_bypass") !== "true") {
        throw new Error('Authenticated user required for upload');
      }

      const userId = user?.id || 'dev-user';
      const fileExt = file.name.split('.').pop();
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
        if (error.message.includes('bucket not found')) {
          console.error("❌ Bucket 'audio-processing' not found. Please create it in Supabase dashboard.");
          throw new Error("Storage bucket 'audio-processing' does not exist. Contact administrator.");
        }
        if (error.message.includes('exceeded the maximum allowed size')) {
          console.error(`❌ Storage limit error. Bucket limit may be too low. Required: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
          throw new Error(`The file is too large for the storage provider. Max limit is ${MAX_SIZE_MB}MB.`);
        }
        throw error;
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
   * Complete mastering flow: Send files directly to Python backend
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

      if (onProgress) onProgress('Uploading target file to secure storage...', 10);
      const targetUrl = await this.uploadToProcessingBucket(targetFile, 'mastering/target');

      if (onProgress) onProgress('Uploading reference file to secure storage...', 25);
      const referenceUrl = await this.uploadToProcessingBucket(referenceFile, 'mastering/reference');

      if (onProgress) onProgress('Processing with AI Backend...', 40);

      // Send URLs to Python backend
      const response = await fetch(`${this.backendUrl}/api/master-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target_url: targetUrl,
          reference_url: referenceUrl,
          settings: settings
        })
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

      console.log(`🔍 Analyzing audio: ${file.name} (Directing via storage)`);
      const fileUrl = await this.uploadToProcessingBucket(file, 'analysis');

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
        console.error(`❌ Analysis failed (${response.status}): ${errorText}`);
        throw new Error(`Analysis failed: ${response.statusText} - ${errorText}`);
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
   * Stem Separation: Send file directly to Python backend
   */
  async separateAudio(
    file: File,
    stemCount: string = '4',
    onProgress?: (stage: string, percent: number) => void
  ): Promise<{ task_id: string }> {
    try {
      console.log('🚀 Starting stem separation via storage...');
      const token = await this.getAuthToken();

      if (onProgress) onProgress('Uploading file for separation...', 5);
      const fileUrl = await this.uploadToProcessingBucket(file, 'stems');

      if (onProgress) onProgress('Queueing separation task...', 20);

      const response = await fetch(`${this.backendUrl}/api/separate-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          file_url: fileUrl,
          stem_count: stemCount,
          library: 'demucs',
          model_name: stemCount === '6' ? 'htdemucs_6s' : 'htdemucs'
        }),
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
   */
  async getTaskStatus(taskId: string): Promise<any> {
    try {
      const response = await fetch(`${this.backendUrl}/api/task-status/${taskId}`);
      if (!response.ok) {
        throw new Error(`Failed to get status (${response.status})`);
      }
      return await response.json();
    } catch (error) {
      console.error("❌ getTaskStatus error:", error);
      throw error;
    }
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
