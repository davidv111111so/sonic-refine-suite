
import { useState, useCallback, useEffect } from 'react';
import { AudioFile } from '@/types/audio';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'audioEnhancer_files';
const STORAGE_VERSION = '2.0'; // Version for migration compatibility

interface StoredFileData {
  version: string;
  files: Partial<AudioFile>[];
  timestamp: number;
}

export const useFileManagement = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const { toast } = useToast();

  // Enhanced file loading with error handling and migration
  useEffect(() => {
    const loadStoredFiles = () => {
      try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (!savedData) return;

        const parsedData: StoredFileData = JSON.parse(savedData);
        
        // Check if data is recent (within 7 days) to avoid stale data
        const isRecent = parsedData.timestamp && (Date.now() - parsedData.timestamp) < 7 * 24 * 60 * 60 * 1000;
        
        if (!isRecent) {
          console.log('Clearing old stored files (older than 7 days)');
          localStorage.removeItem(STORAGE_KEY);
          return;
        }

        // Only restore uploaded files (not processed ones)
        const uploadedFiles = parsedData.files.filter(file => 
          file.status === 'uploaded' && file.name && file.size
        );
        
        if (uploadedFiles.length === 0) return;

        // Recreate file objects with safe defaults
        const restoredFiles: AudioFile[] = uploadedFiles.map(file => ({
          id: file.id || generateFileId(),
          name: file.name || 'Unknown File',
          size: file.size || 0,
          type: file.type || 'audio/*',
          duration: file.duration,
          bitrate: file.bitrate,
          sampleRate: file.sampleRate,
          status: 'uploaded' as const,
          originalFile: new File([], file.name || 'unknown', { type: file.type || 'audio/*' }),
          artist: file.artist || 'Unknown Artist',
          title: file.title || file.name?.replace(/\.[^.]+$/, '') || 'Unknown Title'
        }));
        
        setAudioFiles(restoredFiles);
        
        toast({
          title: "Files restored",
          description: `${restoredFiles.length} files restored from previous session`,
        });
      } catch (error) {
        console.error('Error loading saved files:', error);
        // Clear corrupted data
        localStorage.removeItem(STORAGE_KEY);
        toast({
          title: "Storage error",
          description: "Previous session data was corrupted and has been cleared",
          variant: "destructive"
        });
      }
    };

    loadStoredFiles();
  }, [toast]);

  // Enhanced file saving with versioning and error handling
  useEffect(() => {
    const saveFiles = () => {
      try {
        // Only save uploaded files to avoid storing large processed data
        const filesToSave = audioFiles
          .filter(file => file.status === 'uploaded')
          .map(file => ({
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
            duration: file.duration,
            bitrate: file.bitrate,
            sampleRate: file.sampleRate,
            status: file.status,
            artist: file.artist,
            title: file.title
          }));
        
        const dataToSave: StoredFileData = {
          version: STORAGE_VERSION,
          files: filesToSave,
          timestamp: Date.now()
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error saving files:', error);
        // Storage might be full - try to clear old data
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (clearError) {
          console.error('Could not clear storage:', clearError);
        }
      }
    };

    // Debounce saves to avoid excessive localStorage writes
    const timeoutId = setTimeout(saveFiles, 1000);
    return () => clearTimeout(timeoutId);
  }, [audioFiles]);

  const generateFileId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const parseAudioFileName = (fileName: string) => {
    let artist = "Unknown Artist";
    let title = fileName;
    
    // Enhanced filename parsing for better song name extraction
    const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
    
    // Try different patterns for artist - title separation
    const patterns = [
      /^(.*?)\s*-\s*(.*)$/, // Artist - Title
      /^(.*?)\s*–\s*(.*)$/, // Artist – Title (em dash)
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

  const handleFilesUploaded = useCallback((files: AudioFile[]) => {
    const processedFiles = files.map(file => {
      const originalUrl = URL.createObjectURL(file.originalFile);
      const { artist, title } = parseAudioFileName(file.name);
      
      return {
        ...file,
        id: file.id || generateFileId(),
        originalUrl,
        artist,
        title,
        status: 'uploaded' as const
      };
    });
    
    setAudioFiles(prev => {
      // Check for duplicates based on name and size
      const existing = new Set(prev.map(f => `${f.name}-${f.size}`));
      const newFiles = processedFiles.filter(f => 
        !existing.has(`${f.name}-${f.size}`)
      );
      
      if (newFiles.length < processedFiles.length) {
        toast({
          title: "Duplicate files detected",
          description: `${processedFiles.length - newFiles.length} files were already in your library`,
        });
      }
      
      if (newFiles.length > 0) {
        toast({
          title: "Files uploaded successfully",
          description: `${newFiles.length} new audio files added to your collection`,
        });
      }
      
      return [...prev, ...newFiles];
    });
  }, [toast]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setAudioFiles(prev => {
      const fileToRemove = prev.find(file => file.id === fileId);
      
      // Clean up URLs to prevent memory leaks
      if (fileToRemove?.originalUrl) {
        try {
          URL.revokeObjectURL(fileToRemove.originalUrl);
        } catch (error) {
          console.warn('Error revoking URL:', error);
        }
      }
      if (fileToRemove?.enhancedUrl) {
        try {
          URL.revokeObjectURL(fileToRemove.enhancedUrl);
        } catch (error) {
          console.warn('Error revoking URL:', error);
        }
      }
      
      return prev.filter(file => file.id !== fileId);
    });

    toast({
      title: "File removed",
      description: "The file has been removed from your library",
    });
  }, [toast]);

  const handleUpdateFile = useCallback((fileId: string, updates: Partial<AudioFile>) => {
    setAudioFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, ...updates } : file
    ));
  }, []);

  // Clear all files
  const handleClearAllFiles = useCallback(() => {
    audioFiles.forEach(file => {
      if (file.originalUrl) {
        try {
          URL.revokeObjectURL(file.originalUrl);
        } catch (error) {
          console.warn('Error revoking URL:', error);
        }
      }
      if (file.enhancedUrl) {
        try {
          URL.revokeObjectURL(file.enhancedUrl);
        } catch (error) {
          console.warn('Error revoking URL:', error);
        }
      }
    });

    setAudioFiles([]);
    localStorage.removeItem(STORAGE_KEY);
    
    toast({
      title: "Library cleared",
      description: "All files have been removed from your library",
    });
  }, [audioFiles, toast]);

  return {
    audioFiles,
    setAudioFiles,
    handleFilesUploaded,
    handleRemoveFile,
    handleUpdateFile,
    handleClearAllFiles
  };
};
