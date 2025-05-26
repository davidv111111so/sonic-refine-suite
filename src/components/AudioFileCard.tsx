
import { useState } from 'react';
import { Play, Pause, Download, Trash2, Edit2, FileAudio, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AudioMiniPlayer } from '@/components/AudioMiniPlayer';
import { AudioFile } from '@/pages/Index';
import { ID3TagEditor } from './ID3TagEditor';

interface AudioFileCardProps {
  file: AudioFile;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<AudioFile>) => void;
}

export const AudioFileCard = ({ file, onRemove, onUpdate }: AudioFileCardProps) => {
  const [showTagEditor, setShowTagEditor] = useState(false);

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getSizeComparison = () => {
    if (!file.enhancedSize || file.status !== 'enhanced') return null;
    
    const increase = file.enhancedSize - file.size;
    const percentage = ((increase / file.size) * 100);
    
    return {
      increase,
      percentage,
      isIncrease: increase > 0
    };
  };

  const sizeComparison = getSizeComparison();

  const getStatusColor = () => {
    switch (file.status) {
      case 'uploaded': return 'bg-blue-500';
      case 'processing': return 'bg-yellow-500';
      case 'enhanced': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case 'uploaded': return 'Ready';
      case 'processing': return 'Processing';
      case 'enhanced': return 'Enhanced';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  const handleDownload = () => {
    if (file.enhancedUrl) {
      const a = document.createElement('a');
      a.href = file.enhancedUrl;
      a.download = `enhanced_${file.name}`;
      a.click();
    }
  };

  const handleTagUpdate = (updates: Partial<AudioFile>) => {
    onUpdate(file.id, updates);
    setShowTagEditor(false);
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-slate-700 rounded-lg">
                <FileAudio className="h-5 w-5 text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-white text-base truncate">
                  {file.title || file.name}
                </CardTitle>
                {file.artist && (
                  <p className="text-slate-400 text-sm truncate">{file.artist}</p>
                )}
              </div>
            </div>
            <Badge className={`${getStatusColor()} text-white text-xs`}>
              {getStatusText()}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          {/* File Info */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Original Size:</span>
              <span className="text-slate-300">{formatFileSize(file.size)}</span>
            </div>
            
            {sizeComparison && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Enhanced Size:</span>
                <span className="text-slate-300 flex items-center gap-1">
                  {formatFileSize(file.enhancedSize!)}
                  {sizeComparison.isIncrease ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                  <span className={sizeComparison.isIncrease ? 'text-green-400' : 'text-red-400'}>
                    {sizeComparison.isIncrease ? '+' : ''}{sizeComparison.percentage.toFixed(1)}%
                  </span>
                </span>
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Type:</span>
              <span className="text-slate-300">{file.type}</span>
            </div>
            
            {file.duration && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Duration:</span>
                <span className="text-slate-300">
                  {Math.floor(file.duration / 60)}:{Math.floor(file.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar for Processing */}
          {file.status === 'processing' && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Processing...</span>
                <span className="text-slate-300">{file.progress || 0}%</span>
              </div>
              <Progress value={file.progress || 0} className="h-2" />
            </div>
          )}

          {/* Audio Player */}
          <AudioMiniPlayer file={file} />

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTagEditor(true)}
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white flex-1"
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
            
            {file.status === 'enhanced' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="bg-green-700 border-green-600 hover:bg-green-600 text-white flex-1"
              >
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemove(file.id)}
              className="bg-red-700 border-red-600 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ID3 Tag Editor Modal */}
      {showTagEditor && (
        <ID3TagEditor
          file={file}
          onSave={handleTagUpdate}
          onCancel={() => setShowTagEditor(false)}
        />
      )}
    </>
  );
};
