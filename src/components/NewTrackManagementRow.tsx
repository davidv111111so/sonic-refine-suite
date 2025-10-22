import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, X, RefreshCw, Info, Download, Loader2, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { AudioFile } from '@/types/audio';
interface NewTrackManagementRowProps {
  file: AudioFile;
  onDownload: (file: AudioFile) => void;
  onConvert: (file: AudioFile, targetFormat: 'mp3' | 'wav' | 'flac') => void;
  onRemove: (fileId: string) => void;
  onFileInfo?: (file: AudioFile) => void;
  onPlayInMediaPlayer?: (file: AudioFile) => void;
  processingSettings?: {
    outputFormat?: string;
  };
}
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
const getFileType = (filename: string): 'mp3' | 'wav' | 'flac' | 'other' => {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'mp3') return 'mp3';
  if (ext === 'wav') return 'wav';
  if (ext === 'flac') return 'flac';
  return 'other';
};
const getFileTypeIcon = (fileType: string) => {
  const icons = {
    mp3: '🎵',
    wav: '🎼',
    flac: '💿',
    other: '📄'
  };
  return icons[fileType as keyof typeof icons] || icons.other;
};
export const NewTrackManagementRow = ({
  file,
  onDownload,
  onConvert,
  onRemove,
  onFileInfo,
  onPlayInMediaPlayer,
  processingSettings
}: NewTrackManagementRowProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileType = getFileType(file.name);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);
  const togglePlayPause = () => {
    if (onPlayInMediaPlayer) {
      onPlayInMediaPlayer(file);
    } else {
      setIsPlaying(!isPlaying);
    }
  };
  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };
  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  const getStatusBadge = (status: AudioFile['status']) => {
    switch (status) {
      case 'uploaded':
        return <Badge className="bg-blue-600 text-white border-blue-500">
            <Clock className="h-3 w-3 mr-1" />
            Queue
          </Badge>;
      case 'processing':
        return <Badge className="bg-orange-600 text-white border-orange-500">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>;
      case 'enhanced':
        return <Badge className="bg-green-600 text-white border-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ready
          </Badge>;
      case 'error':
        return <Badge className="bg-red-600 text-white border-red-500">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Error
          </Badge>;
      default:
        return null;
    }
  };
  const getConversionOptions = () => {
    const options = [];
    if (fileType === 'mp3') {
      options.push({
        format: 'wav' as const,
        label: 'WAV',
        icon: '🎼'
      }, {
        format: 'flac' as const,
        label: 'FLAC',
        icon: '💿'
      });
    } else if (fileType === 'wav') {
      options.push({
        format: 'mp3' as const,
        label: 'MP3',
        icon: '🎵'
      }, {
        format: 'flac' as const,
        label: 'FLAC',
        icon: '💿'
      });
    } else if (fileType === 'flac') {
      options.push({
        format: 'mp3' as const,
        label: 'MP3',
        icon: '🎵'
      }, {
        format: 'wav' as const,
        label: 'WAV',
        icon: '🎼'
      });
    }
    return options;
  };
  const audioUrl = file.originalFile ? URL.createObjectURL(file.originalFile) : file.enhancedUrl || '';
  return <div className="grid grid-cols-8 gap-4 p-4 bg-gradient-to-br from-slate-800/30 to-slate-900/50 border border-slate-600 rounded-lg hover:from-slate-700/40 hover:to-slate-800/60 transition-all duration-300">
      {/* Song Name with Mini Player */}
      <div className="col-span-2 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg flex-shrink-0">{getFileTypeIcon(fileType)}</span>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-bold break-words" style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordBreak: 'break-word'
          }} title={file.name}>
              {file.name}
            </div>
          </div>
        </div>
        
        {/* Mini Player - No Seek Control */}
        {audioUrl && <div className="flex items-center gap-2 mt-1">
            <Button size="sm" variant="outline" onClick={togglePlayPause} className="h-7 w-7 p-0 border-slate-500 bg-zinc-950 hover:bg-zinc-800">
              {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
            </Button>
            <audio ref={audioRef} src={audioUrl} preload="auto" />
            <span className="text-xs text-white font-medium">
              {file.artist || 'Unknown Artist'}
            </span>
          </div>}
      </div>

      {/* Key Analysis */}
      <div className="flex flex-col justify-center">
        <span className="text-xs mb-1 text-emerald-400">Key</span>
        <Badge variant="outline" className="text-xs w-fit bg-purple-700/30 text-purple-200 border-purple-500/50">
          {file.harmonicKey || 'N/A'}
        </Badge>
      </div>

      {/* BPM Analysis */}
      <div className="flex flex-col justify-center">
        <span className="text-xs mb-1 text-emerald-400">BPM</span>
        {file.bpm ? <Badge variant="outline" className="text-xs w-fit bg-cyan-700/30 text-cyan-200 border-cyan-500/50 font-mono">
            {file.bpm}
          </Badge> : <Badge variant="outline" className="text-xs w-fit bg-slate-700/30 text-slate-400 border-slate-500/50">
            -
          </Badge>}
      </div>

      {/* File Size */}
      <div className="flex flex-col justify-center">
        <span className="text-sm font-mono font-bold drop-shadow-lg text-amber-500">
          {formatFileSize(file.size)}
        </span>
      </div>

      {/* Status */}
      <div className="flex flex-col justify-center">
        {getStatusBadge(file.status)}
        {file.progress !== undefined && file.status === 'processing' && <div className="mt-1 w-full bg-slate-700 rounded-full h-2">
            <div className="bg-orange-500 h-2 rounded-full transition-all duration-300" style={{
          width: `${file.progress}%`
        }} />
          </div>}
      </div>

      {/* Conversion */}
      <div className="flex flex-col justify-center gap-1">
        {file.status === 'uploaded' ? <div className="flex flex-wrap gap-1">
            {getConversionOptions().map(option => <Button key={option.format} variant="outline" size="sm" onClick={() => onConvert(file, option.format)} className="text-xs px-2 py-1 h-7 bg-slate-700 border-slate-500 hover:bg-slate-600 text-white" title={`Convert to ${option.label}`}>
                <RefreshCw className="h-3 w-3 mr-1" />
                {option.label}
              </Button>)}
          </div> : <Badge variant="outline" className="text-xs w-fit bg-green-700/30 text-green-200 border-green-500/50">
            {processingSettings?.outputFormat?.toUpperCase() || 'WAV'}
          </Badge>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 pr-2">
        {onFileInfo && <Button variant="outline" size="sm" onClick={() => onFileInfo(file)} className="h-7 w-7 p-0 bg-slate-700 border-slate-500 hover:bg-slate-600 text-orange-400">
            <Info className="h-3 w-3" />
          </Button>}
        <Button variant="outline" size="sm" disabled={file.status !== 'enhanced'} onClick={() => onDownload(file)} className="h-7 w-7 p-0 bg-green-700 border-green-500 hover:bg-green-600 text-white disabled:bg-slate-700 disabled:border-slate-500 disabled:text-slate-400">
          <Download className="h-3 w-3" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => onRemove(file.id)} className="h-7 w-7 p-0 bg-red-700/50 border-red-500 hover:bg-red-600 text-red-200">
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>;
};