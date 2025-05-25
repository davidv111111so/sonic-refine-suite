
import { useState } from 'react';
import { Play, Pause, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioFile } from '@/pages/Index';

interface AudioFileActionsProps {
  file: AudioFile;
  onRemove: (fileId: string) => void;
  onUpdate?: (fileId: string, updates: Partial<AudioFile>) => void;
  onSetActiveDialog: (dialog: string | null) => void;
}

export const AudioFileActions = ({ file, onRemove, onUpdate, onSetActiveDialog }: AudioFileActionsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleDownload = () => {
    if (file.enhancedUrl) {
      const a = document.createElement('a');
      a.href = file.enhancedUrl;
      a.download = `So/enhanced_${file.name}`;
      a.click();
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-4">
      {/* Main Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlayPause}
          className="text-slate-400 hover:text-white"
        >
          {isPlaying ? (
            <Pause className="h-4 w-4 mr-1" />
          ) : (
            <Play className="h-4 w-4 mr-1" />
          )}
          {isPlaying ? "Pause" : "Play"}
        </Button>

        <div className="flex items-center gap-1">
          {file.status === 'enhanced' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="text-green-400 hover:text-green-300"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(file.id)}
            className="text-red-400 hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Additional Actions */}
      <div className="grid grid-cols-3 gap-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSetActiveDialog('comparison')}
          className="bg-slate-700 border-slate-600 text-xs text-slate-300 h-8"
          disabled={file.status !== 'enhanced'}
        >
          A/B Compare
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSetActiveDialog('tags')}
          className="bg-slate-700 border-slate-600 text-xs text-slate-300 h-8"
        >
          Edit Tags
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSetActiveDialog('analysis')}
          className="bg-slate-700 border-slate-600 text-xs text-slate-300 h-8"
        >
          Analysis
        </Button>
      </div>
    </div>
  );
};
