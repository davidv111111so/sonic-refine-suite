import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

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
  const abortControllerRef = useRef<AbortController | null>(null);

  const masterAudio = async (
    file: File,
    settings: MasteringSettings = {}
  ): Promise<MasteringResult> => {
    setIsProcessing(true);
    setProgress(0);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      console.log('🎵 Starting AI Mastering process for:', file.name);
      
      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`
        );
      }
      
      console.log('✅ File size validated:', formatFileSize(file.size));
      
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

      // Step 2: Upload file to GCS with retry and progress (30%)
      setProgress(30);
      toast({
        title: 'Uploading audio...',
        description: `Uploading ${file.name} to cloud storage`,
      });

      console.log('☁️ Uploading file to Google Cloud Storage...');
      
      // Use XMLHttpRequest for better progress tracking
      const uploadWithProgress = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const uploadPercent = (e.loaded / e.total) * 20; // 20% of total progress
              setProgress(30 + Math.round(uploadPercent));
            }
          });
          
          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          });
          
          xhr.addEventListener('error', () => {
            reject(new Error('Network error during upload'));
          });
          
          xhr.addEventListener('abort', () => {
            reject(new Error('Upload cancelled'));
          });
          
          // Listen for abort signal
          if (abortControllerRef.current) {
            abortControllerRef.current.signal.addEventListener('abort', () => {
              xhr.abort();
            });
          }
          
          xhr.open('PUT', urlData.uploadUrl);
          xhr.setRequestHeader('Content-Type', file.type);
          xhr.send(file);
        });
      };
      
      // Retry logic for upload
      await fetchWithRetry(uploadWithProgress, MAX_RETRIES, RETRY_DELAY);

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
      
      // User-friendly error messages
      let errorMessage = 'An unexpected error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('cancelled') || error.message.includes('abort')) {
          errorMessage = 'Processing was cancelled';
        } else if (error.message.includes('File size')) {
          errorMessage = error.message;
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. The file may be too large or processing is taking longer than expected.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: 'Mastering failed',
        description: errorMessage,
        variant: 'destructive',
      });

      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };
  
  // Function to cancel ongoing processing
  const cancelProcessing = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log('🛑 Processing cancelled by user');
      toast({
        title: 'Cancelled',
        description: 'Audio mastering was cancelled',
      });
    }
  };

  return {
    masterAudio,
    isProcessing,
    progress,
    cancelProcessing,
  };
};

// Helper function: Retry with exponential backoff
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = i === retries - 1;
      
      if (isLastAttempt) {
        throw error;
      }
      
      // Check if error is cancellation - don't retry
      if (error instanceof Error && 
          (error.message.includes('cancel') || error.message.includes('abort'))) {
        throw error;
      }
      
      console.log(`⚠️ Attempt ${i + 1} failed, retrying in ${delay * (i + 1)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

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
