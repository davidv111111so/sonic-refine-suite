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
  onClearAll: () => void;
}

export const IndividualModeQueue = ({
  files,
  selectedFiles,
  onToggleFile,
  onClearAll
}: IndividualModeQueueProps) => {
  const {
    t,
    language
  } = useLanguage();

  return (
    <Card className="bg-slate-900/90 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Music2 className="h-4 w-4 text-cyan-400" />
            <span className="bg-gradient-to-r from-yellow-200 via-cyan-200 to-yellow-200 bg-clip-text text-transparent font-bold animate-pulse">
              {language === 'ES' ? 'Seleccionar Canciones para Procesamiento Individual' : 'Select Songs for Individual Processing'}
            </span>
          </CardTitle>
          {selectedFiles.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs text-red-400 hover:text-red-300 font-bold hover:underline transition-colors"
            >
              {language === 'ES' ? 'Limpiar Todo' : 'Clear All'}
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-60 overflow-y-auto">
        {files.length === 0 ? (
          <p className="bg-gradient-to-r from-cyan-200 to-yellow-200 bg-clip-text text-transparent text-sm text-center py-4 font-bold">
            {language === 'ES' ? 'No hay canciones en la cola' : 'No songs in queue'}
          </p>
        ) : (
          files.map(file => (
            <div key={file.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${selectedFiles.includes(file.id) ? 'bg-blue-900/95 border-cyan-500' : 'bg-slate-800/50 border-slate-700 hover:bg-blue-900/95'}`}>
              <Checkbox checked={selectedFiles.includes(file.id)} onCheckedChange={() => onToggleFile(file.id)} className="border-cyan-500" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate text-amber-200">{file.name}</p>
                <p className="text-xs font-medium text-black dark:text-cyan-300">
                  {file.artist || 'Unknown Artist'}
                </p>
              </div>
              <Badge variant="outline" className="text-xs bg-slate-700 border-slate-600 text-white font-medium">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};