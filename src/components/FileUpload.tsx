import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Music, FileAudio } from 'lucide-react';

interface FileUploadProps {
  onFilesAdded: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesAdded,
  maxFiles = 20,
  maxSize = 100 * 1024 * 1024, // 100MB
  className = ""
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesAdded(acceptedFiles);
  }, [onFilesAdded]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.ogg', '.m4a', '.aac']
    },
    maxFiles,
    maxSize,
    multiple: true
  });

  return (
    <div className={className}>
      <Card 
        {...getRootProps()}
        className={`
          cursor-pointer transition-all duration-200 border-2 border-dashed
          ${isDragActive && !isDragReject 
            ? 'border-blue-400 bg-blue-400/10 scale-102' 
            : isDragReject 
            ? 'border-red-400 bg-red-400/10' 
            : 'border-slate-600 bg-slate-800/50 hover:border-blue-400/50 hover:bg-slate-700/50'
          }
        `}
      >
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <input {...getInputProps()} />
          
          <div className="mb-4">
            {isDragActive ? (
              <FileAudio className="h-16 w-16 text-blue-400 animate-bounce" />
            ) : (
              <Upload className="h-16 w-16 text-slate-400" />
            )}
          </div>

          <div className="space-y-2">
            {isDragActive ? (
              <p className="text-lg font-medium text-blue-400">
                {isDragReject ? 'Invalid file type!' : 'Drop your audio files here'}
              </p>
            ) : (
              <>
                <p className="text-lg font-medium text-white">
                  Drag & drop your audio files here
                </p>
                <p className="text-sm text-slate-400">
                  or click to select files
                </p>
              </>
            )}
            
            <div className="flex items-center justify-center gap-2 mt-3">
              <Music className="h-4 w-4 text-slate-500" />
              <span className="text-xs text-slate-500">
                MP3, WAV, FLAC, OGG, M4A, AAC • Max {maxFiles} files • {Math.round(maxSize / (1024 * 1024))}MB each
              </span>
            </div>
          </div>

          {/* File rejection errors */}
          {fileRejections.length > 0 && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-md">
              <p className="text-sm text-red-400 font-medium mb-2">File upload errors:</p>
              <ul className="text-xs text-red-300 space-y-1">
                {fileRejections.map(({ file, errors }) => (
                  <li key={file.name}>
                    <strong>{file.name}:</strong> {errors[0]?.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};