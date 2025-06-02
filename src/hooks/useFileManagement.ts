import { useState, useCallback, useEffect } from 'react';
import { AudioFile } from '@/types/audio';
import { useToast } from '@/hooks/use-toast';

const STORAGE_KEY = 'audioEnhancer_files';

export const useFileManagement = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const { toast } = useToast();

  // Load saved files from localStorage on component mount
  useEffect(() => {
    const savedFiles = localStorage.getItem(STORAGE_KEY);
    if (savedFiles) {
      try {
        const parsedFiles: AudioFile[] = JSON.parse(savedFiles);
        // Filter out enhanced and error files, keep only uploaded ones
        const uploadedFiles = parsedFiles.filter(file => file.status === 'uploaded');
        
        // Recreate file objects and URLs for uploaded files
        const restoredFiles = uploadedFiles.map(file => {
          // Note: We can't restore the actual File object from localStorage
          // but we keep the metadata for display purposes
          return {
            ...file,
            originalFile: new File([], file.name, { type: file.type }),
            originalUrl: undefined // Will need to be re-uploaded for processing
          };
        });
        
        setAudioFiles(restoredFiles);
        
        if (restoredFiles.length > 0) {
          toast({
            title: "Files restored",
            description: `${restoredFiles.length} uploaded files restored from previous session`,
          });
        }
      } catch (error) {
        console.error('Error loading saved files:', error);
      }
    }
  }, [toast]);

  // Save files to localStorage whenever audioFiles changes
  useEffect(() => {
    // Only save files that are uploaded (not processed ones)
    const filesToSave = audioFiles.filter(file => file.status === 'uploaded').map(file => ({
      ...file,
      originalFile: undefined, // Can't serialize File objects
      originalUrl: undefined, // Can't serialize blob URLs
      enhancedUrl: undefined
    }));
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filesToSave));
  }, [audioFiles]);

  const handleFilesUploaded = useCallback((files: AudioFile[]) => {
    const processedFiles = files.map(file => {
      const originalUrl = URL.createObjectURL(file.originalFile);
      
      let artist = "Unknown Artist";
      let title = file.name;
      
      // Enhanced filename parsing for better song name extraction
      const nameWithoutExt = file.name.replace(/\.[^.]+$/, '');
      
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
      
      return {
        ...file,
        originalUrl,
        artist,
        title
      };
    });
    
    setAudioFiles(prev => [...prev, ...processedFiles]);
    toast({
      title: "Files uploaded successfully",
      description: `${files.length} audio files added to your collection`,
    });
  }, [toast]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setAudioFiles(prev => {
      const fileToRemove = prev.find(file => file.id === fileId);
      
      if (fileToRemove?.originalUrl) {
        URL.revokeObjectURL(fileToRemove.originalUrl);
      }
      if (fileToRemove?.enhancedUrl) {
        URL.revokeObjectURL(fileToRemove.enhancedUrl);
      }
      
      return prev.filter(file => file.id !== fileId);
    });
  }, []);

  const handleUpdateFile = useCallback((fileId: string, updates: Partial<AudioFile>) => {
    setAudioFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, ...updates } : file
    ));
    
    toast({
      title: "File updated",
      description: "The file information has been updated",
    });
  }, [toast]);

  return {
    audioFiles,
    setAudioFiles,
    handleFilesUploaded,
    handleRemoveFile,
    handleUpdateFile
  };
};
