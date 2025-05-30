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
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: { progress: number; name: string; artist: string; title: string } }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractAlbumArtwork = async (file: File): Promise<string | undefined> => {
    if (!file.type.startsWith('audio/')) return undefined;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const id3v2Header = String.fromCharCode(...Array.from(uint8Array.slice(0, 3)));
      
      if (id3v2Header === 'ID3') {
        for (let i = 0; i < uint8Array.length - 3; i++) {
          if (uint8Array[i] === 0xFF && uint8Array[i + 1] === 0xD8 && uint8Array[i + 2] === 0xFF) {
            for (let j = i; j < uint8Array.length - 1; j++) {
              if (uint8Array[j] === 0xFF && uint8Array[j + 1] === 0xD9) {
                const imageBlob = new Blob([uint8Array.slice(i, j + 2)], { type: 'image/jpeg' });
                return URL.createObjectURL(imageBlob);
              }
            }
          }
        }
        
        for (let i = 0; i < uint8Array.length - 4; i++) {
          if (
            uint8Array[i] === 0x89 && 
            uint8Array[i + 1] === 0x50 && 
            uint8Array[i + 2] === 0x4E && 
            uint8Array[i + 3] === 0x47
          ) {
            for (let j = i + 4; j < uint8Array.length - 8; j++) {
              if (
                uint8Array[j] === 0x49 && 
                uint8Array[j + 1] === 0x45 && 
                uint8Array[j + 2] === 0x4E && 
                uint8Array[j + 3] === 0x44
              ) {
                const imageBlob = new Blob([uint8Array.slice(i, j + 8)], { type: 'image/png' });
                return URL.createObjectURL(imageBlob);
              }
            }
          }
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error extracting album artwork:', error);
      return undefined;
    }
  };

  const extractSongInfo = (fileName: string) => {
    let artist = "Unknown Artist";
    let title = fileName;
    
    // Remove file extension
    const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
    
    // Enhanced parsing patterns
    const patterns = [
      /^(.*?)\s*-\s*(.*)$/, // Artist - Title
      /^(.*?)\s*–\s*(.*)$/, // Artist – Title (en dash)
      /^(.*?)\s*—\s*(.*)$/, // Artist — Title (em dash)
      /^(\d+\.?\s*)?(.*?)\s*-\s*(.*)$/, // Track number. Artist - Title
      /^(\d+[\.\s]+)(.*)$/ // Just track number prefix
    ];
    
    for (const pattern of patterns) {
      const match = nameWithoutExt.match(pattern);
      if (match) {
        if (match.length === 3) {
          artist = match[1].trim();
          title = match[2].trim();
          break;
        } else if (match.length === 4) {
          artist = match[2].trim();
          title = match[3].trim();
          break;
        }
      }
    }
    
    // If no pattern matched, use the filename as title
    if (artist === "Unknown Artist") {
      title = nameWithoutExt;
    }
    
    return { artist, title };
  };

  const processFiles = useCallback(async (files: FileList) => {
    const audioFiles: AudioFile[] = [];
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/ogg', 'audio/m4a'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|flac|ogg|m4a)$/i)) {
        continue;
      }

      // Extract song info for display during upload
      const { artist, title } = extractSongInfo(file.name);

      const fileId = `${Date.now()}-${i}`;
      
      // Set initial progress with song info
      setUploadProgress(prev => ({ 
        ...prev, 
        [fileId]: { 
          progress: 0, 
          name: file.name,
          artist,
          title
        }
      }));

      let duration = undefined;
      let sampleRate = undefined;
      let bitrate = undefined;
      
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        duration = audioBuffer.duration;
        sampleRate = audioBuffer.sampleRate;
        bitrate = Math.round((file.size * 8) / (duration * 1000));
        
        audioContext.close();
      } catch (error) {
        console.error('Error extracting audio metadata:', error);
      }

      const artworkUrl = await extractAlbumArtwork(file);

      const audioFile: AudioFile = {
        id: fileId,
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

      // Simulate upload progress with better visual feedback
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setUploadProgress(prev => ({ 
          ...prev, 
          [fileId]: { 
            ...prev[fileId],
            progress 
          }
        }));
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
    <div className="space-y-4">
      <Card className={`bg-slate-800/50 border-2 border-dashed transition-all duration-300 ${
        isDragOver ? 'border-blue-400 bg-blue-900/20' : 'border-slate-600'
      }`}>
        <CardContent className="p-8">
          <div
            className="text-center"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className={`transition-all duration-300 ${isDragOver ? 'scale-110' : ''}`}>
              <Upload className={`h-12 w-12 mx-auto mb-3 ${
                isDragOver ? 'text-blue-400' : 'text-slate-400'
              }`} />
            </div>
            
            <h3 className="text-xl font-semibold mb-2 text-white">
              {isDragOver ? 'Drop your audio files here' : 'Upload Your Audio Files'}
            </h3>
            
            <p className="text-slate-400 mb-4 text-sm">
              Drag and drop your music files or click to browse
            </p>
            
            <p className="text-xs text-slate-500 mb-4">
              Supported formats: MP3, WAV, FLAC, OGG, M4A
            </p>

            <Button
              onClick={handleBrowse}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
              disabled={hasUploadsInProgress}
            >
              <FileAudio className="h-4 w-4 mr-2" />
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

      {hasUploadsInProgress && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <h4 className="text-base font-semibold mb-3 text-white">Uploading Files...</h4>
            <div className="space-y-3">
              {Object.entries(uploadProgress).map(([fileId, fileData]) => (
                <div key={fileId} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileAudio className="h-3 w-3 text-blue-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {fileData.title}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          by {fileData.artist}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{fileData.progress}%</span>
                  </div>
                  <Progress value={fileData.progress} className="h-1.5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="p-4">
          <h4 className="text-base font-semibold mb-2 text-white">Tips for Best Results</h4>
          <ul className="space-y-1 text-slate-300 text-sm">
            <li className="flex items-start gap-1">
              <span className="text-blue-400 mt-0.5 text-xs">•</span>
              <span className="text-xs">Upload high-quality source files for better enhancement results</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-blue-400 mt-0.5 text-xs">•</span>
              <span className="text-xs">FLAC and WAV files provide the best quality for processing</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-blue-400 mt-0.5 text-xs">•</span>
              <span className="text-xs">You can upload multiple files at once for batch processing</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-blue-400 mt-0.5 text-xs">•</span>
              <span className="text-xs">Files are processed locally in your browser for privacy</span>
            </li>
            <li className="flex items-start gap-1">
              <span className="text-blue-400 mt-0.5 text-xs">•</span>
              <span className="text-xs">Uploaded files persist until you refresh or process them</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
