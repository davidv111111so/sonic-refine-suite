import { Download, CheckCircle, Clock, AlertCircle, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AudioFile } from '@/pages/Index';

interface ProcessingQueueProps {
  files: AudioFile[];
}

export const ProcessingQueue = ({ files }: ProcessingQueueProps) => {
  const processingFiles = files.filter(file => file.status === 'processing');
  const completedFiles = files.filter(file => file.status === 'enhanced');
  const queuedFiles = files.filter(file => file.status === 'uploaded');
  const errorFiles = files.filter(file => file.status === 'error');

  const downloadAll = () => {
    completedFiles.forEach(file => {
      if (file.enhancedUrl) {
        const a = document.createElement('a');
        a.href = file.enhancedUrl;
        a.download = `enhanced_${file.name}`;
        a.click();
      }
    });
  };

  const getStatusIcon = (status: AudioFile['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-400 animate-pulse" />;
      case 'enhanced':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'uploaded':
        return <Clock className="h-4 w-4 text-blue-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <FileAudio className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusText = (status: AudioFile['status']) => {
    switch (status) {
      case 'processing': return 'Processing';
      case 'enhanced': return 'Complete';
      case 'uploaded': return 'Queued';
      case 'error': return 'Failed';
      default: return 'Unknown';
    }
  };

  if (files.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-12 text-center">
          <FileAudio className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Files in Queue</h3>
          <p className="text-slate-400">Upload and process some audio files to see them here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Queue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">{processingFiles.length}</div>
            <div className="text-sm text-slate-400">Processing</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">{queuedFiles.length}</div>
            <div className="text-sm text-slate-400">Queued</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{completedFiles.length}</div>
            <div className="text-sm text-slate-400">Completed</div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{errorFiles.length}</div>
            <div className="text-sm text-slate-400">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Download All Button */}
      {completedFiles.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white">Download Enhanced Files</h3>
                <p className="text-sm text-slate-400">
                  {completedFiles.length} files ready for download
                </p>
              </div>
              <Button
                onClick={downloadAll}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Processing Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {files.map((file, index) => (
            <div key={file.id}>
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getStatusIcon(file.status)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{file.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-xs text-slate-400">
                        {(file.size / 1024 / 1024).toFixed(1)} MB
                        {file.enhancedSize && (
                          <> → {(file.enhancedSize / 1024 / 1024).toFixed(1)} MB</>
                        )}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {getStatusText(file.status)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {file.status === 'processing' && (
                    <div className="w-40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">
                          {file.processingStage || 'Processing...'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {file.progress || 0}%
                        </span>
                      </div>
                      <Progress value={file.progress || 0} className="h-2" />
                    </div>
                  )}
                  
                  {file.status === 'enhanced' && (
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-xs text-green-400">Enhanced</div>
                        <div className="text-xs text-slate-400">
                          +{file.enhancedSize && file.size ? 
                            ((file.enhancedSize - file.size) / file.size * 100).toFixed(0) : 0}%
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (file.enhancedUrl) {
                            const a = document.createElement('a');
                            a.href = file.enhancedUrl;
                            a.download = `enhanced_${file.name}`;
                            a.click();
                          }
                        }}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {index < files.length - 1 && (
                <Separator className="bg-slate-600" />
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Processing Tips */}
      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="p-6">
          <h4 className="text-lg font-semibold mb-3 text-white">Processing Information</h4>
          <ul className="space-y-2 text-slate-300 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              Files are processed with real audio enhancement algorithms
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              Processing time depends on file size and selected enhancement options
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              Progress is tracked in real-time with detailed stage information
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400 mt-1">•</span>
              Enhanced files show actual quality improvements and size changes
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
