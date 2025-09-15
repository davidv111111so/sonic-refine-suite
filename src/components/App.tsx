import React, { useState, useCallback } from 'react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { FileUpload } from './FileUpload';
import { MainContent } from './MainContent';
import { useAudioProcessor } from '@/hooks/useAudioProcessor';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, Upload } from 'lucide-react';

export const App: React.FC = () => {
  const { toast } = useToast();
  const {
    tracks,
    addTrack,
    removeTrack,
    clearTracks,
    exportTrackAsWav,
    isProcessing
  } = useAudioProcessor();

  const [selectedTrackId, setSelectedTrackId] = useState<string>();

  // Handle file upload
  const handleFilesAdded = useCallback(async (files: File[]) => {
    toast({
      title: "Processing Files",
      description: `Processing ${files.length} audio files...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        const trackId = await addTrack(file);
        successCount++;
        
        // Auto-select first track
        if (!selectedTrackId) {
          setSelectedTrackId(trackId);
        }
      } catch (error) {
        errorCount++;
        console.error(`Failed to process ${file.name}:`, error);
      }
    }

    toast({
      title: "Upload Complete",
      description: `${successCount} files processed successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
  }, [addTrack, selectedTrackId, toast]);

  // Handle track selection
  const handleTrackSelect = useCallback((trackId: string) => {
    setSelectedTrackId(trackId);
  }, []);

  // Handle track removal
  const handleTrackRemove = useCallback((trackId: string) => {
    removeTrack(trackId);
    
    // Clear selection if removed track was selected
    if (selectedTrackId === trackId) {
      setSelectedTrackId(undefined);
    }

    toast({
      title: "Track Removed",
      description: "Track has been removed from the list.",
    });
  }, [removeTrack, selectedTrackId, toast]);

  // Handle track export
  const handleTrackExport = useCallback(async (trackId: string) => {
    try {
      const track = tracks.find(t => t.id === trackId);
      if (!track) return;

      toast({
        title: "Exporting...",
        description: `Exporting ${track.name} as WAV file...`,
      });

      const blob = await exportTrackAsWav(trackId);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${track.name.replace(/\.[^.]+$/, '')}_exported.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export Complete",
        description: `${track.name} has been exported as WAV file.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export track. Please try again.",
        variant: "destructive"
      });
    }
  }, [tracks, exportTrackAsWav, toast]);

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gradient-to-br from-black via-blue-950 to-black text-white">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Audio Processing Studio
            </h1>
            <p className="text-slate-400">
              Professional audio enhancement with Web Audio API
            </p>
          </div>

          {/* File Upload Section */}
          <div className="mb-8">
            <Card className="bg-slate-800/50 border-slate-600">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-cyan-400">
                  <Upload className="h-5 w-5" />
                  File Upload
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesAdded={handleFilesAdded}
                  maxFiles={20}
                  maxSize={100 * 1024 * 1024} // 100MB
                />
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          {tracks.length > 0 ? (
            <MainContent
              tracks={tracks}
              selectedTrackId={selectedTrackId}
              onTrackSelect={handleTrackSelect}
              onTrackRemove={handleTrackRemove}
              onTrackExport={handleTrackExport}
              isProcessing={isProcessing}
            />
          ) : (
            <Card className="bg-slate-800/50 border-slate-600">
              <CardContent className="text-center py-12">
                <Music className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Audio Files Yet
                </h3>
                <p className="text-slate-400">
                  Upload your audio files to get started with professional audio processing
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </LanguageProvider>
  );
};