
import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AudioFile } from '@/pages/Index';
import { AudioComparison } from './AudioComparison';
import { ID3TagEditor } from './ID3TagEditor';
import { AudioAnalysis } from './AudioAnalysis';
import { AudioFileHeader } from './AudioFileHeader';
import { AudioMiniPlayer } from './AudioMiniPlayer';
import { AudioFileInfo } from './AudioFileInfo';
import { AudioFileActions } from './AudioFileActions';

interface AudioFileCardProps {
  file: AudioFile;
  onRemove: (fileId: string) => void;
  onUpdate?: (fileId: string, updates: Partial<AudioFile>) => void;
}

export const AudioFileCard = ({ file, onRemove, onUpdate }: AudioFileCardProps) => {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const handleUpdateFile = (fileId: string, updates: Partial<AudioFile>) => {
    if (onUpdate) {
      onUpdate(fileId, updates);
    }
    setActiveDialog(null);
  };

  return (
    <>
      <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-all duration-200">
        <CardHeader className="pb-3">
          <AudioFileHeader file={file} />
        </CardHeader>

        <CardContent className="space-y-4">
          <AudioFileInfo file={file} />
          <AudioMiniPlayer file={file} />
          <AudioFileActions 
            file={file} 
            onRemove={onRemove} 
            onUpdate={onUpdate}
            onSetActiveDialog={setActiveDialog}
          />
        </CardContent>
      </Card>

      {/* Audio Comparison Dialog */}
      <Dialog open={activeDialog === 'comparison'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Audio Comparison</DialogTitle>
          </DialogHeader>
          <AudioComparison file={file} />
        </DialogContent>
      </Dialog>

      {/* ID3 Tag Editor Dialog */}
      <Dialog open={activeDialog === 'tags'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Edit ID3 Tags</DialogTitle>
          </DialogHeader>
          <ID3TagEditor file={file} onUpdate={handleUpdateFile} />
        </DialogContent>
      </Dialog>

      {/* Audio Analysis Dialog */}
      <Dialog open={activeDialog === 'analysis'} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="bg-slate-800 text-white border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Audio Analysis</DialogTitle>
          </DialogHeader>
          <AudioAnalysis file={file} />
        </DialogContent>
      </Dialog>
    </>
  );
};
