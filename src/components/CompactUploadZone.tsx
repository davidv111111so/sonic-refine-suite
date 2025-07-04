
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileAudio, AlertCircle, X, Trash2 } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { Button } from '@/components/ui/button';
import { EnhancedMiniPlayer } from '@/components/EnhancedMiniPlayer';

interface CompactUploadZoneProps {
  onFilesUploaded: (files: AudioFile[]) => void;
  uploadedFiles: AudioFile[];
  onRemoveFile: (id: string) => void;
  eqBands: number[];
  onEQBandChange: (bandIndex: number, value: number) => void;
  onResetEQ: () => void;
  eqEnabled: boolean;
}

export const CompactUploadZone = ({ 
  onFilesUploaded, 
  uploadedFiles, 
  onRemoveFile,
  eqBands,
  onEQBandChange,
  onResetEQ,
  eqEnabled
}: CompactUploadZoneProps) => {
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
        processingStage: 'Ready for Perfect Audio enhancement'
      };
    });

    onFilesUploaded(audioFiles);
  }, [onFilesUploaded]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a']
    },
    maxSize: 100 * 1024 * 1024, // 100MB
    multiple: true,
    onDropRejected: (rejectedFiles) => {
      const file = rejectedFiles[0];
      if (file) {
        if (file.errors && file.errors.length > 0) {
          const error = file.errors[0];
          if (error.code === 'file-too-large') {
            setErrorMessage(`File "${file.file.name}" is too large. Maximum size is 100MB for optimal processing.`);
          } else if (error.code === 'file-invalid-type') {
            setErrorMessage(`File "${file.file.name}" format not supported. Perfect Audio supports MP3, WAV, FLAC, and M4A.`);
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

  // Show only last 20 files for performance
  const displayFiles = uploadedFiles.slice(-20);

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
        <CardContent className="p-3">
          <div {...getRootProps()} className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-md cursor-pointer bg-slate-700/20 border-slate-500/50 hover:bg-slate-700/40 hover:border-blue-400/50 transition-all duration-200">
            <input {...getInputProps()} />
            {isDragActive ? (
              <p className="text-blue-300 text-sm font-medium">Drop your audio files here...</p>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="h-5 w-5 text-blue-400 mb-1" />
                <p className="text-white text-sm text-center font-medium">Drag audio files here or click to select (Max 20 files)</p>
                <p className="text-xs text-slate-300">MP3, WAV, FLAC, M4A (Max 100MB each)</p>
              </div>
            )}
          </div>
          {errorMessage && (
            <div className="mt-2 p-2 rounded-md bg-red-900/50 border border-red-600/50 text-red-200 flex items-center text-xs">
              <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
              {errorMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Files List - Show last 20 */}
      {displayFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-white">
              Uploaded Files ({uploadedFiles.length}/20)
            </h4>
            <div className="text-xs text-slate-400">
              Total: {formatFileSize(displayFiles.reduce((sum, file) => sum + file.size, 0))}
            </div>
          </div>
          
          {displayFiles.map((file) => (
            <div key={file.id} className="space-y-2">
              <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between bg-slate-700/50 rounded p-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileAudio className="h-4 w-4 text-blue-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white truncate font-medium">{file.name}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <span>{formatFileSize(file.size)}</span>
                          <span>•</span>
                          <span className={
                            file.status === 'enhanced' ? 'text-green-400' :
                            file.status === 'processing' ? 'text-blue-400' :
                            file.status === 'error' ? 'text-red-400' :
                            'text-slate-300'
                          }>
                            {file.processingStage}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {file.status === 'error' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveFile(file.id)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveFile(file.id)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-slate-600"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Enhanced Mini Player for Preview */}
              <EnhancedMiniPlayer file={file} />
            </div>
          ))}
          
          {uploadedFiles.length > 20 && (
            <div className="text-center text-xs text-slate-400 p-2 bg-slate-800/50 rounded">
              Showing last 20 of {uploadedFiles.length} files. Older files are hidden for performance.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
