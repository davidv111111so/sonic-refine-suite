
import { useState, useCallback } from 'react';
import { Folder, FolderOpen, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SaveLocationSelectorProps {
  onLocationSelected: (location: string | FileSystemDirectoryHandle) => void;
  currentLocation?: string;
}

export const SaveLocationSelector = ({ onLocationSelected, currentLocation }: SaveLocationSelectorProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(currentLocation || 'Downloads folder');
  const [isSupported, setIsSupported] = useState('showDirectoryPicker' in window);
  const { toast } = useToast();

  const handleSelectLocation = useCallback(async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'downloads'
        });
        
        setSelectedLocation(dirHandle.name);
        onLocationSelected(dirHandle);
        
        toast({
          title: "Save location selected",
          description: `Files will be saved to "${dirHandle.name}" folder`,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          toast({
            title: "Failed to select folder",
            description: "Could not access the selected folder",
            variant: "destructive"
          });
        }
      }
    } else {
      // Fallback for browsers without File System Access API
      toast({
        title: "Browser limitation",
        description: "Your browser will save files to the default Downloads folder",
      });
      onLocationSelected('downloads');
    }
  }, [onLocationSelected, toast]);

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isSupported ? (
              <FolderOpen className="h-5 w-5 text-blue-400" />
            ) : (
              <Download className="h-5 w-5 text-slate-400" />
            )}
            <div>
              <p className="text-sm font-medium text-white">Save Location</p>
              <p className="text-xs text-slate-400">{selectedLocation}</p>
            </div>
          </div>
          
          {isSupported && (
            <Button
              onClick={handleSelectLocation}
              variant="outline"
              size="sm"
              className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
            >
              <Folder className="h-4 w-4 mr-2" />
              Choose Folder
            </Button>
          )}
        </div>
        
        {!isSupported && (
          <p className="text-xs text-slate-500 mt-2">
            Your browser doesn't support folder selection. Files will be saved to your Downloads folder.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
