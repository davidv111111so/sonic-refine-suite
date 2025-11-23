import { supabase } from '@/integrations/supabase/client';
import { MasteringSettingsData } from '@/components/ai-mastering/MasteringSettings';

export class MasteringService {
  // Dynamic backend URL based on environment
  private backendUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? "http://localhost:8001"
    : "https://sonic-refine-backend-azkp62xtaq-uc.a.run.app";

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
    const token = await this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.backendUrl}/api/analyze-audio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Export singleton instance
export const masteringService = new MasteringService();
