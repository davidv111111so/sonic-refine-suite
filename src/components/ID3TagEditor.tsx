import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AudioFile } from '@/types/audio';

interface ID3TagEditorProps {
  file: AudioFile;
  onUpdate: (fileId: string, updates: Partial<AudioFile>) => void;
}

export const ID3TagEditor = ({ file, onUpdate }: ID3TagEditorProps) => {
  const [open, setOpen] = useState(false);
  const [artist, setArtist] = useState(file.artist || '');
  const [title, setTitle] = useState(file.title || '');
  const { toast } = useToast();

  const handleSave = () => {
    onUpdate(file.id, { artist, title });
    setOpen(false);
    toast({
      title: "ID3 Tags Updated",
      description: "The audio file's metadata has been updated."
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle>Edit ID3 Tags</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="artist" className="text-right">
              Artist
            </Label>
            <Input
              id="artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3 bg-slate-800 border-slate-700 text-white"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-500 text-white">
            <Save className="h-4 w-4 mr-2" />
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
