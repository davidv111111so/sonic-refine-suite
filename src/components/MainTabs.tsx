
import { Upload, Music, Settings, Download, Radio, History, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { UploadZone } from '@/components/UploadZone';
import { AudioFileCard } from '@/components/AudioFileCard';
import { EnhancementSettings } from '@/components/EnhancementSettings';
import { ProcessingQueue } from '@/components/ProcessingQueue';
import { MediaPlayer } from '@/components/MediaPlayer';
import { ExportHistory } from '@/components/ExportHistory';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AudioFile } from '@/types/audio';

interface MainTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  audioFiles: AudioFile[];
  onFilesUploaded: (files: AudioFile[]) => void;
  onRemoveFile: (fileId: string) => void;
  onUpdateFile: (fileId: string, updates: Partial<AudioFile>) => void;
  onEnhanceFiles: (settings: any) => void;
  isProcessing: boolean;
  hasFiles: boolean;
  onSaveLocationChange: (location: string | FileSystemDirectoryHandle) => void;
  history: any[];
  onClearHistory: () => void;
}

export const MainTabs = ({
  activeTab,
  setActiveTab,
  audioFiles,
  onFilesUploaded,
  onRemoveFile,
  onUpdateFile,
  onEnhanceFiles,
  isProcessing,
  hasFiles,
  onSaveLocationChange,
  history,
  onClearHistory
}: MainTabsProps) => {
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-6 bg-slate-800 border-slate-700 h-9">
        <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600 text-xs">
          <Upload className="h-3 w-3 mr-1" />
          Upload
        </TabsTrigger>
        <TabsTrigger value="library" className="data-[state=active]:bg-blue-600 text-xs">
          <Music className="h-3 w-3 mr-1" />
          Library
        </TabsTrigger>
        <TabsTrigger value="enhance" className="data-[state=active]:bg-blue-600 text-xs">
          <Settings className="h-3 w-3 mr-1" />
          Enhance
        </TabsTrigger>
        <TabsTrigger value="queue" className="data-[state=active]:bg-blue-600 text-xs">
          <Download className="h-3 w-3 mr-1" />
          Queue
        </TabsTrigger>
        <TabsTrigger value="player" className="data-[state=active]:bg-blue-600 text-xs">
          <Radio className="h-3 w-3 mr-1" />
          Player
        </TabsTrigger>
        <TabsTrigger value="history" className="data-[state=active]:bg-blue-600 text-xs">
          <History className="h-3 w-3 mr-1" />
          History
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-6">
        <ErrorBoundary>
          <UploadZone onFilesUploaded={onFilesUploaded} />
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="library" className="mt-6">
        <ErrorBoundary>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {audioFiles.map((file) => (
              <AudioFileCard
                key={file.id}
                file={file}
                onRemove={onRemoveFile}
              />
            ))}
            {audioFiles.length === 0 && (
              <div className="col-span-full text-center py-12">
                <Music className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No audio files uploaded yet</p>
                <p className="text-slate-500">Upload some files to get started</p>
              </div>
            )}
          </div>
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="enhance" className="mt-6 space-y-6">
        <ErrorBoundary 
          fallback={
            <Card className="bg-red-900/20 border-red-500/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-300">Enhancement Settings Error</h3>
                    <p className="text-red-200 text-sm">
                      There was an error loading the enhancement settings. Please refresh the page.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          }
        >
          <EnhancementSettings
            onEnhance={onEnhanceFiles}
            isProcessing={isProcessing}
            hasFiles={hasFiles}
            onSaveLocationChange={onSaveLocationChange}
          />
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="queue" className="mt-6">
        <ErrorBoundary>
          <ProcessingQueue files={audioFiles} />
        </ErrorBoundary>
      </TabsContent>

      <TabsContent value="player" className="mt-6">
        <ErrorBoundary>
          <MediaPlayer />
        </ErrorBoundary>
      </TabsContent>
      
      <TabsContent value="history" className="mt-6">
        <ErrorBoundary>
          <ExportHistory 
            history={history} 
            onClearHistory={onClearHistory} 
          />
        </ErrorBoundary>
      </TabsContent>
    </Tabs>
  );
};
