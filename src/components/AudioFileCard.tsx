
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AudioFileHeader } from '@/components/AudioFileHeader';
import { AudioFileInfo } from '@/components/AudioFileInfo';
import { AudioFile } from '@/types/audio';
import { AlertCircle, CheckCircle, Download, RefreshCw, Music } from 'lucide-react';

interface AudioFileCardProps {
  file: AudioFile;
  onRemove: (fileId: string) => void;
  onUpdate: (fileId: string, updates: Partial<AudioFile>) => void;
}

export const AudioFileCard = ({ file, onRemove, onUpdate }: AudioFileCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const handleRetry = () => {
    onUpdate(file.id, { status: 'uploaded', progress: 0, processingStage: undefined });
  };

  const handleDownload = () => {
    if (file.enhancedUrl) {
      const a = document.createElement('a');
      a.href = file.enhancedUrl;
      a.download = `enhanced_${file.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'uploaded': return 'bg-blue-500/20 border-blue-500/30 text-blue-300';
      case 'processing': return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-300';
      case 'enhanced': return 'bg-green-500/20 border-green-500/30 text-green-300';
      case 'error': return 'bg-red-500/20 border-red-500/30 text-red-300';
      default: return 'bg-slate-500/20 border-slate-500/30 text-slate-300';
    }
  };

  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploaded': return <Music className="h-4 w-4" />;
      case 'processing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'enhanced': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <Music className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
      <AudioFileHeader file={file} onRemove={onRemove} onUpdate={onUpdate} />
      <CardContent className="p-4">
        <AudioFileInfo file={file} />
        <Separator className="bg-slate-600 my-3" />
        
        <div className="space-y-3">
          {/* Status Badge with Enhanced Styling */}
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getStatusColor()}`}>
              {getStatusIcon()}
              <span className="text-sm font-medium capitalize">
                {file.status === 'uploaded' ? 'Ready to enhance' : file.status}
              </span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {file.status === 'error' && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white h-8 px-3"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Retry
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-800 text-white border-slate-600">
                      <p>Try enhancing this file again</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {file.status === 'enhanced' && file.enhancedUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="bg-green-700 border-green-600 hover:bg-green-600 text-white h-8 px-3"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              )}
            </div>
          </div>

          {/* Processing Progress */}
          {file.status === 'processing' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Processing Progress</span>
                <span className="text-xs text-blue-400 font-medium">{file.progress?.toFixed(0)}%</span>
              </div>
              <Progress value={file.progress} className="h-2" />
              {file.processingStage && (
                <p className="text-xs text-slate-400 italic">{file.processingStage}</p>
              )}
            </div>
          )}

          {/* Enhanced File Info */}
          {file.status === 'enhanced' && (
            <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-300">Enhancement Complete</span>
                <CheckCircle className="h-4 w-4 text-green-400" />
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400">Original:</span>
                  <span className="text-white ml-1">{formatFileSize(file.size)}</span>
                </div>
                <div>
                  <span className="text-slate-400">Enhanced:</span>
                  <span className="text-green-300 ml-1 font-medium">
                    {file.enhancedSize ? formatFileSize(file.enhancedSize) : 'N/A'}
                  </span>
                </div>
              </div>
              {file.enhancedSize && (
                <div className="text-xs text-slate-400">
                  Quality improvement: {((file.enhancedSize / file.size - 1) * 100).toFixed(1)}% size increase
                </div>
              )}
            </div>
          )}

          {/* Error Details */}
          {file.status === 'error' && (
            <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-300">Enhancement Failed</span>
                <AlertCircle className="h-4 w-4 text-red-400" />
              </div>
              <div className="text-xs text-slate-300">
                <p>The audio enhancement process encountered an error.</p>
                <p className="mt-1 text-slate-400">
                  Common fixes: Check file format, ensure file isn't corrupted, or try again.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
