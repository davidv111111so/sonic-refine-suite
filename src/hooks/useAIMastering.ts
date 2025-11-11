import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface MasteringSettings {
  targetLoudness?: number; // LUFS, default: -14
  compressionRatio?: number; // ratio, default: 4
  eqProfile?: 'neutral' | 'bright' | 'warm' | 'bass-boost'; // default: 'neutral'
  stereoWidth?: number; // percentage, default: 100
}

export interface MasteringResult {
  blob: Blob;
  fileName: string;
  downloadUrl: string;
}

interface UploadUrlResponse {
  uploadUrl: string;
  downloadUrl: string;
  fileName: string;
  bucket: string;
  expiresIn: {
    upload: string;
    download: string;
  };
  metadata: {
    originalFileName: string;
    fileType: string;
    fileSize?: number;
    userId: string;
    timestamp: number;
  };
}

interface BackendMasteringResponse {
  success: boolean;
  masteredUrl: string;
  jobId?: string;
  processingTime?: number;
}

// Default settings
const DEFAULT_SETTINGS: Required<MasteringSettings> = {
  targetLoudness: -14,
  compressionRatio: 4,
  eqProfile: 'neutral',
  stereoWidth: 100,
};

export const useAIMastering = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const masterAudio = async (
    file: File,
    settings: MasteringSettings = {}
  ): Promise<MasteringResult> => {
    setIsProcessing(true);
    setProgress(0);

    try {
      console.log('🎵 Starting AI Mastering process for:', file.name);
      
      // Merge settings with defaults
      const masteringSettings: Required<MasteringSettings> = {
        ...DEFAULT_SETTINGS,
        ...settings,
      };

      console.log('⚙️ Mastering settings:', masteringSettings);

      // Step 1: Get signed URLs from Edge Function (10%)
      setProgress(10);
      toast({
        title: 'Preparing upload...',
        description: 'Generating secure upload URLs',
      });

      console.log('📡 Calling generate-upload-url Edge Function...');
      const { data: urlData, error: urlError } = await supabase.functions.invoke<UploadUrlResponse>(
        'generate-upload-url',
        {
          body: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          },
        }
      );

      if (urlError || !urlData) {
        console.error('❌ Error getting upload URL:', urlError);
        throw new Error(`Failed to get upload URL: ${urlError?.message || 'Unknown error'}`);
      }

      console.log('✅ Upload URLs generated:', {
        fileName: urlData.fileName,
        bucket: urlData.bucket,
      });

      // Step 2: Upload file to GCS (30%)
      setProgress(30);
      toast({
        title: 'Uploading audio...',
        description: `Uploading ${file.name} to cloud storage`,
      });

      console.log('☁️ Uploading file to Google Cloud Storage...');
      const uploadResponse = await fetch(urlData.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        console.error('❌ GCS upload failed:', uploadResponse.status, uploadResponse.statusText);
        throw new Error(`Failed to upload to cloud storage: ${uploadResponse.statusText}`);
      }

      console.log('✅ File uploaded successfully to GCS');

      // Step 3: Call Python backend for mastering (50%)
      setProgress(50);
      toast({
        title: 'Processing audio...',
        description: 'AI is analyzing and mastering your audio',
      });

      const backendUrl = import.meta.env.VITE_PYTHON_BACKEND_URL || 'https://spectrum-backend-857351913435.us-central1.run.app';
      
      if (!backendUrl) {
        console.error('❌ Backend URL not configured');
        throw new Error('Backend URL is not configured. Please set VITE_PYTHON_BACKEND_URL or contact support.');
      }

      console.log('🤖 Calling Python backend for AI mastering...');
      console.log('Backend URL:', backendUrl);
      console.log('Input file:', urlData.downloadUrl);

      const masteringResponse = await fetch(`${backendUrl}/api/master-audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputUrl: urlData.downloadUrl,
          fileName: urlData.fileName,
          settings: masteringSettings,
        }),
      });

      if (!masteringResponse.ok) {
        const errorText = await masteringResponse.text();
        console.error('❌ Backend mastering failed:', masteringResponse.status, errorText);
        throw new Error(`Mastering failed: ${errorText || masteringResponse.statusText}`);
      }

      const masteringData: BackendMasteringResponse = await masteringResponse.json();
      
      if (!masteringData.success || !masteringData.masteredUrl) {
        console.error('❌ Backend returned error:', masteringData);
        throw new Error('Mastering process failed - no mastered URL received');
      }

      console.log('✅ AI mastering completed:', {
        masteredUrl: masteringData.masteredUrl,
        jobId: masteringData.jobId,
        processingTime: masteringData.processingTime,
      });

      // Step 4: Download mastered file (80%)
      setProgress(80);
      toast({
        title: 'Downloading result...',
        description: 'Fetching your mastered audio',
      });

      console.log('📥 Downloading mastered file from:', masteringData.masteredUrl);
      const downloadResponse = await fetch(masteringData.masteredUrl);

      if (!downloadResponse.ok) {
        console.error('❌ Download failed:', downloadResponse.status, downloadResponse.statusText);
        throw new Error(`Failed to download mastered file: ${downloadResponse.statusText}`);
      }

      const blob = await downloadResponse.blob();
      console.log('✅ Mastered file downloaded:', {
        size: blob.size,
        type: blob.type,
      });

      // Step 5: Complete (100%)
      setProgress(100);
      toast({
        title: 'Success!',
        description: 'Your audio has been mastered successfully',
      });

      console.log('🎉 AI Mastering process completed successfully');

      // Generate download filename
      const masteredFileName = file.name.replace(/\.[^/.]+$/, '') + '_mastered.wav';

      return {
        blob,
        fileName: masteredFileName,
        downloadUrl: masteringData.masteredUrl,
      };

    } catch (error) {
      console.error('💥 AI Mastering error:', error);
      
      toast({
        title: 'Mastering failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });

      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  return {
    masterAudio,
    isProcessing,
    progress,
  };
};

// Helper function to trigger file download in browser
export const downloadMasteredFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log('📥 File download triggered:', fileName);
};

// Helper function to get file size in human-readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Example usage:
/*
function MasteringComponent() {
  const { masterAudio, isProcessing, progress } = useAIMastering();

  const handleMaster = async (file: File) => {
    try {
      const result = await masterAudio(file, {
        targetLoudness: -14,
        compressionRatio: 4,
        eqProfile: 'bright',
        stereoWidth: 120,
      });
      
      // Download the mastered file
      downloadMasteredFile(result.blob, result.fileName);
      
      console.log('Mastered file ready:', result.fileName);
    } catch (error) {
      console.error('Mastering failed:', error);
    }
  };

  return (
    <div>
      {isProcessing && (
        <div>
          <p>Processing... {progress}%</p>
          <progress value={progress} max={100} />
        </div>
      )}
    </div>
  );
}
*/
