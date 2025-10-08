import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileAudio, AlertCircle, ExternalLink } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { Link } from 'react-router-dom';

interface UploadWithConsentProps {
  onFilesUploaded: (files: AudioFile[]) => void;
  supportedFormats?: string[];
  maxFileSize?: number;
  maxFiles?: number;
}

export const UploadWithConsent = ({ 
  onFilesUploaded, 
  supportedFormats = ['.mp3', '.wav', '.flac'],
  maxFileSize = 100 * 1024 * 1024,
  maxFiles = 20
}: UploadWithConsentProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasConsented, setHasConsented] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setErrorMessage(null);
    
    if (!hasConsented) {
      setPendingFiles(acceptedFiles);
      setErrorMessage('Please accept the Terms and Conditions before uploading files.');
      return;
    }

    processFiles(acceptedFiles);
  }, [hasConsented]);

  const processFiles = (files: File[]) => {
    const audioFiles: AudioFile[] = files.map(file => {
      const id = Math.random().toString(36).substring(7);
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploaded' as const,
        originalFile: file,
        progress: 0,
        processingStage: 'Ready for enhancement'
      };
    });

    onFilesUploaded(audioFiles);
    setPendingFiles([]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/*': supportedFormats
    },
    maxSize: maxFileSize,
    multiple: true,
    onDropRejected: (rejectedFiles) => {
      const file = rejectedFiles[0];
      if (file) {
        if (file.errors && file.errors.length > 0) {
          const error = file.errors[0];
          if (error.code === 'file-too-large') {
            setErrorMessage(`File "${file.file.name}" is too large. Maximum size is ${Math.round(maxFileSize / 1024 / 1024)}MB for optimal processing.`);
          } else if (error.code === 'file-invalid-type') {
            setErrorMessage(`File "${file.file.name}" format not supported. Supported formats: ${supportedFormats.join(', ')}.`);
          } else {
            setErrorMessage(`Error uploading "${file.file.name}": ${error.message}`);
          }
        }
      }
    }
  });

  const handleConsentChange = (checked: boolean) => {
    setHasConsented(checked);
    setErrorMessage(null);
    
    if (checked && pendingFiles.length > 0) {
      processFiles(pendingFiles);
    }
  };

  const handleUploadClick = () => {
    if (!hasConsented) {
      setErrorMessage('Please accept the Terms and Conditions before uploading files.');
      return;
    }
    // Trigger the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
        <CardContent className="p-6">
          <div 
            {...getRootProps()} 
            className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-md cursor-pointer bg-slate-700/20 border-slate-500/50 hover:bg-slate-700/40 hover:border-blue-400/50 transition-all duration-200"
            onClick={handleUploadClick}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-300 text-sm font-medium">Drop your audio files here...</p>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-8 w-8 text-blue-400 mb-2" />
                <p className="text-white text-base text-center font-medium mb-1">
                  Drag audio files here or click to select
                </p>
                <p className="text-sm text-slate-300">{supportedFormats.join(', ').toUpperCase()} (Max {Math.round(maxFileSize / 1024 / 1024)}MB each, {maxFiles} files)</p>
              </div>
            )}
          </div>

          {/* Consent Checkbox */}
          <div className="mt-6 pt-4 border-t border-slate-600">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={hasConsented}
                onCheckedChange={handleConsentChange}
                className="mt-1"
              />
              <div className="flex-1">
                <label 
                  htmlFor="consent" 
                  className="text-sm cursor-pointer leading-relaxed bg-gradient-to-r from-blue-200 via-cyan-200 to-purple-200 bg-clip-text text-transparent font-semibold animate-pulse"
                  style={{
                    textShadow: '0 0 20px rgba(96, 165, 250, 0.4), 0 0 30px rgba(165, 180, 252, 0.3)',
                  }}
                >
                  I agree to the{' '}
                  <Link 
                    to="/terms" 
                    className="text-blue-300 hover:text-blue-200 underline inline-flex items-center gap-1 font-bold"
                    target="_blank"
                  >
                    Terms and Conditions
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  {' '}and acknowledge the Copyright Disclaimer. I confirm that I own or have proper authorization 
                  for all audio files I upload and process through this service.
                </label>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-md bg-red-900/50 border border-red-600/50 text-red-200 flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              {errorMessage}
            </div>
          )}

          {/* Upload Status */}
          {!hasConsented && (
            <div className="mt-4 p-3 rounded-md bg-yellow-900/50 border border-yellow-600/50 text-yellow-200 flex items-center text-sm">
              <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
              Please accept the Terms and Conditions to enable file uploads.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};