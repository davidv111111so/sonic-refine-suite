import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Music, Play } from 'lucide-react';
import { AudioFile } from '@/types/audio';
interface PlaylistPanelProps {
  files: AudioFile[];
  currentFileId: string | null;
  onFileSelect: (file: AudioFile) => void;
}
export const PlaylistPanel: React.FC<PlaylistPanelProps> = ({
  files,
  currentFileId,
  onFileSelect
}) => {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex items-center gap-2">
        <Music className="h-5 w-5" />
        Playlist ({files.length})
      </h3>

      {files.length === 0 ? <div className="text-center py-12">
          <Music className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-100">No tracks loaded</p>
          <p className="text-sm text-slate-500 mt-2">
            Upload audio files to get started
          </p>
        </div> : <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {files.map(file => {
          const isPlaying = file.id === currentFileId;
          return <div key={file.id} className={`
                    group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer
                    ${isPlaying ? 'bg-cyan-900/30 border-cyan-500/50 shadow-lg shadow-cyan-500/20' : 'bg-slate-800/50 border-slate-700 hover:bg-slate-700/50 hover:border-slate-600'}
                  `} onClick={() => onFileSelect(file)}>
                  <Button variant="ghost" size="icon" className={`
                      h-10 w-10 rounded-full flex-shrink-0
                      ${isPlaying ? 'bg-cyan-500 text-white hover:bg-cyan-600' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}
                    `}>
                    {isPlaying ? <div className="flex gap-1">
                        <div className="w-1 h-4 bg-white animate-pulse" />
                        <div className="w-1 h-4 bg-white animate-pulse delay-75" />
                        <div className="w-1 h-4 bg-white animate-pulse delay-150" />
                      </div> : <Play className="h-4 w-4 ml-0.5" />}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <p className={`
                      text-sm font-medium truncate
                      ${isPlaying ? 'text-cyan-300' : 'text-white'}
                    `}>
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                      {file.duration && <span>{formatDuration(file.duration)}</span>}
                      {file.bpm && <>
                          <span>•</span>
                          <span className="text-amber-400">{file.bpm} BPM</span>
                        </>}
                    </div>
                  </div>

                  {isPlaying && <div className="text-xs font-semibold text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded">
                      NOW PLAYING
                    </div>}
                </div>;
        })}
          </div>
        </ScrollArea>}
    </Card>;
};