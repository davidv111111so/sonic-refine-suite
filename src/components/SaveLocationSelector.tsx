
import { useState } from 'react';
import { Folder, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface SaveLocationSelectorProps {
  onLocationSelected: (location: string | FileSystemDirectoryHandle) => void;
  currentLocation: string;
}

export const SaveLocationSelector = ({ onLocationSelected, currentLocation }: SaveLocationSelectorProps) => {
  const [selectedLocation, setSelectedLocation] = useState<string>(currentLocation);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const { toast } = useToast();

  const handleSelectFolder = async () => {
    setIsSelectingFolder(true);
    
    try {
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker();
        setSelectedLocation(dirHandle.name || 'Custom folder');
        onLocationSelected(dirHandle);
        
        toast({
          title: "Folder selected",
          description: `Enhanced files will be saved to ${dirHandle.name}`,
        });
      } else {
        // Fallback for browsers that don't support File System Access API
        toast({
          title: "Browser not supported",
          description: "Files will be saved to your Downloads folder",
        });
        setSelectedLocation('Downloads folder');
        onLocationSelected('downloads');
      }
    } catch (error) {
      console.log('Folder selection cancelled or failed');
      toast({
        title: "Folder selection cancelled",
        description: "Using default Downloads folder",
      });
    } finally {
      setIsSelectingFolder(false);
    }
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Download className="h-4 w-4" />
          Save Location
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Folder className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">{selectedLocation}</p>
              <p className="text-xs text-slate-400">Enhanced files destination</p>
            </div>
          </div>
          
          <Button
            onClick={handleSelectFolder}
            disabled={isSelectingFolder}
            variant="outline"
            size="sm"
            className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
          >
            {isSelectingFolder ? (
              <>
                <Folder className="h-3 w-3 mr-2 animate-pulse" />
                Selecting...
              </>
            ) : (
              <>
                <Folder className="h-3 w-3 mr-2" />
                Choose Folder
              </>
            )}
          </Button>
        </div>
        
        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-200">
              <p className="font-medium mb-1">File System Access</p>
              <p className="text-blue-300">
                Choose a custom folder to save enhanced files directly, or use the default Downloads folder.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
