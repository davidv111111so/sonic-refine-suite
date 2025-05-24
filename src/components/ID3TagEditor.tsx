
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AudioFile } from '@/pages/Index';
import { Save, Tag, Music, User2, Calendar, Globe, Tags } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ID3TagEditorProps {
  file: AudioFile;
  onUpdate: (fileId: string, updates: Partial<AudioFile>) => void;
}

export const ID3TagEditor = ({ file, onUpdate }: ID3TagEditorProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: file.title || '',
    artist: file.artist || '',
    album: '',
    year: '',
    genre: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onUpdate(file.id, {
      title: formData.title,
      artist: formData.artist,
    });
    
    toast({
      title: "Tags updated",
      description: "The ID3 tags have been updated for this file",
    });
  };

  const genres = [
    "Pop", "Rock", "Hip-Hop", "Electronic", "Jazz", "Classical", "R&B", "Country", 
    "Metal", "Blues", "Folk", "Reggae", "Ambient", "Punk", "Indie", "Other"
  ];

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Tag className="h-5 w-5" />
          ID3 Tag Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Title */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Title
            </Label>
            <Input 
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)} 
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          {/* Artist */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User2 className="h-4 w-4" />
              Artist
            </Label>
            <Input 
              value={formData.artist}
              onChange={(e) => handleChange('artist', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          {/* Album */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              Album
            </Label>
            <Input 
              value={formData.album}
              onChange={(e) => handleChange('album', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          {/* Year and Genre in a grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Year
              </Label>
              <Input 
                value={formData.year}
                onChange={(e) => handleChange('year', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tags className="h-4 w-4" />
                Genre
              </Label>
              <Select
                value={formData.genre}
                onValueChange={(value) => handleChange('genre', value)}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select genre" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <Button 
          onClick={handleSave}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Tags
        </Button>
      </CardContent>
    </Card>
  );
};
