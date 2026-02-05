import { supabase } from '@/integrations/supabase/client';
import { MasteringSettingsData } from '@/components/ai-mastering/MasteringSettings';

export class MasteringService {
  // Dynamic backend URL based on environment
  // Dynamic backend URL based on environment
  // We prioritize local proxy (empty string) when running on localhost to avoid CORS and production limits
  private backendUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? ""
    : (import.meta.env.VITE_PYTHON_BACKEND_URL || "https://sonic-refine-backend-azkp62xtaq-uc.a.run.app");

  /**
   * Get auth token from Supabase session
   */
  private async getAuthToken(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      // For dev bypass mode, return a dummy token
      if (localStorage.getItem("dev_bypass") === "true") {
        return "dev-bypass-token";
      }
      throw new Error('No authentication token available. Please log in.');
    }

    return session.access_token;
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

      // Create FormData with both files
      const formData = new FormData();
      formData.append('target', targetFile);
      formData.append('reference', referenceFile);

      // Add settings if provided
      if (settings) {
        formData.append('settings', JSON.stringify(settings));
      }

      if (onProgress) onProgress('Uploading files to backend...', 10);

      // Send to Python backend
      const response = await fetch(`${this.backendUrl}/api/master-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
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
      const formData = new FormData();
      formData.append('file', file);

      console.log(`🔍 Analyzing audio: ${file.name} (${file.type}, ${file.size} bytes)`);

      const response = await fetch(`${this.backendUrl}/api/analyze-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
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
      console.log('🚀 Starting stem separation...');
      const token = await this.getAuthToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('stem_count', stemCount);
      formData.append('library', 'demucs');
      formData.append('model_name', stemCount === '6' ? 'htdemucs_6s' : 'htdemucs');

      if (onProgress) onProgress('Uploading file for separation...', 5);

      const response = await fetch(`${this.backendUrl}/api/separate-audio`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
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
