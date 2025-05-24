
import { useState, useCallback, useRef } from 'react';
import { Upload, FileAudio, X, Image } from 'lucide-react';
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

  const extractAlbumArtwork = async (file: File): Promise<string | undefined> => {
    // Only attempt extraction for audio files
    if (!file.type.startsWith('audio/')) return undefined;

    try {
      // For MP3 files with embedded artwork
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Simple ID3 tag detection (very basic implementation)
      // Look for APIC frame which contains the artwork
      const id3v2Header = String.fromCharCode(...Array.from(uint8Array.slice(0, 3)));
      
      if (id3v2Header === 'ID3') {
        // This is a very simplified approach to find image data
        // A robust implementation would parse the ID3 structure properly
        
        // Look for JPEG header bytes (FF D8 FF)
        for (let i = 0; i < uint8Array.length - 3; i++) {
          if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xD8 && uint8Array[i + 2] === 0xFF) {
            // Found potential JPEG header
            // Find the end of the JPEG (FF D9)
            for (let j = i; j < uint8Array.length - 1; j++) {
              if (uint8Array[j] === 0xFF && uint8Array[j + 1] === 0xD9) {
                // Extract the JPEG data
                const imageBlob = new Blob([uint8Array.slice(i, j + 2)], { type: 'image/jpeg' });
                return URL.createObjectURL(imageBlob);
              }
            }
          }
        }
        
        // Also look for PNG header bytes (89 50 4E 47)
        for (let i = 0; i < uint8Array.length - 4; i++) {
          if (
            uint8Array[i] === 0x89 && 
            uint8Array[i + 1] === 0x50 && 
            uint8Array[i + 2] === 0x4E && 
            uint8Array[i + 3] === 0x47
          ) {
            // Found potential PNG header
            // Find the IEND chunk which marks the end of the PNG
            for (let j = i + 4; j < uint8Array.length - 8; j++) {
              if (
                uint8Array[j] === 0x49 && 
                uint8Array[j + 1] === 0x45 && 
                uint8Array[j + 2] === 0x4E && 
                uint8Array[j + 3] === 0x44
              ) {
                // Extract PNG data (include the ending bytes)
                const imageBlob = new Blob([uint8Array.slice(i, j + 8)], { type: 'image/png' });
                return URL.createObjectURL(imageBlob);
              }
            }
          }
        }
      }
      
      // If we didn't find embedded artwork, return undefined
      return undefined;
    } catch (error) {
      console.error('Error extracting album artwork:', error);
      return undefined;
    }
  };

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

      // Extract album artwork
      const artworkUrl = await extractAlbumArtwork(file);

      // Extract song and artist information from filename
      let artist = "Unknown Artist";
      let title = file.name;
      
      const nameMatch = file.name.match(/^(.*?)\s-\s(.*)\.[\w\d]+$/);
      if (nameMatch) {
        artist = nameMatch[1].trim();
        title = nameMatch[2].trim();
      } else {
        // Remove file extension for title
        title = file.name.replace(/\.[^.]+$/, '');
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
        artist,
        title,
        artworkUrl,
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
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              Album artwork will be extracted when available
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
