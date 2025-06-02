import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Trash2, Edit, Share } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { ID3TagEditor } from '@/components/ID3TagEditor';
import { useToast } from '@/hooks/use-toast';

interface AudioFileActionsProps {
  file: AudioFile;
  onRemove: (fileId: string) => void;
  onUpdate: (fileId: string, updates: Partial<AudioFile>) => void;
}

export const AudioFileActions = ({ file, onRemove, onUpdate }: AudioFileActionsProps) => {
  const { toast } = useToast();

  const handleDownload = () => {
    if (file.enhancedUrl) {
      const a = document.createElement('a');
      a.href = file.enhancedUrl;
      a.download = `${file.name.replace(/\.[^.]+$/, '')}_enhanced.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (file.originalUrl) {
      const a = document.createElement('a');
      a.href = file.originalUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      toast({
        title: "Download failed",
        description: "The file URL is not available.",
        variant: "destructive",
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Share ${file.name}`,
        text: `Check out this audio file: ${file.name}`,
        url: file.originalUrl || file.enhancedUrl || window.location.href,
      }).then(() => {
        toast({
          title: "Shared successfully",
          description: `You have shared ${file.name}`,
        });
      }).catch((error) => {
        toast({
          title: "Share failed",
          description: `Sharing failed: ${error}`,
          variant: "destructive",
        });
      });
    } else {
      toast({
        title: "Sharing not supported",
        description: "Web Share API is not supported in this browser.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Button variant="ghost" size="icon" onClick={handleDownload}>
        <Download className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon">
        <ID3TagEditor file={file} onUpdate={onUpdate} />
      </Button>
      <Button variant="ghost" size="icon" onClick={handleShare}>
        <Share className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => onRemove(file.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
