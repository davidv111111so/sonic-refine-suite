import { supabase } from '@/integrations/supabase/client';
import { MasteringSettingsData } from '@/components/ai-mastering/MasteringSettings';

console.log("🚨 MASTERING SERVICE LOADED - v2.0 - PROXY DISABLED 🚨");

export class MasteringService {
  // DISABLED: Supabase proxy has 10MB limit, use direct backend instead
  private useProxy = false;
  private directBackendUrl = "https://sonic-refine-backend-azkp62xtaq-uc.a.run.app";
  private localBackendUrl = "http://localhost:8001";
  private isDev = window.location.hostname === 'localhost';

  constructor() {
    console.log("🔧 MasteringService initialized:", {
      useProxy: this.useProxy,
      isDev: this.isDev,
      hostname: window.location.hostname,
      willUse: this.isDev ? this.localBackendUrl : this.directBackendUrl
    });
  }

  private getProxyUrl(endpoint: string): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://nhulnikqfphofqpnmdba.supabase.co";
    return `${supabaseUrl}/functions/v1/audio-proxy?endpoint=${encodeURIComponent(endpoint)}`;
  }

  /**
   * Get auth token from Supabase session
   */
  private async getAuthToken(): Promise<string> {
    // For localhost development, always use dev bypass token
    if (this.isDev) {
      console.log("🔧 Using dev bypass token for localhost");
      return "dev-bypass-token";
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
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

      // Use proxy, local backend (dev), or direct URL (production)
      let url: string;
      if (this.useProxy) {
        url = this.getProxyUrl('/api/master-audio');
      } else if (this.isDev) {
        url = `${this.localBackendUrl}/api/master-audio`;
      } else {
        url = `${this.directBackendUrl}/api/master-audio`;
      }

      console.log('📤 Sending to:', url);

      const response = await fetch(url, {
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

      // Use proxy, local backend (dev), or direct URL (production)
      let url: string;
      if (this.useProxy) {
        url = this.getProxyUrl('/api/analyze-audio');
      } else if (this.isDev) {
        url = `${this.localBackendUrl}/api/analyze-audio`;
      } else {
        url = `${this.directBackendUrl}/api/analyze-audio`;
      }

      console.log('📤 Sending to:', url);

      const response = await fetch(url, {
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

      let url: string;
      if (this.useProxy) {
        url = this.getProxyUrl('/api/separate-audio');
      } else if (this.isDev) {
        url = `${this.localBackendUrl}/api/separate-audio`;
      } else {
        url = `${this.directBackendUrl}/api/separate-audio`;
      }

      console.log('📤 Sending to:', url);

      const response = await fetch(url, {
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
      let url: string;
      if (this.useProxy) {
        url = this.getProxyUrl(`/api/task-status/${taskId}`);
      } else if (this.isDev) {
        url = `${this.localBackendUrl}/api/task-status/${taskId}`;
      } else {
        url = `${this.directBackendUrl}/api/task-status/${taskId}`;
      }

      const response = await fetch(url);
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
      let url: string;
      if (this.useProxy) {
        url = this.getProxyUrl(`/api/task-result/${taskId}`);
      } else if (this.isDev) {
        url = `${this.localBackendUrl}/api/task-result/${taskId}`;
      } else {
        url = `${this.directBackendUrl}/api/task-result/${taskId}`;
      }

      const response = await fetch(url);
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
