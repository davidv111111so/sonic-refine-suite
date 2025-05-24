
import { useState, useCallback } from 'react';
import { Upload, Music, Settings, Download, Play, Pause, Volume2, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UploadZone } from '@/components/UploadZone';
import { AudioFileCard } from '@/components/AudioFileCard';
import { EnhancementSettings } from '@/components/EnhancementSettings';
import { ProcessingQueue } from '@/components/ProcessingQueue';
import { useToast } from '@/hooks/use-toast';

export interface AudioFile {
  id: string;
  name: string;
  size: number;
  type: string;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  status: 'uploaded' | 'processing' | 'enhanced' | 'error';
  progress?: number;
  originalFile: File;
  enhancedUrl?: string;
}

const Index = () => {
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFilesUploaded = useCallback((files: AudioFile[]) => {
    setAudioFiles(prev => [...prev, ...files]);
    toast({
      title: "Files uploaded successfully",
      description: `${files.length} audio files added to your collection`,
    });
  }, [toast]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setAudioFiles(prev => prev.filter(file => file.id !== fileId));
  }, []);

  const handleEnhanceFiles = useCallback(async (settings: any) => {
    setIsProcessing(true);
    const filesToProcess = audioFiles.filter(file => file.status === 'uploaded');
    
    // Simulate processing
    for (const file of filesToProcess) {
      setAudioFiles(prev => prev.map(f => 
        f.id === file.id ? { ...f, status: 'processing' as const, progress: 0 } : f
      ));

      // Simulate progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setAudioFiles(prev => prev.map(f => 
          f.id === file.id ? { ...f, progress: i } : f
        ));
      }

      setAudioFiles(prev => prev.map(f => 
        f.id === file.id ? { 
          ...f, 
          status: 'enhanced' as const, 
          progress: 100,
          enhancedUrl: URL.createObjectURL(file.originalFile) // Placeholder
        } : f
      ));
    }

    setIsProcessing(false);
    toast({
      title: "Enhancement complete!",
      description: `${filesToProcess.length} files have been enhanced successfully`,
    });
  }, [audioFiles, toast]);

  const stats = {
    total: audioFiles.length,
    uploaded: audioFiles.filter(f => f.status === 'uploaded').length,
    processing: audioFiles.filter(f => f.status === 'processing').length,
    enhanced: audioFiles.filter(f => f.status === 'enhanced').length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Volume2 className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Audio Enhancer Pro
            </h1>
          </div>
          <p className="text-slate-300 text-lg">
            Transform your music collection with professional-grade audio enhancement
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileAudio className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                  <p className="text-slate-400 text-sm">Total Files</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Upload className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.uploaded}</p>
                  <p className="text-slate-400 text-sm">Ready to Process</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-yellow-400 animate-spin" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.processing}</p>
                  <p className="text-slate-400 text-sm">Processing</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Download className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">{stats.enhanced}</p>
                  <p className="text-slate-400 text-sm">Enhanced</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600">
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-blue-600">
              <Music className="h-4 w-4 mr-2" />
              Library
            </TabsTrigger>
            <TabsTrigger value="enhance" className="data-[state=active]:bg-blue-600">
              <Settings className="h-4 w-4 mr-2" />
              Enhance
            </TabsTrigger>
            <TabsTrigger value="queue" className="data-[state=active]:bg-blue-600">
              <Download className="h-4 w-4 mr-2" />
              Queue
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <UploadZone onFilesUploaded={handleFilesUploaded} />
          </TabsContent>

          <TabsContent value="library" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {audioFiles.map((file) => (
                <AudioFileCard
                  key={file.id}
                  file={file}
                  onRemove={handleRemoveFile}
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
          </TabsContent>

          <TabsContent value="enhance" className="mt-6">
            <EnhancementSettings
              onEnhance={handleEnhanceFiles}
              isProcessing={isProcessing}
              hasFiles={stats.uploaded > 0}
            />
          </TabsContent>

          <TabsContent value="queue" className="mt-6">
            <ProcessingQueue files={audioFiles} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
