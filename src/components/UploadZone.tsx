
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileAudio, AlertCircle } from 'lucide-react';
import { AudioFile } from '@/types/audio';

interface UploadZoneProps {
  onFilesUploaded: (files: AudioFile[]) => void;
}

export const UploadZone = ({ onFilesUploaded }: UploadZoneProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onDrop = useCallback(acceptedFiles => {
    setErrorMessage(null); // Clear any previous error message

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
        processingStage: 'Pending'
      };
    });

    onFilesUploaded(audioFiles);
  }, [onFilesUploaded]);

  const {getRootProps, getInputProps, isDragActive} = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a']
    },
    maxSize: 200 * 1024 * 1024, // 200MB
    multiple: true,
    onDropRejected: (rejectedFiles) => {
      const file = rejectedFiles[0];
      if (file) {
        if (file.errors && file.errors.length > 0) {
          const error = file.errors[0];
          if (error.code === 'file-too-large') {
            setErrorMessage(`File "${file.file.name}" is too large. Maximum size is 200MB.`);
          } else if (error.code === 'file-invalid-type') {
            setErrorMessage(`File "${file.file.name}" has an invalid file type. Only audio files are allowed.`);
          } else {
            setErrorMessage(`Error uploading "${file.file.name}": ${error.message}`);
          }
        } else {
          setErrorMessage(`File "${file.file.name}" could not be uploaded.`);
        }
      } else {
        setErrorMessage("No files were uploaded.");
      }
    }
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <div {...getRootProps()} className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-md cursor-pointer bg-slate-700/20 border-slate-500/50 hover:bg-slate-700/40 transition-colors">
          <input {...getInputProps()} />
          {
            isDragActive ?
              <p className="text-slate-300">Drop the files here ...</p> :
              <div className="flex flex-col items-center">
                <Upload className="h-6 w-6 text-slate-400 mb-2" />
                <p className="text-slate-400">Drag 'n' drop some audio files here, or click to select files</p>
                <p className="text-xs text-slate-500 mt-1">Supported formats: mp3, wav, flac, m4a (Max 200MB)</p>
              </div>
          }
        </div>
        {errorMessage && (
          <div className="mt-4 p-3 rounded-md bg-red-100 text-red-700 flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            {errorMessage}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
