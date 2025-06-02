import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AudioFileHeader } from '@/components/AudioFileHeader';
import { AudioFileInfo } from '@/components/AudioFileInfo';
import { AudioFile } from '@/types/audio';

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

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <AudioFileHeader file={file} onRemove={onRemove} onUpdate={onUpdate} />
      <CardContent className="p-4">
        <AudioFileInfo file={file} />
        <Separator className="bg-slate-600 my-3" />
        <div className="space-y-2">
          {file.status === 'uploaded' && (
            <Badge variant="secondary">Ready to enhance</Badge>
          )}
          {file.status === 'processing' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Badge variant="outline">Processing</Badge>
                <span className="text-xs text-slate-400">{file.progress?.toFixed(0)}%</span>
              </div>
              <Progress value={file.progress} />
              {file.processingStage && (
                <p className="text-xs text-slate-500">{file.processingStage}</p>
              )}
            </div>
          )}
          {file.status === 'enhanced' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Badge variant="success">Enhanced</Badge>
              </div>
              <p className="text-xs text-green-400">Ready for download</p>
            </div>
          )}
          {file.status === 'error' && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Badge variant="destructive">Error</Badge>
              </div>
              <p className="text-xs text-red-400">Failed to enhance</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
