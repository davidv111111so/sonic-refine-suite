import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AudioFile } from '@/types/audio';
import { useLanguage } from '@/contexts/LanguageContext';
import { Music2 } from 'lucide-react';
interface IndividualModeQueueProps {
  files: AudioFile[];
  selectedFiles: string[];
  onToggleFile: (fileId: string) => void;
}
export const IndividualModeQueue = ({
  files,
  selectedFiles,
  onToggleFile
}: IndividualModeQueueProps) => {
  const {
    t,
    language
  } = useLanguage();
  return <Card className="bg-slate-900/90 border-slate-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Music2 className="h-4 w-4 text-cyan-400" />
          <span className="text-white font-semibold">
            {language === 'ES' ? 'Seleccionar Canciones para Procesamiento Individual' : 'Select Songs for Individual Processing'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-60 overflow-y-auto">
        {files.length === 0 ? <p className="text-slate-200 text-sm text-center py-4 font-medium">
            {language === 'ES' ? 'No hay canciones en la cola' : 'No songs in queue'}
          </p> : files.map(file => <div key={file.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${selectedFiles.includes(file.id) ? 'bg-cyan-600/20 border-cyan-500' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'}`}>
              <Checkbox checked={selectedFiles.includes(file.id)} onCheckedChange={() => onToggleFile(file.id)} className="border-cyan-500" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{file.name}</p>
                <p className="text-xs font-medium text-stone-950">
                  {file.artist || 'Unknown Artist'}
                </p>
              </div>
              <Badge variant="outline" className="text-xs bg-slate-700 border-slate-600 text-white font-medium">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
            </div>)}
      </CardContent>
    </Card>;
};