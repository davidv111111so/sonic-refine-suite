import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { MasteringSettings } from '@/components/ai-mastering/MasteringAdvancedSettings';

// Constants
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second base delay

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

// Helper function to get file size in human-readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Helper function to trigger file download in browser
export const downloadMasteredFile = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log("📥 File download triggered:", fileName);
};

export const useAIMastering = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const masterAudio = async (
    targetFile: File,
    referenceFile: File,
    settings?: MasteringSettings
  ): Promise<MasteringResult> => {
    setIsProcessing(true);
    setProgress(0);
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      console.log('🎵 Starting AI Mastering with Matchering');
      console.log('📂 Target:', targetFile.name);
      console.log('📂 Reference:', referenceFile.name);
      
      // Validate file sizes
      if (targetFile.size > MAX_FILE_SIZE) {
        throw new Error(
          `Target file size (${formatFileSize(targetFile.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`
        );
      }
      if (referenceFile.size > MAX_FILE_SIZE) {
        throw new Error(
          `Reference file size (${formatFileSize(referenceFile.size)}) exceeds maximum allowed size (${formatFileSize(MAX_FILE_SIZE)})`
        );
      }
      
      console.log('✅ File sizes validated');
      console.log('Target:', formatFileSize(targetFile.size));
      console.log('Reference:', formatFileSize(referenceFile.size));
      
      // Use provided Matchering settings if available
      const masteringSettings = settings;

      console.log('⚙️ Matchering settings:', masteringSettings);

      // Step 1: Get signed URLs for TARGET (5%)
      setProgress(5);
      toast({
        title: 'Preparing uploads...',
        description: 'Generating secure upload URLs for target and reference',
      });

      console.log('📡 Getting upload URL for TARGET...');
      const { data: targetUrlData, error: targetUrlError } = await supabase.functions.invoke<UploadUrlResponse>(
        'generate-upload-url',
        {
          body: {
            fileName: targetFile.name,
            fileType: targetFile.type,
            fileSize: targetFile.size,
          },
        }
      );

      if (targetUrlError || !targetUrlData) {
        console.error('❌ Error getting TARGET upload URL:', targetUrlError);
        throw new Error(`Failed to get TARGET upload URL: ${targetUrlError?.message || 'Unknown error'}`);
      }

      console.log('✅ TARGET upload URL generated');

      // Step 2: Get signed URLs for REFERENCE (10%)
      setProgress(10);
      console.log('📡 Getting upload URL for REFERENCE...');
      const { data: refUrlData, error: refUrlError } = await supabase.functions.invoke<UploadUrlResponse>(
        'generate-upload-url',
        {
          body: {
            fileName: referenceFile.name,
            fileType: referenceFile.type,
            fileSize: referenceFile.size,
          },
        }
      );

      if (refUrlError || !refUrlData) {
        console.error('❌ Error getting REFERENCE upload URL:', refUrlError);
        throw new Error(`Failed to get REFERENCE upload URL: ${refUrlError?.message || 'Unknown error'}`);
      }

      console.log('✅ REFERENCE upload URL generated');

      // Step 3: Upload TARGET to GCS (15-30%)
      setProgress(15);
      toast({
        title: 'Uploading target...',
        description: `Uploading ${targetFile.name} to cloud storage`,
      });

      console.log('☁️ Uploading TARGET to Google Cloud Storage...');
      
      const createUploadWithProgress = (file: File, uploadUrl: string, progressStart: number, progressRange: number) => {
        return (): Promise<void> => {
          return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            
            xhr.upload.addEventListener('progress', (e) => {
              if (e.lengthComputable) {
                const uploadPercent = (e.loaded / e.total) * progressRange;
                setProgress(progressStart + Math.round(uploadPercent));
              }
            });
            
            xhr.addEventListener('load', () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                console.log('✅ Upload completed successfully:', xhr.status);
                resolve();
              } else {
                console.error('❌ Upload failed with status:', xhr.status);
                reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
              }
            });
            
            xhr.addEventListener('error', () => {
              reject(new Error('Network error: Unable to upload to cloud storage'));
            });
            
            xhr.addEventListener('abort', () => {
              reject(new Error('Upload cancelled'));
            });
            
            if (abortControllerRef.current) {
              abortControllerRef.current.signal.addEventListener('abort', () => {
                xhr.abort();
              });
            }
            
            xhr.open('PUT', uploadUrl);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.send(file);
          });
        };
      };
      
      await fetchWithRetry(createUploadWithProgress(targetFile, targetUrlData.uploadUrl, 15, 15), MAX_RETRIES, RETRY_DELAY);
      console.log('✅ TARGET uploaded successfully');

      // Step 4: Upload REFERENCE to GCS (30-45%)
      setProgress(30);
      toast({
        title: 'Uploading reference...',
        description: `Uploading ${referenceFile.name} to cloud storage`,
      });

      console.log('☁️ Uploading REFERENCE to Google Cloud Storage...');
      await fetchWithRetry(createUploadWithProgress(referenceFile, refUrlData.uploadUrl, 30, 15), MAX_RETRIES, RETRY_DELAY);
      console.log('✅ REFERENCE uploaded successfully');

      // Step 5: Call Python backend for Matchering (45-75%)
      setProgress(45);
      toast({
        title: 'Processing with Matchering...',
        description: 'Analyzing and matching your audio to reference',
      });

      // Detectar la URL del backend basada en el entorno
      // En desarrollo, usamos siempre el backend local en http://localhost:8000
      // En producción (Lovable), usamos siempre el backend de Cloud Run
      const defaultBackendUrl = import.meta.env.DEV
        ? 'http://localhost:8000'
        : 'https://mastering-backend-857351913435.us-central1.run.app';

      const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_PYTHON_BACKEND_URL || defaultBackendUrl;
      
      console.log('🤖 Calling Python backend for Matchering mastering...');
      console.log('Backend URL:', backendUrl);
      console.log('Target file:', targetUrlData.downloadUrl);
      console.log('Reference file:', refUrlData.downloadUrl);

      let blob: Blob;
      let masteredUrl = '';
      let shouldUseTestingMode = false;

      try {
        // Try to call the real backend
        const masteringResponse = await fetch(`${backendUrl}/api/master-audio`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            targetUrl: targetUrlData.downloadUrl,
            referenceUrl: refUrlData.downloadUrl,
            fileName: targetUrlData.fileName,
            settings: masteringSettings,
          }),
          signal: abortControllerRef.current?.signal,
        });

        if (!masteringResponse.ok) {
          const errorText = await masteringResponse.text();
          console.warn('⚠️ Backend mastering failed:', masteringResponse.status, errorText);
          shouldUseTestingMode = true;
        } else {
          const masteringData: BackendMasteringResponse = await masteringResponse.json();
          
          if (!masteringData.success || !masteringData.masteredUrl) {
            console.warn('⚠️ Backend returned error:', masteringData);
            shouldUseTestingMode = true;
          } else {
            console.log('✅ Matchering mastering completed:', {
              masteredUrl: masteringData.masteredUrl,
              jobId: masteringData.jobId,
              processingTime: masteringData.processingTime,
            });

            masteredUrl = masteringData.masteredUrl;

            // Step 6: Download mastered file (75-95%)
            setProgress(75);
            toast({
              title: 'Downloading result...',
              description: 'Fetching your mastered audio',
            });

            console.log('📥 Downloading mastered file from:', masteringData.masteredUrl);
            
            // Retry logic for download
            let downloadResponse;
            try {
              downloadResponse = await fetch(masteringData.masteredUrl, {
                signal: abortControllerRef.current?.signal,
              });
            } catch (fetchError) {
              console.warn('⚠️ Download fetch error:', fetchError);
              throw new Error(`Failed to download mastered file: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
            }

            if (!downloadResponse.ok) {
              const errorText = await downloadResponse.text().catch(() => 'Unknown error');
              console.warn('⚠️ Download failed:', downloadResponse.status, downloadResponse.statusText, errorText);
              throw new Error(`Failed to download mastered file: ${downloadResponse.status} ${downloadResponse.statusText}`);
            }
            
            blob = await downloadResponse.blob();
            
            if (!blob || blob.size === 0) {
              throw new Error('Downloaded file is empty');
            }
            
            console.log('✅ Mastered file downloaded successfully:', {
              size: blob.size,
              type: blob.type,
            });
          }
        }
      } catch (backendError) {
        console.warn('⚠️ Backend error, switching to testing mode:', backendError);
        shouldUseTestingMode = true;
      }

      // TESTING MODE: Simulate processing and return original file
      if (shouldUseTestingMode) {
        console.error('❌ Matchering backend not available');
        toast({
          title: 'Backend Error',
          description: 'Matchering backend is not responding. Please try again later.',
          variant: 'destructive',
        });
        throw new Error('Matchering backend unavailable');
      }

      console.log('✅ Mastered file downloaded:', {
        size: blob.size,
        type: blob.type,
      });

      // Step 7: Complete (100%)
      setProgress(100);
      toast({
        title: 'Success!',
        description: 'Your audio has been mastered with Matchering!',
      });

      console.log('🎉 Matchering mastering process completed successfully');

      // Generate download filename
      const masteredFileName = targetFile.name.replace(/\.[^/.]+$/, '') + '_mastered.wav';

      return {
        blob,
        fileName: masteredFileName,
        downloadUrl: masteredUrl,
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
