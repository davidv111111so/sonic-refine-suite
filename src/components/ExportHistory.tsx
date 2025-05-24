
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, History, FileCheck, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportHistoryItem {
  id: string;
  fileName: string;
  originalFileName: string;
  timestamp: Date;
  settings: Record<string, any>;
  filePath: string;
  fileSize: number;
}

interface ExportHistoryProps {
  history: ExportHistoryItem[];
  onClearHistory?: () => void;
}

export const ExportHistory = ({ history = [], onClearHistory }: ExportHistoryProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  
  // Sort history by most recent first
  const sortedHistory = [...history].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  );

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copySettingsToClipboard = (settings: Record<string, any>) => {
    navigator.clipboard.writeText(JSON.stringify(settings, null, 2));
    toast({
      title: "Settings copied",
      description: "Enhancement settings have been copied to clipboard",
    });
  };

  // In a real app, we would have actual history, but for now we'll create some mock data
  const mockHistory: ExportHistoryItem[] = [
    {
      id: '1',
      fileName: 'Enhanced_Song.mp3',
      originalFileName: 'Song.mp3',
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      settings: {
        targetBitrate: 320,
        noiseReduction: true,
        normalization: true,
        outputFormat: 'mp3'
      },
      filePath: 'So/Enhanced_Song.mp3',
      fileSize: 4580000
    },
    {
      id: '2',
      fileName: 'Enhanced_Podcast.mp3',
      originalFileName: 'Podcast.mp3',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      settings: {
        targetBitrate: 192,
        noiseReduction: true,
        normalization: true,
        outputFormat: 'mp3'
      },
      filePath: 'So/Enhanced_Podcast.mp3',
      fileSize: 12800000
    },
    {
      id: '3',
      fileName: 'Enhanced_Classical.flac',
      originalFileName: 'Classical.wav',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      settings: {
        targetBitrate: 320,
        noiseReduction: false,
        normalization: true,
        outputFormat: 'flac'
      },
      filePath: 'So/Enhanced_Classical.flac',
      fileSize: 28900000
    }
  ];

  const combinedHistory = [...sortedHistory, ...mockHistory];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-white">
          <History className="h-5 w-5" />
          Enhancement History
        </CardTitle>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearHistory}
          className="text-slate-400 hover:text-slate-300"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700">
            <TabsTrigger value="list" className="data-[state=active]:bg-blue-600">
              List
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600">
              Stats
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="list" className="mt-4">
            {combinedHistory.length === 0 ? (
              <div className="text-center py-8">
                <FileCheck className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400">No enhancement history yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {combinedHistory.map((item) => (
                  <div key={item.id} className="bg-slate-700/50 rounded p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-white truncate">{item.fileName}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Original: {item.originalFileName}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-slate-400">
                        {formatFileSize(item.fileSize)}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-blue-400 hover:text-blue-300"
                          onClick={() => copySettingsToClipboard(item.settings)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Settings
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-green-400 hover:text-green-300"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="stats" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <p className="text-sm text-slate-400">Total Files</p>
                <p className="text-2xl font-bold text-white">{combinedHistory.length}</p>
              </div>
              
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <p className="text-sm text-slate-400">Total Size</p>
                <p className="text-2xl font-bold text-white">
                  {formatFileSize(combinedHistory.reduce((total, item) => total + item.fileSize, 0))}
                </p>
              </div>
              
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <p className="text-sm text-slate-400">MP3 Files</p>
                <p className="text-2xl font-bold text-white">
                  {combinedHistory.filter(item => item.fileName.endsWith('.mp3')).length}
                </p>
              </div>
              
              <div className="bg-slate-700/50 rounded p-3 text-center">
                <p className="text-sm text-slate-400">FLAC Files</p>
                <p className="text-2xl font-bold text-white">
                  {combinedHistory.filter(item => item.fileName.endsWith('.flac')).length}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
