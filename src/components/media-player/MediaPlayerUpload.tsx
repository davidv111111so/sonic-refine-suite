import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle, ExternalLink } from 'lucide-react';
import { AudioFile } from '@/types/audio';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Progress } from '@/components/ui/progress';

interface MediaPlayerUploadProps {
  onFilesAdded: (files: AudioFile[]) => void;
}

export const MediaPlayerUpload: React.FC<MediaPlayerUploadProps> = ({ onFilesAdded }) => {
  const [hasConsented, setHasConsented] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDragActiveState, setIsDragActiveState] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const processFiles = useCallback(async (files: File[]) => {
    setIsAnalyzing(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        const increment = prev < 50 ? 5 : prev < 80 ? 2 : 1;
        return Math.min(prev + increment, 90);
      });
    }, 100);

    const toastId = toast.loading(`Analyzing ${files.length} file${files.length > 1 ? 's' : ''}...`, {
      description: 'Detecting BPM and key signatures',
    });

    // Import analysis utilities
    const { detectKeyFromFile } = await import('@/utils/keyDetector');
    const { detectBPMFromFile } = await import('@/utils/bpmDetector');

    const audioFiles: AudioFile[] = await Promise.all(
      files.map(async (file, idx) => {
        let harmonicKey = 'N/A';
        let bpm: number | undefined = undefined;

        console.log(`\n📝 [${idx + 1}/${files.length}] Analyzing: ${file.name}`);

        // Analyze in parallel with timeouts
        const [keyResult, bpmResult] = await Promise.allSettled([
          Promise.race([
            detectKeyFromFile(file),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Key timeout')), 5000))
          ]),
          Promise.race([
            detectBPMFromFile(file),
            new Promise((_, reject) => setTimeout(() => reject(new Error('BPM timeout')), 5000))
          ])
        ]);

        if (keyResult.status === 'fulfilled') {
          const keyAnalysis = keyResult.value as any;
          harmonicKey = keyAnalysis.camelot;
          console.log(`✅ Key: ${harmonicKey}`);
        }

        if (bpmResult.status === 'fulfilled') {
          const bpmAnalysis = bpmResult.value as any;
          bpm = bpmAnalysis.bpm;
          console.log(`✅ BPM: ${bpm}`);
        }

        return {
          id: `${Date.now()}-${idx}-${file.name}`,
          name: file.name,
          size: file.size,
          type: file.type,
          originalFile: file,
          originalUrl: URL.createObjectURL(file),
          status: 'uploaded' as const,
          fileType: file.name.split('.').pop()?.toLowerCase() as 'mp3' | 'wav' | 'flac' | 'unsupported',
          harmonicKey,
          bpm,
          duration: 0,
        };
      })
    );

    clearInterval(progressInterval);
    setUploadProgress(100);

    const detectedBPM = audioFiles.filter(f => f.bpm).length;
    const detectedKey = audioFiles.filter(f => f.harmonicKey && f.harmonicKey !== 'N/A').length;

    if (detectedKey === 0 && detectedBPM === 0) {
      toast.error('Analysis failed', {
        id: toastId,
        description: 'Could not detect BPM or Key',
      });
    } else {
      toast.success('Analysis complete!', {
        id: toastId,
        description: `BPM: ${detectedBPM}/${files.length} • Key: ${detectedKey}/${files.length}`,
      });
    }

    onFilesAdded(audioFiles);
    setPendingFiles([]);
    setUploadProgress(0);
    setIsAnalyzing(false);
  }, [onFilesAdded]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setIsDragActiveState(false);

    // Always require consent - don't bypass terms and conditions
    if (!hasConsented) {
      setPendingFiles(acceptedFiles);
      toast.error('Please accept the Terms and Conditions before uploading files.');
      return;
    }

    processFiles(acceptedFiles);
  }, [hasConsented, processFiles]);

  const { getRootProps, getInputProps, isDragReject, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActiveState(true),
    onDragLeave: () => setIsDragActiveState(false),
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac'],
      'video/*': ['.mp4', '.m4v', '.mov', '.webm']
    },
    multiple: true,
    disabled: !hasConsented
  });

  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setHasConsented(checked);

    if (checked && pendingFiles.length > 0) {
      processFiles(pendingFiles);
    }
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative group cursor-pointer transition-all duration-500 ease-out",
          "border-2 border-dashed rounded-2xl p-6", // Removed mt-8 to fit better in media player
          "flex flex-row items-center justify-center gap-6",
          "bg-slate-900/40 backdrop-blur-sm",
          !hasConsented && "opacity-50 cursor-not-allowed",
          (isDragActive || isDragActiveState)
            ? "border-cyan-400 bg-cyan-950/30 scale-[1.01] shadow-[0_0_20px_rgba(34,211,238,0.15)]"
            : "border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/50",
          isDragReject && "border-red-500 bg-red-950/30"
        )}
      >
        <input {...getInputProps()} disabled={!hasConsented} />

        {/* Animated Icon Container - Smaller */}
        <div className={cn(
          "relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500",
          "bg-gradient-to-br from-cyan-500/20 to-blue-600/20",
          "border border-cyan-500/30",
          (isDragActive || isDragActiveState) ? "scale-110 shadow-[0_0_20px_rgba(34,211,238,0.3)]" : "group-hover:scale-105"
        )}>
          <div className="absolute inset-0 rounded-full bg-cyan-400/10 animate-pulse-slow" />
          <Upload className={cn(
            "w-5 h-5 text-cyan-400 transition-all duration-500",
            (isDragActive || isDragActiveState) ? "scale-110 text-cyan-300" : "group-hover:scale-110"
          )} />
        </div>

        {/* Text Content - Compact */}
        <div className="text-left space-y-1">
          <h3 className={cn(
            "text-lg font-bold tracking-tight transition-colors duration-300",
            (isDragActive || isDragActiveState) ? "text-cyan-300" : "text-white group-hover:text-cyan-100"
          )}>
            {(isDragActive || isDragActiveState) ? "Drop files here" : "Drag & Drop or Click to Upload"}
          </h3>
          <p className="text-slate-400 text-xs font-medium">
            MP3, WAV, FLAC, MP4, Video
          </p>
        </div>
      </div>

      {/* Consent Checkbox */}
      <div className="mt-4 flex items-start justify-center gap-3 px-4">
        <input
          type="checkbox"
          id="media-player-consent"
          checked={hasConsented}
          onChange={handleConsentChange}
          className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900"
        />
        <label htmlFor="media-player-consent" className="text-xs text-slate-400 leading-relaxed max-w-2xl">
          I agree to the{' '}
          <Link
            to="/terms"
            className="text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1"
            target="_blank"
          >
            Terms and Conditions
            <ExternalLink className="h-3 w-3" />
          </Link>
          {' '}and acknowledge the Copyright Disclaimer. I confirm that I own or have proper authorization
          for all audio files I upload and process.
        </label>
      </div>

      {/* Warning if not consented */}
      {!hasConsented && (
        <div className="mt-4 p-3 rounded-md bg-yellow-900/20 border border-yellow-600/30 text-yellow-200/80 flex items-center justify-center text-xs">
          <AlertCircle className="h-3 w-3 mr-2 flex-shrink-0" />
          Please accept the Terms and Conditions to enable file uploads.
        </div>
      )}

      {/* Progress Bar */}
      {isAnalyzing && (
        <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Analyzing audio...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </div>
      )}
    </div>
  );
};
