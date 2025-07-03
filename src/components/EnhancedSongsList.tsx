
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Trash2, Music, FileAudio } from 'lucide-react';
import { AudioFile } from '@/types/audio';

interface EnhancedSongsListProps {
  enhancedFiles: AudioFile[];
  onDownload: (file: AudioFile) => void;
  onDelete: (fileId: string) => void;
}

export const EnhancedSongsList = ({ enhancedFiles, onDownload, onDelete }: EnhancedSongsListProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (enhancedFiles.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
        <CardContent className="p-8 text-center">
          <FileAudio className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">No enhanced files yet</p>
          <p className="text-slate-500">Process some audio files to see them here</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {enhancedFiles.map((file) => (
        <Card key={file.id} className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-600 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-green-600/20 rounded-full">
                  <Music className="h-4 w-4 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{file.name}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-400 mt-1">
                    <span>Original: {formatFileSize(file.size)}</span>
                    {file.enhancedSize && (
                      <span>Enhanced: {formatFileSize(file.enhancedSize)}</span>
                    )}
                    <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded">
                      Enhanced
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDownload(file)}
                  className="bg-blue-600/20 border-blue-600 hover:bg-blue-600/30 text-blue-300 h-8 px-3"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(file.id)}
                  className="bg-red-600/20 border-red-600 hover:bg-red-600/30 text-red-300 h-8 px-3"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
