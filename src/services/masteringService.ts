import { supabase } from '@/integrations/supabase/client';
import { MasteringSettingsData } from '@/components/ai-mastering/MasteringSettings';

export class MasteringService {
  // Use Supabase Edge Function proxy to bypass CORS
  private useProxy = true;
  private directBackendUrl = "https://sonic-refine-backend-azkp62xtaq-uc.a.run.app";
  
  private getProxyUrl(endpoint: string): string {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://lyymcpiujrnlwsbyrseh.supabase.co";
    return `${supabaseUrl}/functions/v1/audio-proxy?endpoint=${encodeURIComponent(endpoint)}`;
  }

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

      // Use proxy or direct URL
      const url = this.useProxy 
        ? this.getProxyUrl('/api/master-audio')
        : `${this.directBackendUrl}/api/master-audio`;
      
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

      // Use proxy or direct URL
      const url = this.useProxy 
        ? this.getProxyUrl('/api/analyze-audio')
        : `${this.directBackendUrl}/api/analyze-audio`;
      
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
}

// Export singleton instance
export const masteringService = new MasteringService();
