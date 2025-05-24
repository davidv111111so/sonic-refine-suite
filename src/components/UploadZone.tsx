
import { useState, useCallback, useRef } from 'react';
import { Upload, FileAudio, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AudioFile } from '@/pages/Index';

interface UploadZoneProps {
  onFilesUploaded: (files: AudioFile[]) => void;
}

export const UploadZone = ({ onFilesUploaded }: UploadZoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(async (files: FileList) => {
    const audioFiles: AudioFile[] = [];
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/m4a'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|ogg|m4a)$/i)) {
        continue;
      }

      // Create AudioContext to extract audio metadata
      let duration = undefined;
      let sampleRate = undefined;
      let bitrate = undefined;
      
      // Try to extract metadata if browser supports it
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        duration = audioBuffer.duration;
        sampleRate = audioBuffer.sampleRate;
        // Estimate bitrate (very roughly)
        bitrate = Math.round((file.size * 8) / (duration * 1000));
        
        // Clean up
        audioContext.close();
      } catch (error) {
        console.error('Error extracting audio metadata:', error);
      }

      const audioFile: AudioFile = {
        id: `${Date.now()}-${i}`,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploaded',
        originalFile: file,
        duration,
        sampleRate,
        bitrate,
      };

      audioFiles.push(audioFile);

      // Simulate upload progress
      setUploadProgress(prev => ({ ...prev, [audioFile.id]: 0 }));
      
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(prev => ({ ...prev, [audioFile.id]: progress }));
      }
    }

    onFilesUploaded(audioFiles);
    setUploadProgress({});
  }, [onFilesUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const handleBrowse = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const hasUploadsInProgress = Object.keys(uploadProgress).length > 0;

  return (
    <div className="space-y-6">
      <Card className={`bg-slate-800/50 border-2 border-dashed transition-all duration-300 ${
        isDragOver ? 'border-blue-400 bg-blue-900/20' : 'border-slate-600'
      }`}>
        <CardContent className="p-12">
          <div
            className="text-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className={`transition-all duration-300 ${isDragOver ? 'scale-110' : ''}`}>
              <Upload className={`h-16 w-16 mx-auto mb-4 ${
                isDragOver ? 'text-blue-400' : 'text-slate-400'
              }`} />
            </div>
            
            <h3 className="text-2xl font-semibold mb-2 text-white">
              {isDragOver ? 'Drop your audio files here' : 'Upload Your Audio Files'}
            </h3>
            
            <p className="text-slate-400 mb-6">
              Drag and drop your music files or click to browse
            </p>
            
            <p className="text-sm text-slate-500 mb-6">
              Supported formats: MP3, WAV, FLAC, OGG, M4A
            </p>

            <Button
              onClick={handleBrowse}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              disabled={hasUploadsInProgress}
            >
              <FileAudio className="h-5 w-5 mr-2" />
              Choose Files
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".mp3,.wav,.flac,.ogg,.m4a,audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {hasUploadsInProgress && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold mb-4 text-white">Uploading Files...</h4>
            <div className="space-y-3">
              {Object.entries(uploadProgress).map(([fileId, progress]) => (
                <div key={fileId} className="flex items-center gap-3">
                  <FileAudio className="h-4 w-4 text-blue-400 flex-shrink-0" />
                  <div className="flex-1">
                    <Progress value={progress} className="h-2" />
                  </div>
                  <span className="text-sm text-slate-400 w-12">{progress}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold mb-3 text-white">Tips for Best Results</h4>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              Upload high-quality source files for better enhancement results
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              FLAC and WAV files provide the best quality for processing
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              You can upload multiple files at once for batch processing
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              Files are processed locally in your browser for privacy
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
