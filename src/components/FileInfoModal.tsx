import React from 'react';
import { SimpleModal } from '@/components/ui/SimpleModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AudioFile } from '@/types/audio';
import {
  FileAudio,
  Music,
  Clock,
  FileType,
  Info
} from 'lucide-react';

interface FileInfoModalProps {
  file: AudioFile | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDuration = (seconds: number) => {
  if (!seconds) return 'Unknown';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export const FileInfoModal = ({ file, isOpen, onClose }: FileInfoModalProps) => {
  if (!file) return null;

  const metadata = file.metadata; // Assuming file.metadata exists

  return (
    <SimpleModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-400" />
          <span>File Information</span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* File Header */}
        <div className="flex items-start gap-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <FileAudio className="h-8 w-8 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate text-white" title={file.name}>
              {file.name}
            </h3>
            <p className="text-sm text-slate-400 font-mono mt-1">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <FileType className="h-4 w-4" />
              <span className="text-xs font-medium">Format</span>
            </div>
            <p className="font-mono text-sm text-white">{file.type || 'Unknown'}</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Last Modified</span>
            </div>
            <p className="font-mono text-sm text-white">
              {new Date(file.lastModified).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Metadata Section */}
        {metadata && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Music className="h-4 w-4" />
              Audio Metadata
            </h4>
            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
              <div className="grid grid-cols-[100px_1fr] gap-px bg-slate-700">
                {metadata.format && (
                  <>
                    <div className="bg-slate-800 p-2 text-xs text-slate-400">Format</div>
                    <div className="bg-slate-800 p-2 text-sm text-white">{metadata.format}</div>
                  </>
                )}
                {metadata.channels && (
                  <>
                    <div className="bg-slate-800 p-2 text-xs text-slate-400">Channels</div>
                    <div className="bg-slate-800 p-2 text-sm text-white">{metadata.channels}</div>
                  </>
                )}
                {metadata.sampleRate && (
                  <>
                    <div className="bg-slate-800 p-2 text-xs text-slate-400">Sample Rate</div>
                    <div className="bg-slate-800 p-2 text-sm text-white font-mono">
                      {metadata.sampleRate} Hz
                    </div>
                  </>
                )}
                {metadata.bitDepth && (
                  <>
                    <div className="bg-slate-800 p-2 text-xs text-slate-400">Bit Depth</div>
                    <div className="bg-slate-800 p-2 text-sm text-white font-mono">
                      {metadata.bitDepth} bit
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="secondary">
            Close
          </Button>
        </div>
      </div>
    </SimpleModal>
  );
};