
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileAudio, AlertCircle, X } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { Button } from '@/components/ui/button';

interface CompactUploadZoneProps {
  onFilesUploaded: (files: AudioFile[]) => void;
  uploadedFiles: AudioFile[];
  onRemoveFile: (id: string) => void;
}

export const CompactUploadZone = ({ onFilesUploaded, uploadedFiles, onRemoveFile }: CompactUploadZoneProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDrop = useCallback(acceptedFiles => {
    setErrorMessage(null);

    const audioFiles: AudioFile[] = acceptedFiles.map(file => {
      const id = Math.random().toString(36).substring(7);
      return {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploaded' as const,
        originalFile: file,
        progress: 0,
        processingStage: 'Ready'
      };
    });

    onFilesUploaded(audioFiles);
  }, [onFilesUploaded]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
    onDropRejected: (rejectedFiles) => {
      const file = rejectedFiles[0];
      if (file) {
        if (file.errors && file.errors.length > 0) {
          const error = file.errors[0];
          if (error.code === 'file-too-large') {
            setErrorMessage(`File "${file.file.name}" is too large. Maximum size is 50MB.`);
          } else if (error.code === 'file-invalid-type') {
            setErrorMessage(`File "${file.file.name}" has an invalid file type. Only MP3, WAV, FLAC, M4A are supported.`);
          } else {
            setErrorMessage(`Error uploading "${file.file.name}": ${error.message}`);
          }
        }
      }
    }
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-3">
          <div {...getRootProps()} className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-md cursor-pointer bg-slate-700/20 border-slate-500/50 hover:bg-slate-700/40 transition-colors">
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-slate-300 text-sm">Drop the files here...</p>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-5 w-5 text-slate-400 mb-1" />
                <p className="text-slate-400 text-sm text-center">Drag audio files here or click to select</p>
                <p className="text-xs text-slate-500">MP3, WAV, FLAC, M4A (Max 50MB)</p>
              </div>
            )}
          </div>
          {errorMessage && (
            <div className="mt-2 p-2 rounded-md bg-red-100 text-red-700 flex items-center text-xs">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              {errorMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-3">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-white mb-2">
                Uploaded Files ({uploadedFiles.length})
              </h4>
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between bg-slate-700/50 rounded p-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileAudio className="h-4 w-4 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span className={
                          file.status === 'enhanced' ? 'text-green-400' :
                          file.status === 'processing' ? 'text-blue-400' :
                          file.status === 'error' ? 'text-red-400' :
                          'text-slate-400'
                        }>
                          {file.processingStage}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveFile(file.id)}
                    className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
